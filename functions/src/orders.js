const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  generateSequentialId,
  generateStructuredOrderId,
  verifyAuthToken,
  getUserFromToken,
  verifyAdminAuth,
  getUserRoleAndCity
} = require("./utils/helpers");
const admin = require("firebase-admin");

// Helper function to update space booking status intelligently
const updateSpaceBookingStatus = async (db, spaceId, orderId, orderStatus, pricingType, operation = 'create') => {
  if (!spaceId) {
    console.warn('⚠️ No spaceId provided for booking status update');
    return;
  }

  const spaceRef = db.collection('spaces').doc(spaceId);
  const spaceDoc = await spaceRef.get();
  
  if (!spaceDoc.exists) {
    console.warn(`⚠️ Space ${spaceId} not found when trying to update booking status`);
    return;
  }

  // Get all orders for this space to determine overall booking status
  // Only confirmed and active orders should make space booked
  const ordersQuery = await db.collection('orders')
    .where('spaceId', '==', spaceId)
    .where('status', 'in', ['confirmed', 'active'])
    .get();

  const activeOrders = [];
  ordersQuery.forEach(doc => {
    const orderData = doc.data();
    // Skip the current order if we're deleting it
    if (operation === 'delete' && doc.id === orderId) {
      return;
    }
    activeOrders.push({
      id: doc.id,
      ...orderData
    });
  });

  // If we're creating a new order with confirmed/active status, include it in the calculation
  if (operation === 'create' && ['confirmed', 'active'].includes(orderStatus)) {
    activeOrders.push({
      id: orderId,
      status: orderStatus,
      pricingType: pricingType
    });
  }

  // For hourly and halfday bookings, space can have multiple concurrent bookings
  // For daily/monthly bookings, space should be marked as fully booked
  const hasFullDayBookings = activeOrders.some(order => 
    ['daily', 'monthly'].includes(order.pricingType)
  );

  const hasActiveBookings = activeOrders.length > 0;

  // Determine new booking status
  let isBooked = false;
  let bookingOrderId = null;

  if (hasFullDayBookings) {
    // If there are any full-day bookings, space is booked
    isBooked = true;
    const fullDayOrder = activeOrders.find(order => 
      ['daily', 'monthly'].includes(order.pricingType)
    );
    bookingOrderId = fullDayOrder.id;
  } else if (hasActiveBookings) {
    // If only hourly/halfday bookings, space is partially booked
    isBooked = false; // Keep as false for hourly/halfday-only bookings
    bookingOrderId = null; // Don't set a specific order ID
  } else {
    // No active bookings
    isBooked = false;
    bookingOrderId = null;
  }

  // Update space
  const spaceUpdate = {
    isBooked: isBooked,
    lastBookingUpdate: new Date()
  };

  if (bookingOrderId) {
    spaceUpdate.bookingOrderId = bookingOrderId;
  } else {
    spaceUpdate.bookingOrderId = admin.firestore.FieldValue.delete();
  }

  await spaceRef.update(spaceUpdate);

  console.log(`✅ Space ${spaceId} booking status updated: ${isBooked ? 'booked' : 'available'} (${activeOrders.length} confirmed/active orders, ${hasFullDayBookings ? 'has full-day bookings' : 'hourly/halfday only'})`);
};

