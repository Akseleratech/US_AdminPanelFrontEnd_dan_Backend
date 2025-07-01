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
  getUserFromToken 
} = require("./utils/helpers");

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
        return await createOrder(req, res);
      } else if (method === 'PUT' && pathParts.length === 1) {
        return await updateOrder(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        return await deleteOrder(pathParts[0], req, res);
      } else if (method === 'POST' && pathParts.length === 1 && pathParts[0] === 'migrate') {
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
    const { status, limit, search } = req.query;
    let ordersRef = db.collection('orders');

    if (status) {
      ordersRef = ordersRef.where('status', '==', status);
    }

    ordersRef = ordersRef.orderBy('createdAt', 'desc');
    
    const snapshot = await ordersRef.get();
    let orders = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure date fields are serialized as ISO strings
      const startDate = data.startDate && data.startDate.toDate ? data.startDate.toDate().toISOString() : data.startDate;
      const endDate = data.endDate && data.endDate.toDate ? data.endDate.toDate().toISOString() : data.endDate;

      orders.push({
        id: doc.id,  // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
        ...data,
        startDate,
        endDate
      });
    });

    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order =>
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.spaceName?.toLowerCase().includes(searchLower)
      );
    }

    if (limit) {
      orders = orders.slice(0, parseInt(limit));
    }

    handleResponse(res, { orders, total: orders.length });
  } catch (error) {
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
      spaceId, 
      spaceName, 
      amount, 
      startDate,
      endDate,
      status = 'pending',
      notes = '',
      source = 'manual'
    } = req.body;

    // Validate required fields (service fields are now optional)
    validateRequired(req.body, ['customerId', 'customerName', 'spaceId', 'amount', 'startDate', 'endDate']);

    // Generate structured OrderID (service type removed)
    const orderId = await generateStructuredOrderId(source);

    // Get user info from auth token if available
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;

    const orderData = {
      orderId: orderId,  // Structured order ID like "ORD-20250701-GEN-MAN-0001"
      customerId: sanitizeString(customerId), // Real customer ID from form
      customerName: sanitizeString(customerName),
      customerEmail: sanitizeString(customerEmail),
      spaceId: sanitizeString(spaceId),
      spaceName: sanitizeString(spaceName || ''),
      amount: parseFloat(amount),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: sanitizeString(status),
      notes: sanitizeString(notes),
      source: sanitizeString(source),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user ? user.uid : 'system',
      createdByEmail: user ? user.email : 'system'
    };

    // Use orderId as document name instead of auto-generated ID
    await db.collection('orders').doc(orderId).set(orderData);

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

    const updateData = { ...req.body };
    delete updateData.id;
    
    // Add update tracking
    updateData.updatedAt = new Date();
    updateData.updatedBy = user ? user.uid : 'system';
    updateData.updatedByEmail = user ? user.email : 'system';

    await db.collection('orders').doc(orderId).update(updateData);

    const updatedDoc = await db.collection('orders').doc(orderId).get();
    const data = updatedDoc.data();
    handleResponse(res, { 
      id: orderId,  // This will now be the orderId (e.g., ORD-20250701-GEN-MAN-0001)
      ...data 
    });
  } catch (error) {
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

    await db.collection('orders').doc(orderId).delete();
    handleResponse(res, { message: 'Order deleted successfully' });
  } catch (error) {
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

module.exports = { orders }; 