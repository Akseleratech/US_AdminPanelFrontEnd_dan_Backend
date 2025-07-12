const {onRequest} = require('firebase-functions/v2/https');
const cors = require('./utils/corsConfig');
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
  getUserRoleAndCity,
  getCurrentTaxRate,
} = require('./utils/helpers');
const admin = require('firebase-admin');

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
  ordersQuery.forEach((doc) => {
    const orderData = doc.data();
    // Skip the current order if we're deleting it
    if (operation === 'delete' && doc.id === orderId) {
      return;
    }
    activeOrders.push({
      id: doc.id,
      ...orderData,
    });
  });

  // If we're creating a new order with confirmed/active status, include it in the calculation
  if (operation === 'create' && ['confirmed', 'active'].includes(orderStatus)) {
    activeOrders.push({
      id: orderId,
      status: orderStatus,
      pricingType: pricingType,
    });
  }

  // For hourly and halfday bookings, space can have multiple concurrent bookings
  // For daily/monthly bookings, space should be marked as fully booked
  const hasFullDayBookings = activeOrders.some((order) =>
    ['daily', 'monthly'].includes(order.pricingType),
  );

  const hasActiveBookings = activeOrders.length > 0;

  // Determine new booking status
  let isBooked = false;
  let bookingOrderId = null;

  if (hasFullDayBookings) {
    // If there are any full-day bookings, space is booked
    isBooked = true;
    const fullDayOrder = activeOrders.find((order) =>
      ['daily', 'monthly'].includes(order.pricingType),
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
    lastBookingUpdate: new Date(),
  };

  if (bookingOrderId) {
    spaceUpdate.bookingOrderId = bookingOrderId;
  } else {
    spaceUpdate.bookingOrderId = admin.firestore.FieldValue.delete();
  }

  await spaceRef.update(spaceUpdate);

  console.log(`✅ Space ${spaceId} booking status updated: ${isBooked ? 'booked' : 'available'} (${activeOrders.length} confirmed/active orders, ${hasFullDayBookings ? 'has full-day bookings' : 'hourly/halfday only'})`);
};

// Auto-generate invoice for confirmed order without invoiceId
const autoGenerateInvoiceForOrder = async (db, orderId) => {
  try {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return;

    const order = orderDoc.data();
    if (order.status !== 'confirmed') return; // only for confirmed orders
    if (order.invoiceId) return; // already has invoice

    // Generate new invoice ID using helpers
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const invoiceId = await generateSequentialId(`invoices_${year}_${month}`, 'INV', 4);

    // --- Fetch customer phone if not present ---
    let customerPhone = order.customerPhone || null;
    if (!customerPhone && order.customerId) {
      try {
        const customerDoc = await db.collection('customers').doc(order.customerId).get();
        if (customerDoc.exists) {
          customerPhone = customerDoc.data().phone || null;
        }
      } catch (custErr) {
        console.warn('⚠️ Unable to fetch customer phone:', custErr.message);
      }
    }

    const taxRate = await getCurrentTaxRate();
    const taxAmount = order.amountBase * taxRate;
    const total = order.amountBase + taxAmount;

    // Derive service and city names for reporting
    const serviceName = order.serviceName || order.spaceName || 'Unknown Service';
    const cityName = order.cityName || 'Unknown City';

    const issuedDate = now;
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const invoiceData = {
      orderId: orderId,
      orderIds: [orderId],
      spaceName: order.spaceName || serviceName,
      serviceName,
      cityName,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone,
      amountBase: order.amountBase,
      taxRate,
      taxAmount,
      discountRate: 0,
      discountAmount: 0,
      total,
      items: [
        {
          description: serviceName,
          quantity: 1,
          unitPrice: order.amountBase,
          amount: order.amountBase,
        },
      ],
      notes: `Invoice for ${order.spaceName || 'space'} booking (${order.startDate ? new Date(order.startDate).toISOString().split('T')[0] : ''} - ${order.endDate ? new Date(order.endDate).toISOString().split('T')[0] : ''})`,
      status: 'draft',
      issuedDate,
      dueDate,
      paidDate: null,
      paidAmount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      createdByEmail: 'system',
    };

    await db.collection('invoices').doc(invoiceId).set(invoiceData);
    await orderRef.update({invoiceId});

    console.log(`🧾 Auto-generated invoice ${invoiceId} for order ${orderId}`);
  } catch (err) {
    console.error('❌ Failed to auto-generate invoice for order', orderId, err);
  }
};