// Main orders function
const orders = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllOrders(req, res);
        } else if (pathParts.length === 1) {
          return await getOrderById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        // POST /orders - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, { message: 'Admin access required' }, 403);
        }
        return await createOrder(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /orders/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, { message: 'Admin access required' }, 403);
        }
        return await updateOrder(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /orders/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, { message: 'Admin access required' }, 403);
        }
        return await deleteOrder(pathParts[0], req, res);
      } else if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'migrate') {
        // POST /orders/migrate - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, { message: 'Admin access required' }, 403);
        }
        return await migrateOrders(req, res);
      }

      handleResponse(res, { message: 'Order route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /orders
const getAllOrders = async (req, res) => {
  try {
    const db = getDb();
    const { status, limit, offset = 0, search, customerEmail, customerId, spaceId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    let ordersRef = db.collection('orders');

    // Role-based restriction: if requester is staff, restrict orders to their city
    const { role: requesterRole, cityId: requesterCityId } = await getUserRoleAndCity(req);
    if (requesterRole === 'staff' && requesterCityId) {
      // Orders currently don't store cityId directly. We'll filter later after fetching.
    }

    // Apply filters
    if (status) {
      ordersRef = ordersRef.where('status', '==', status);
    }

    if (customerEmail) {
      ordersRef = ordersRef.where('customerEmail', '==', customerEmail);
    }

    if (customerId) {
      ordersRef = ordersRef.where('customerId', '==', customerId);
    }

    if (spaceId) {
      ordersRef = ordersRef.where('spaceId', '==', spaceId);
    }

    // Apply sorting
    ordersRef = ordersRef.orderBy(sortBy, sortOrder);
    
    const snapshot = await ordersRef.get();
    let orders = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure date fields are serialized as ISO strings
      const startDate = data.startDate && data.startDate.toDate ? data.startDate.toDate().toISOString() : data.startDate;
      const endDate = data.endDate && data.endDate.toDate ? data.endDate.toDate().toISOString() : data.endDate;
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

      // If staff with city restriction, we'll filter based on data.cityId (if exists)
      if (requesterRole === 'staff' && requesterCityId) {
        if (data.cityId && data.cityId !== requesterCityId) {
          return; // Skip orders not in staff city
        }
      }

      orders.push({
        id: doc.id,  // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
        ...data,
        startDate,
        endDate,
        createdAt
      });
    });

    // Apply search filter after fetching (for flexible text search)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order =>
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.spaceName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count before pagination
    const totalOrders = orders.length;

    // Apply pagination (offset and limit)
    const offsetNum = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || orders.length;
    orders = orders.slice(offsetNum, offsetNum + limitNum);

    console.log(`✅ Retrieved ${orders.length} orders (${offsetNum + 1}-${offsetNum + orders.length} of ${totalOrders})${customerEmail ? ` for customer ${customerEmail}` : ''}${customerId ? ` for customer ID ${customerId}` : ''}${spaceId ? ` for space ID ${spaceId}` : ''}`);
    handleResponse(res, { 
      orders, 
      total: totalOrders,
      pagination: {
        offset: offsetNum,
        limit: limitNum,
        total: totalOrders,
        hasMore: (offsetNum + orders.length) < totalOrders
      }
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    handleError(res, error);
  }
};

// GET /orders/:id
const getOrderById = async (orderId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('orders').doc(orderId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Order not found' }, 404);
    }

    const data = doc.data();
    
    const startDate = data.startDate && data.startDate.toDate ? data.startDate.toDate().toISOString() : data.startDate;
    const endDate = data.endDate && data.endDate.toDate ? data.endDate.toDate().toISOString() : data.endDate;
    handleResponse(res, { 
      id: doc.id,  // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
      ...data,
      startDate,
      endDate
    });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /orders
const createOrder = async (req, res) => {
  try {
    const db = getDb();
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      spaceId,
      spaceName,
      amountBase, // Changed from amount to amountBase
      invoiceId = null, // New field for invoice reference
      pricingType = 'daily',
      startDate,
      endDate,
      status = 'pending',
      notes = '',
      source = 'manual'
    } = req.body;

    // Validate required fields (service fields are now optional)
    validateRequired(req.body, ['customerId', 'customerName', 'spaceId', 'amountBase', 'startDate', 'endDate']);

    // Generate structured OrderID (service type removed)
    const orderId = await generateStructuredOrderId(source);

    // Get user info from auth token if available
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;

    // Debug logging for datetime values
    console.log('📅 CREATE - Original startDate:', startDate);
    console.log('📅 CREATE - Original endDate:', endDate);
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    console.log('📅 CREATE - Converted startDate:', startDateObj);
    console.log('📅 CREATE - Converted endDate:', endDateObj);
    
    const orderData = {
      orderId: orderId,  // Structured order ID like "ORD-20250701-GEN-MAN-0001"
      customerId: sanitizeString(customerId), // Real customer ID from form
      customerName: sanitizeString(customerName),
      customerEmail: sanitizeString(customerEmail),
      customerPhone: customerPhone ? sanitizeString(customerPhone) : null,
      spaceId: sanitizeString(spaceId),
      spaceName: sanitizeString(spaceName || ''),
      amountBase: parseFloat(amountBase), // Base price before tax
      invoiceId: invoiceId, // Reference to invoice (null if not yet generated)
      pricingType: sanitizeString(pricingType),
      startDate: startDateObj,
      endDate: endDateObj,
      status: sanitizeString(status),
      notes: sanitizeString(notes),
      source: sanitizeString(source),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user ? user.uid : 'system',
      createdByEmail: user ? user.email : 'system'
    };

    // --- NEW: attach cityId for easier filtering ---
    try {
      if (spaceId) {
        const spaceDoc = await db.collection('spaces').doc(spaceId).get();
        if (spaceDoc.exists) {
          const spaceData = spaceDoc.data();
          const buildingIdFromSpace = spaceData.buildingId;
          if (buildingIdFromSpace) {
            const buildingDoc = await db.collection('buildings').doc(buildingIdFromSpace).get();
            if (buildingDoc.exists) {
              const buildingData = buildingDoc.data();
              if (buildingData.cityId) {
                orderData.cityId = buildingData.cityId;
              }
            }
          }
        }
      }
    } catch (cityErr) {
      console.warn('⚠️ Unable to attach cityId to order', cityErr);
    }
    // --- END NEW ---

    // Use orderId as document name instead of auto-generated ID
    await db.collection('orders').doc(orderId).set(orderData);

    // Update space booking status based on order status and pricing type
    try {
      await updateSpaceBookingStatus(db, spaceId, orderId, status, pricingType, 'create');
    } catch (err) {
      console.warn('⚠️ Unable to update space booking status:', err.message);
    }

    // Return response with orderId as the main ID
    handleResponse(res, { 
      id: orderId,
      ...orderData 
    }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /orders/:id
const updateOrder = async (orderId, req, res) => {
  try {
    const db = getDb();
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return handleResponse(res, { message: 'Order not found' }, 404);
    }

    // Get user info from auth token if available
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;

    const prevData = orderDoc.data();

    const updateData = { ...req.body };
    delete updateData.id;
    
    // Handle datetime fields properly
    if (updateData.startDate) {
      console.log('📅 Original startDate:', updateData.startDate);
      updateData.startDate = new Date(updateData.startDate);
      console.log('📅 Converted startDate:', updateData.startDate);
    }
    if (updateData.endDate) {
      console.log('📅 Original endDate:', updateData.endDate);
      updateData.endDate = new Date(updateData.endDate);
      console.log('📅 Converted endDate:', updateData.endDate);
    }
    
    // Add update tracking
    updateData.updatedAt = new Date();
    updateData.updatedBy = user ? user.uid : 'system';
    updateData.updatedByEmail = user ? user.email : 'system';

    try {
      const newStatus = updateData.status || prevData.status;
      const spaceIdToUpdate = updateData.spaceId || prevData.spaceId;
      const pricingType = updateData.pricingType || prevData.pricingType;

      // First update the order
      await db.collection('orders').doc(orderId).update(updateData);
      
      // Then update space booking status
      if (spaceIdToUpdate) {
        await updateSpaceBookingStatus(db, spaceIdToUpdate, orderId, newStatus, pricingType, 'update');
      } else {
        console.warn(`⚠️ No spaceId found in order ${orderId}`);
      }
    } catch (err) {
      console.warn('⚠️ Unable to sync space booking status:', err.message);
      console.error(err);
      // If transaction fails, try to at least update the order
      await db.collection('orders').doc(orderId).update(updateData);
    }

    const updatedDoc = await db.collection('orders').doc(orderId).get();
    const data = updatedDoc.data();
    handleResponse(res, { 
      id: orderId,  // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
      ...data 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    handleError(res, error);
  }
};

// DELETE /orders/:id
const deleteOrder = async (orderId, req, res) => {
  try {
    const db = getDb();
    
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return handleResponse(res, { message: 'Order not found' }, 404);
    }

    const orderData = orderDoc.data();
    
    // Free up the space and delete order
    try {
      const spaceId = orderData.spaceId;
      const pricingType = orderData.pricingType;
      
      // First delete the order
      await db.collection('orders').doc(orderId).delete();
      
      // Then update space booking status
      if (spaceId) {
        console.log(`🔄 Updating space ${spaceId} booking status after deleting order ${orderId}`);
        await updateSpaceBookingStatus(db, spaceId, orderId, null, pricingType, 'delete');
        console.log(`✅ Successfully updated space ${spaceId} after deleting order ${orderId}`);
      } else {
        console.warn(`⚠️ No spaceId found in order ${orderId}`);
      }
    } catch (err) {
      console.error('❌ Error while deleting order and updating space:', err);
      // If delete fails, try to at least delete the order
      await db.collection('orders').doc(orderId).delete();
    }
    
    handleResponse(res, { message: 'Order deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    handleError(res, error);
  }
};

// POST /orders/migrate - Migrate existing orders to new structure
const migrateOrders = async (req, res) => {
  try {
    const db = getDb();
    console.log('🔄 Starting orders migration...');
    
    // Get all existing orders
    const ordersSnapshot = await db.collection('orders').get();
    
    if (ordersSnapshot.empty) {
      return handleResponse(res, { 
        message: 'No orders found to migrate.',
        migratedCount: 0 
      });
    }

    console.log(`📊 Found ${ordersSnapshot.size} orders to migrate.`);
    
    const batch = db.batch();
    const migrationResults = [];
    
    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      const oldDocId = doc.id;
      
              // Check if this order needs migration (missing 'orderId' field or has old 'id' field)
        if (data.id || !data.orderId) {
          const orderId = data.id || oldDocId; // Use data.id if exists, otherwise use document ID
          
          // Prepare new data structure
          const newData = {
            ...data,
            orderId: orderId, // Add orderId field
            // Keep original customerId, don't overwrite it
          };
          
          // Remove the old 'id' field if it exists
          if (newData.id) {
            delete newData.id;
          }
          
          // If orderId is different from document ID, create new document
          if (oldDocId !== orderId) {
            // Create new document with orderId as document name
            const newDocRef = db.collection('orders').doc(orderId);
            batch.set(newDocRef, newData);
            
            // Delete old document
            batch.delete(doc.ref);
            
            migrationResults.push({
              oldDocId,
              newDocId: orderId,
              orderId: orderId,
              customerId: data.customerId,
              action: 'moved_document'
            });
            
            console.log(`📝 Moving document: ${oldDocId} -> ${orderId}`);
          } else {
            // Just update the existing document with orderId field
            batch.update(doc.ref, { orderId: orderId });
            
            migrationResults.push({
              oldDocId,
              newDocId: oldDocId,
              orderId: orderId,
              customerId: data.customerId,
              action: 'added_orderId'
            });
            
            console.log(`📝 Adding orderId to existing document: ${oldDocId}`);
          }
      } else {
        console.log(`⚠️  Order ${oldDocId} already has correct structure, skipping.`);
      }
    });
    
    if (migrationResults.length > 0) {
      // Execute batch operation
      await batch.commit();
      console.log(`✅ Successfully migrated ${migrationResults.length} orders.`);
      
      handleResponse(res, {
        message: `Successfully migrated ${migrationResults.length} orders.`,
        migratedCount: migrationResults.length,
        results: migrationResults
      });
    } else {
      handleResponse(res, {
        message: 'All orders already have correct structure.',
        migratedCount: 0
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    handleError(res, error);
  }
};

// Function to update order statuses based on their dates
const updateOrderStatuses = async () => {
  try {
    const db = getDb();
    console.log('🔄 Starting order status updates based on dates...');
    
    const now = new Date();
    const batch = db.batch();
    let updatedCount = { active: 0, completed: 0 };
    
    // Get confirmed orders that should be active (current date >= start date)
    const confirmedOrdersSnapshot = await db.collection('orders')
      .where('status', '==', 'confirmed')
      .get();
    
    if (!confirmedOrdersSnapshot.empty) {
      console.log(`📊 Found ${confirmedOrdersSnapshot.size} confirmed orders to check...`);
      
      confirmedOrdersSnapshot.forEach(doc => {
        const order = doc.data();
        const startDate = order.startDate instanceof Date ? order.startDate : new Date(order.startDate);
        
        // If start date has arrived or passed, update to active
        if (startDate <= now) {
          console.log(`📝 Updating order ${doc.id} from confirmed to active (start date: ${startDate.toISOString()})`);
          batch.update(doc.ref, { 
            status: 'active',
            updatedAt: now,
            statusUpdateReason: 'Automatic update - booking period started'
          });
          
          // Space should remain booked (confirmed -> active both are booked statuses)
          // No need to update space status as it should already be booked
          
          updatedCount.active++;
        }
      });
    }
    
    // Get active/ongoing orders that should be completed (current date > end date)
    const activeOrdersSnapshot = await db.collection('orders')
      .where('status', 'in', ['active', 'ongoing', 'in-progress'])
      .get();
    
    if (!activeOrdersSnapshot.empty) {
      console.log(`📊 Found ${activeOrdersSnapshot.size} active orders to check...`);
      
      activeOrdersSnapshot.forEach(doc => {
        const order = doc.data();
        const endDate = order.endDate instanceof Date ? order.endDate : new Date(order.endDate);
        
        // If end date has passed, update to completed
        if (endDate < now) {
          console.log(`📝 Updating order ${doc.id} from ${order.status} to completed (end date: ${endDate.toISOString()})`);
          
          batch.update(doc.ref, { 
            status: 'completed',
            updatedAt: now,
            statusUpdateReason: 'Automatic update - booking period ended'
          });
          
          // Free up the space when order is completed
          try {
            if (order.spaceId) {
              batch.update(db.collection('spaces').doc(order.spaceId), { 
                isBooked: false, 
                bookingOrderId: admin.firestore.FieldValue.delete() 
              });
              console.log(`📝 Freeing space ${order.spaceId} as order ${doc.id} is completed`);
            }
          } catch (err) {
            console.warn(`⚠️ Could not update space ${order.spaceId} booking status:`, err.message);
          }
          
          updatedCount.completed++;
        }
      });
    }
    
    // Execute all updates in a batch
    if (updatedCount.active > 0 || updatedCount.completed > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updatedCount.active} orders to active and ${updatedCount.completed} orders to completed`);
    } else {
      console.log('ℹ️ No orders needed status updates');
    }
    
    return updatedCount;
  } catch (error) {
    console.error('❌ Error updating order statuses:', error);
    throw error;
  }
};

// POST /orders/update-statuses - Update order statuses based on dates
const updateOrderStatusesEndpoint = async (req, res) => {
  try {
    const results = await updateOrderStatuses();
    handleResponse(res, {
      message: 'Order statuses updated successfully',
      updated: results
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Function to fix all spaces with incorrect booking status
const fixSpacesBookingStatus = async () => {
  try {
    const db = getDb();
    console.log('🔄 Starting space booking status fix...');
    
    // Get all spaces that are marked as booked
    const bookedSpacesSnapshot = await db.collection('spaces')
      .where('isBooked', '==', true)
      .get();
    
    if (bookedSpacesSnapshot.empty) {
      console.log('No booked spaces found.');
      return { fixed: 0 };
    }
    
    console.log(`Found ${bookedSpacesSnapshot.size} spaces marked as booked.`);
    
    // Get all orders that should have booked spaces (only confirmed and active)
    const activeOrdersSnapshot = await db.collection('orders')
      .where('status', 'in', ['confirmed', 'active'])
      .get();
    
    // Create a map of space IDs that should be booked
    const shouldBeBooked = new Map();
    activeOrdersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.spaceId) {
        shouldBeBooked.set(order.spaceId, doc.id);
      }
    });
    
    console.log(`Found ${shouldBeBooked.size} spaces that should be booked based on confirmed/active orders.`);
    
    // Fix spaces with incorrect booking status
    const batch = db.batch();
    let fixedCount = 0;
    
    // Check spaces marked as booked but shouldn't be
    bookedSpacesSnapshot.forEach(doc => {
      const spaceId = doc.id;
      if (!shouldBeBooked.has(spaceId)) {
        console.log(`Space ${spaceId} is marked as booked but has no active order - fixing...`);
        batch.update(doc.ref, { 
          isBooked: false, 
          bookingOrderId: admin.firestore.FieldValue.delete() 
        });
        fixedCount++;
      }
    });
    
    // Check spaces that should be booked but aren't
    const allSpacesSnapshot = await db.collection('spaces').get();
    allSpacesSnapshot.forEach(doc => {
      const spaceId = doc.id;
      const spaceData = doc.data();
      const orderId = shouldBeBooked.get(spaceId);
      
      if (orderId && (!spaceData.isBooked || spaceData.bookingOrderId !== orderId)) {
        console.log(`Space ${spaceId} should be booked for order ${orderId} but isn't - fixing...`);
        batch.update(doc.ref, { 
          isBooked: true, 
          bookingOrderId: orderId 
        });
        fixedCount++;
      }
    });
    
    // Commit all changes
    if (fixedCount > 0) {
      await batch.commit();
      console.log(`✅ Fixed booking status for ${fixedCount} spaces.`);
    } else {
      console.log('ℹ️ No spaces needed booking status fixes.');
    }
    
    return { fixed: fixedCount };
  } catch (error) {
    console.error('❌ Error fixing space booking statuses:', error);
    throw error;
  }
};

// POST /orders/fix-spaces - Fix spaces with incorrect booking status
const fixSpacesBookingStatusEndpoint = async (req, res) => {
  try {
    const results = await fixSpacesBookingStatus();
    handleResponse(res, {
      message: 'Space booking statuses fixed successfully',
      fixed: results.fixed
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update main orders function to include the new endpoint
const ordersWithStatusUpdates = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      // Add new endpoint
      if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'update-statuses') {
        return await updateOrderStatusesEndpoint(req, res);
      }

      // Add space booking fix endpoint
      if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'fix-spaces') {
        return await fixSpacesBookingStatusEndpoint(req, res);
      }

      // Delegate to original orders function
      return await orders(req, res);
    } catch (error) {
      handleError(res, error);
    }
  });
});

module.exports = { 
  orders: ordersWithStatusUpdates,
  updateOrderStatuses,  // Export for scheduled tasks
  fixSpacesBookingStatus  // Export for manual fixes
}; 