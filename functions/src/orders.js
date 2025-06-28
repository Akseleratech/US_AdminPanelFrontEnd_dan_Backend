const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  generateSequentialId 
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
      orders.push({
        id: doc.id,
        ...doc.data()
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

    handleResponse(res, { id: doc.id, ...doc.data() });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /orders
const createOrder = async (req, res) => {
  try {
    const db = getDb();
    const { customerName, customerEmail, spaceId, spaceName, amount, duration } = req.body;

    validateRequired(req.body, ['customerName', 'customerEmail', 'spaceId', 'amount']);

    const orderId = await generateSequentialId('orders', 'ORD', 4);

    const orderData = {
      orderId,
      customerName: sanitizeString(customerName),
      customerEmail: sanitizeString(customerEmail),
      spaceId: sanitizeString(spaceId),
      spaceName: sanitizeString(spaceName || ''),
      amount: parseFloat(amount),
      duration: duration || 1,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('orders').add(orderData);

    handleResponse(res, { id: docRef.id, ...orderData }, 201);
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

    const updateData = { ...req.body };
    delete updateData.id;
    updateData.updatedAt = new Date();

    await db.collection('orders').doc(orderId).update(updateData);

    const updatedDoc = await db.collection('orders').doc(orderId).get();
    handleResponse(res, { id: orderId, ...updatedDoc.data() });
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

module.exports = { orders }; 