// Main orders function
const orders = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);

      if (pathParts[0] === 'api') pathParts.shift();
      // NEW: strip 'orders' segment
      if (pathParts[0] === 'orders') pathParts.shift();

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllOrders(req, res);
        } else if (pathParts.length === 1) {
          return await getOrderById(pathParts[0], req, res);
        }
      } else if (method === 'POST' && pathParts.length === 0) {
        // POST /orders - Allow admin or staff
        const {role: requesterRole} = await getUserRoleAndCity(req);
        if (requesterRole !== 'admin' && requesterRole !== 'staff') {
          return handleResponse(res, {message: 'Admin or Staff access required'}, 403);
        }
        return await createOrder(req, res, requesterRole);
      } else if (method === 'PUT' && pathParts.length === 1) {
        // PUT /orders/:id - Allow admin or staff (city-scoped)
        const {role: requesterRole} = await getUserRoleAndCity(req);
        if (requesterRole !== 'admin' && requesterRole !== 'staff') {
          return handleResponse(res, {message: 'Admin or Staff access required'}, 403);
        }
        return await updateOrder(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        // DELETE /orders/:id - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await deleteOrder(pathParts[0], req, res);
      } else if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'migrate') {
        // POST /orders/migrate - Require admin auth
        const isAdmin = await verifyAdminAuth(req);
        if (!isAdmin) {
          return handleResponse(res, {message: 'Admin access required'}, 403);
        }
        return await migrateOrders(req, res);
      }

      handleResponse(res, {message: 'Order route not found'}, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /orders
const getAllOrders = async (req, res) => {
  try {
    const db = getDb();
    const {status, limit, offset = 0, search, customerEmail, customerId, spaceId, sortBy = 'createdAt', sortOrder = 'desc'} = req.query;
    let ordersRef = db.collection('orders');

    // Role-based restriction: if requester is staff, restrict orders to their city
    const {role: requesterRole, cityId: requesterCityId} = await getUserRoleAndCity(req);
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

    snapshot.forEach((doc) => {
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
        id: doc.id, // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
        ...data,
        startDate,
        endDate,
        createdAt,
      });
    });

    // Apply search filter after fetching (for flexible text search)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter((order) =>
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.spaceName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower),
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
        hasMore: (offsetNum + orders.length) < totalOrders,
      },
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
      return handleResponse(res, {message: 'Order not found'}, 404);
    }

    const data = doc.data();

    const startDate = data.startDate && data.startDate.toDate ? data.startDate.toDate().toISOString() : data.startDate;
    const endDate = data.endDate && data.endDate.toDate ? data.endDate.toDate().toISOString() : data.endDate;
    handleResponse(res, {
      id: doc.id, // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
      ...data,
      startDate,
      endDate,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /orders
const createOrder = async (req, res, requesterRole) => {
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
      source = 'manual',
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
      orderId: orderId, // Structured order ID like "ORD-20250701-GEN-MAN-0001"
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
      createdByEmail: user ? user.email : 'system',
    };

    // --- NEW: attach cityId for easier filtering ---
    try {
      if (spaceId) {
        const spaceDoc = await db.collection('spaces').doc(spaceId).get();
        if (spaceDoc.exists) {
          const spaceData = spaceDoc.data();
          // Store service/layanan name for reporting (use space category when available)
          orderData.serviceName = spaceData.category || spaceData.serviceName || spaceData.name || '';
          const buildingIdFromSpace = spaceData.buildingId;
          if (buildingIdFromSpace) {
            const buildingDoc = await db.collection('buildings').doc(buildingIdFromSpace).get();
            if (buildingDoc.exists) {
              const buildingData = buildingDoc.data();
              if (buildingData.cityId) {
                orderData.cityId = buildingData.cityId;
              }
              // Store readable city name for reporting
              if (buildingData.location && buildingData.location.city) {
                orderData.cityName = buildingData.location.city;
              }
            }
          }
        }
      }
    } catch (cityErr) {
      console.warn('⚠️ Unable to attach cityId to order', cityErr);
    }
    // --- END NEW ---

    // Staff city restriction
    if (requesterRole === 'staff') {
      const {cityId: requesterCityId} = await getUserRoleAndCity(req);
      if (requesterCityId && orderData.cityId && orderData.cityId !== requesterCityId) {
        return handleResponse(res, {message: 'Access denied'}, 403);
      }
    }

    // Use orderId as document name instead of auto-generated ID
    await db.collection('orders').doc(orderId).set(orderData);

    // Update space booking status based on order status and pricing type
    try {
      await updateSpaceBookingStatus(db, spaceId, orderId, status, pricingType, 'create');
    } catch (err) {
      console.warn('⚠️ Unable to update space booking status:', err.message);
    }

    // Auto-generate invoice for confirmed order without invoiceId
    await autoGenerateInvoiceForOrder(db, orderId);

    // Return response with orderId as the main ID
    handleResponse(res, {
      id: orderId,
      ...orderData,
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
      return handleResponse(res, {message: 'Order not found'}, 404);
    }

    // Get user info from auth token if available
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;

    const prevData = orderDoc.data();

    const updateData = {...req.body};
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

    // --- Role-based access control: staff can only update orders in their city & limited fields ---
    const {role: requesterRole, cityId: requesterCityId} = await getUserRoleAndCity(req);
    if (requesterRole === 'staff') {
      // Ensure the order belongs to the staff's city
      if (prevData.cityId && requesterCityId && prevData.cityId !== requesterCityId) {
        return handleResponse(res, {message: 'Access denied'}, 403);
      }

      // Limit editable fields for staff
      const allowedStaffFields = ['status', 'notes'];
      Object.keys(updateData).forEach((key) => {
        if (!allowedStaffFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

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

    // Auto-generate invoice if necessary
    await autoGenerateInvoiceForOrder(db, orderId);

    handleResponse(res, {
      id: orderId, // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
      ...data,
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
      return handleResponse(res, {message: 'Order not found'}, 404);
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

    handleResponse(res, {message: 'Order deleted successfully'});
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
        migratedCount: 0,
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
            action: 'moved_document',
          });

          console.log(`📝 Moving document: ${oldDocId} -> ${orderId}`);
        } else {
          // Just update the existing document with orderId field
          batch.update(doc.ref, {orderId: orderId});

          migrationResults.push({
            oldDocId,
            newDocId: oldDocId,
            orderId: orderId,
            customerId: data.customerId,
            action: 'added_orderId',
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
        results: migrationResults,
      });
    } else {
      handleResponse(res, {
        message: 'All orders already have correct structure.',
        migratedCount: 0,
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
    const updatedCount = {active: 0, completed: 0};

    // Get confirmed orders that should be active (current date >= start date)
    const confirmedOrdersSnapshot = await db.collection('orders')
        .where('status', '==', 'confirmed')
        .get();

    if (!confirmedOrdersSnapshot.empty) {
      console.log(`📊 Found ${confirmedOrdersSnapshot.size} confirmed orders to check...`);

      for (const doc of confirmedOrdersSnapshot.docs) {
        const order = doc.data();
        const startDate = order.startDate instanceof Date ? order.startDate : new Date(order.startDate);

        // Ensure invoice exists
        if (!order.invoiceId) {
          await autoGenerateInvoiceForOrder(db, doc.id);
        }

        // If start date has arrived or passed, update to active
        if (startDate <= now) {
          console.log(`📝 Updating order ${doc.id} from confirmed to active (start date: ${startDate.toISOString()})`);
          batch.update(doc.ref, {
            status: 'active',
            updatedAt: now,
            statusUpdateReason: 'Automatic update - booking period started',
          });

          updatedCount.active++;
        }
      }
    }

    // Get active/ongoing orders that should be completed (current date > end date)
    const activeOrdersSnapshot = await db.collection('orders')
        .where('status', 'in', ['active', 'ongoing', 'in-progress'])
        .get();

    if (!activeOrdersSnapshot.empty) {
      console.log(`📊 Found ${activeOrdersSnapshot.size} active orders to check...`);

      for (const doc of activeOrdersSnapshot.docs) {
        const order = doc.data();
        const endDate = order.endDate instanceof Date ? order.endDate : new Date(order.endDate);

        // If end date has passed, update to completed
        if (endDate < now) {
          console.log(`📝 Updating order ${doc.id} from ${order.status} to completed (end date: ${endDate.toISOString()})`);

          batch.update(doc.ref, {
            status: 'completed',
            updatedAt: now,
            statusUpdateReason: 'Automatic update - booking period ended',
          });

          // Free up the space when order is completed
          try {
            if (order.spaceId) {
              batch.update(db.collection('spaces').doc(order.spaceId), {
                isBooked: false,
                bookingOrderId: admin.firestore.FieldValue.delete(),
              });
              console.log(`📝 Freeing space ${order.spaceId} as order ${doc.id} is completed`);
            }
          } catch (err) {
            console.warn(`⚠️ Could not update space ${order.spaceId} booking status:`, err.message);
          }

          updatedCount.completed++;
        }
      }
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
      updated: results,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Function to fix all spaces with incorrect booking status
const fixSpacesBookingStatus = async () => {
  try {
    const db = getDb();
    console.log('🔄 Starting optimized space booking status fix...');

    // Step 1: Get active orders and build shouldBeBooked set - run concurrently
    const [bookedSpacesSnapshot, activeOrdersSnapshot] = await Promise.all([
      db.collection('spaces').where('isBooked', '==', true).get(),
      db.collection('orders').where('status', 'in', ['confirmed', 'active']).get(),
    ]);

    // Create sets for faster lookups
    const shouldBeBookedSet = new Set();
    const shouldBeBookedMap = new Map(); // spaceId -> orderId

    activeOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.spaceId) {
        shouldBeBookedSet.add(order.spaceId);
        shouldBeBookedMap.set(order.spaceId, doc.id);
      }
    });

    console.log(`Found ${bookedSpacesSnapshot.size} spaces marked as booked.`);
    console.log(`Found ${shouldBeBookedSet.size} spaces that should be booked based on confirmed/active orders.`);

    let fixedCount = 0;
    let batchCount = 0;
    let batch = db.batch();
    const BATCH_SIZE = 400; // Leave some buffer under 500 limit

    // Helper function to commit batch if needed
    const commitBatchIfNeeded = async () => {
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`✅ Committed batch of ${batchCount} operations.`);
        batch = db.batch();
        batchCount = 0;
      }
    };

    // Step 2: Fix spaces marked as booked but shouldn't be
    for (const doc of bookedSpacesSnapshot.docs) {
      const spaceId = doc.id;
      if (!shouldBeBookedSet.has(spaceId)) {
        console.log(`Space ${spaceId} is marked as booked but has no active order - fixing...`);
        batch.update(doc.ref, {
          isBooked: false,
          bookingOrderId: admin.firestore.FieldValue.delete(),
          lastBookingUpdate: new Date(),
        });
        fixedCount++;
        batchCount++;
        await commitBatchIfNeeded();
      }
    }

    // Step 3: Check spaces that should be booked but aren't - use pagination
    const spacesToCheck = Array.from(shouldBeBookedSet);
    const PAGE_SIZE = 100; // Process in smaller chunks

    for (let i = 0; i < spacesToCheck.length; i += PAGE_SIZE) {
      const batchSpaceIds = spacesToCheck.slice(i, i + PAGE_SIZE);

      // Get spaces by their IDs
      const spacePromises = batchSpaceIds.map((spaceId) =>
        db.collection('spaces').doc(spaceId).get(),
      );

      const spaceDocs = await Promise.all(spacePromises);

      for (const doc of spaceDocs) {
        if (!doc.exists) continue;

        const spaceId = doc.id;
        const spaceData = doc.data();
        const orderId = shouldBeBookedMap.get(spaceId);

        if (orderId && (!spaceData.isBooked || spaceData.bookingOrderId !== orderId)) {
          console.log(`Space ${spaceId} should be booked for order ${orderId} but isn't - fixing...`);
          batch.update(doc.ref, {
            isBooked: true,
            bookingOrderId: orderId,
            lastBookingUpdate: new Date(),
          });
          fixedCount++;
          batchCount++;
          await commitBatchIfNeeded();
        }
      }
    }

    // Step 4: Commit final batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} operations.`);
    }

    if (fixedCount > 0) {
      console.log(`✅ Fixed booking status for ${fixedCount} spaces total.`);
    } else {
      console.log('ℹ️ No spaces needed booking status fixes.');
    }

    return {fixed: fixedCount};
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
      fixed: results.fixed,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// PATCH /orders/{orderId}/status - Manual order status update
const updateOrderStatusManual = async (req, res) => {
  try {
    const {url} = req;
    const pathParts = url.split('/').filter((part) => part);
    const orderId = pathParts[0];
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    const { status, paymentData, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const db = getDb();
    
    // Find order by ID
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const orderData = orderDoc.data();
    const currentStatus = orderData.status;
    
    // Prepare update data
    const updateData = {
      status: status,
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(orderData.statusHistory || []),
        {
          from: currentStatus,
          to: status,
          timestamp: new Date().toISOString(),
          reason: reason || 'Manual update',
          updatedBy: 'webhook' // Can be changed to actual user
        }
      ]
    };
    
    // Add payment data if provided
    if (paymentData) {
      updateData.paymentData = paymentData;
      updateData.paymentStatus = 'paid';
      updateData.paidAt = new Date().toISOString();
    }
    
    // Update order
    await orderDoc.ref.update(updateData);
    
    // Handle space booking status update
    if (orderData.spaceId) {
      await updateSpaceBookingStatus(orderData.spaceId, status, orderId);
    }
    
    console.log(`✅ Order ${orderId} status updated from ${currentStatus} to ${status}`);
    
    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      orderId: orderId,
      previousStatus: currentStatus,
      newStatus: status,
      data: updateData
    });
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Update main orders function to include the new endpoint
const ordersWithStatusUpdates = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const {method, url} = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter((part) => part);

      // Add new endpoint
      if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'update-statuses') {
        return await updateOrderStatusesEndpoint(req, res);
      }

      // Add space booking fix endpoint
      if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'fix-spaces') {
        return await fixSpacesBookingStatusEndpoint(req, res);
      }

      // Add manual order status update endpoint
      if (method === 'PATCH' && pathParts.length === 2 && pathParts[1] === 'status') {
        return await updateOrderStatusManual(req, res);
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
  updateOrderStatuses, // Export for scheduled tasks
  fixSpacesBookingStatus, // Export for manual fixes
};
