const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });
const { 
  getDb, 
  handleResponse, 
  handleError, 
  validateRequired, 
  sanitizeString,
  generateSequentialId,
  verifyAuthToken,
  getUserFromToken 
} = require("./utils/helpers");
const admin = require("firebase-admin");

// Main invoices function
const invoices = onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];
      const pathParts = path.split('/').filter(part => part);

      if (method === 'GET') {
        if (pathParts.length === 0) {
          return await getAllInvoices(req, res);
        } else if (pathParts.length === 1) {
          return await getInvoiceById(pathParts[0], req, res);
        }
      } else if (method === 'POST') {
        if (pathParts.length === 0) {
          return await createInvoice(req, res);
        } else if (pathParts.length === 2 && pathParts[1] === 'generate-from-order') {
          return await generateInvoiceFromOrder(pathParts[0], req, res);
        }
      } else if (method === 'PUT' && pathParts.length === 1) {
        return await updateInvoice(pathParts[0], req, res);
      } else if (method === 'DELETE' && pathParts.length === 1) {
        return await deleteInvoice(pathParts[0], req, res);
      }

      handleResponse(res, { message: 'Invoice route not found' }, 404);
    } catch (error) {
      handleError(res, error);
    }
  });
});

// GET /invoices
const getAllInvoices = async (req, res) => {
  try {
    const db = getDb();
    const { status, limit, offset = 0, search, customerEmail, orderId, sortBy = 'issuedDate', sortOrder = 'desc' } = req.query;
    let invoicesRef = db.collection('invoices');

    // Apply filters
    if (status) {
      invoicesRef = invoicesRef.where('status', '==', status);
    }

    if (customerEmail) {
      invoicesRef = invoicesRef.where('customerEmail', '==', customerEmail);
    }

    if (orderId) {
      invoicesRef = invoicesRef.where('orderId', '==', orderId);
    }

    // Apply sorting
    invoicesRef = invoicesRef.orderBy(sortBy, sortOrder);
    
    const snapshot = await invoicesRef.get();
    let invoices = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure date fields are serialized as ISO strings
      const issuedDate = data.issuedDate && data.issuedDate.toDate ? data.issuedDate.toDate().toISOString() : data.issuedDate;
      const dueDate = data.dueDate && data.dueDate.toDate ? data.dueDate.toDate().toISOString() : data.dueDate;
      const paidDate = data.paidDate && data.paidDate.toDate ? data.paidDate.toDate().toISOString() : data.paidDate;
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

      invoices.push({
        id: doc.id,
        ...data,
        issuedDate,
        dueDate,
        paidDate,
        createdAt
      });
    });

    // Apply search filter after fetching
    if (search) {
      const searchLower = search.toLowerCase();
      invoices = invoices.filter(invoice =>
        invoice.customerName?.toLowerCase().includes(searchLower) ||
        invoice.customerEmail?.toLowerCase().includes(searchLower) ||
        invoice.id?.toLowerCase().includes(searchLower) ||
        invoice.orderId?.toLowerCase().includes(searchLower)
      );
    }

    // Get total count before pagination
    const totalInvoices = invoices.length;

    // Apply pagination
    const offsetNum = parseInt(offset) || 0;
    const limitNum = parseInt(limit) || invoices.length;
    invoices = invoices.slice(offsetNum, offsetNum + limitNum);

    handleResponse(res, {
      invoices,
      pagination: {
        total: totalInvoices,
        offset: offsetNum,
        limit: limitNum,
        hasMore: offsetNum + limitNum < totalInvoices
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /invoices/:id
const getInvoiceById = async (invoiceId, req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('invoices').doc(invoiceId).get();
    
    if (!doc.exists) {
      return handleResponse(res, { message: 'Invoice not found' }, 404);
    }

    const data = doc.data();
    const issuedDate = data.issuedDate && data.issuedDate.toDate ? data.issuedDate.toDate().toISOString() : data.issuedDate;
    const dueDate = data.dueDate && data.dueDate.toDate ? data.dueDate.toDate().toISOString() : data.dueDate;
    const paidDate = data.paidDate && data.paidDate.toDate ? data.paidDate.toDate().toISOString() : data.paidDate;
    const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

    handleResponse(res, {
      id: doc.id,
      ...data,
      issuedDate,
      dueDate,
      paidDate,
      createdAt
    });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /invoices
const createInvoice = async (req, res) => {
  try {
    const db = getDb();
    const {
      orderId,
      orderIds = [],
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      amountBase,
      taxRate = 0.11,
      discountRate = 0,
      paymentTerms = 30,
      notes = ''
    } = req.body;

    // Validate required fields
    validateRequired(req.body, ['customerName', 'customerEmail', 'amountBase']);

    // Calculate amounts
    const taxAmount = amountBase * taxRate;
    const discountAmount = amountBase * discountRate;
    const total = amountBase + taxAmount - discountAmount;

    // Generate invoice ID
    const invoiceId = await generateInvoiceId();

    // Get user info from auth token if available
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;

    // Calculate due date
    const issuedDate = new Date();
    const dueDate = new Date(issuedDate.getTime() + (paymentTerms * 24 * 60 * 60 * 1000));

    const invoiceData = {
      orderId: orderId || null,
      orderIds: orderIds.length > 0 ? orderIds : (orderId ? [orderId] : []),
      customerName: sanitizeString(customerName),
      customerEmail: sanitizeString(customerEmail),
      customerPhone: customerPhone ? sanitizeString(customerPhone) : null,
      customerAddress: customerAddress ? sanitizeString(customerAddress) : null,
      amountBase: parseFloat(amountBase),
      taxRate: parseFloat(taxRate),
      taxAmount: parseFloat(taxAmount),
      discountRate: parseFloat(discountRate),
      discountAmount: parseFloat(discountAmount),
      total: parseFloat(total),
      status: 'draft',
      issuedDate: issuedDate,
      dueDate: dueDate,
      paidDate: null,
      paidAmount: 0,
      paymentTerms: parseInt(paymentTerms),
      paymentMethod: null,
      notes: sanitizeString(notes),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user ? user.uid : 'system',
      createdByEmail: user ? user.email : 'system'
    };

    await db.collection('invoices').doc(invoiceId).set(invoiceData);

    handleResponse(res, { 
      id: invoiceId,
      ...invoiceData 
    }, 201);
  } catch (error) {
    handleError(res, error);
  }
};

// POST /invoices/:orderId/generate-from-order
const generateInvoiceFromOrder = async (orderId, req, res) => {
  try {
    console.log('🔍 DEBUG - generateInvoiceFromOrder called with orderId:', orderId);
    
    const db = getDb();
    
    // Get the order
    console.log('🔍 DEBUG - Fetching order document...');
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      console.log('❌ DEBUG - Order not found:', orderId);
      return handleResponse(res, { message: 'Order not found' }, 404);
    }

    console.log('✅ DEBUG - Order found, extracting data...');
    const order = orderDoc.data();
    console.log('🔍 DEBUG - Order data:', JSON.stringify(order, null, 2));

    // Check if invoice already exists for this order
    if (order.invoiceId) {
      console.log('⚠️ DEBUG - Invoice already exists:', order.invoiceId);
      return handleResponse(res, { message: 'Invoice already exists for this order', invoiceId: order.invoiceId }, 400);
    }

    // Validate required fields
    console.log('🔍 DEBUG - Validating required fields...');
    if (!order.amountBase) {
      console.log('❌ DEBUG - Missing amountBase field');
      return handleResponse(res, { message: 'Order missing amountBase field' }, 400);
    }
    
    if (!order.customerName) {
      console.log('❌ DEBUG - Missing customerName field');
      return handleResponse(res, { message: 'Order missing customerName field' }, 400);
    }
    
    if (!order.customerEmail) {
      console.log('❌ DEBUG - Missing customerEmail field');
      return handleResponse(res, { message: 'Order missing customerEmail field' }, 400);
    }

    // Get customer data to fetch complete information including phone
    console.log('🔍 DEBUG - Fetching customer data...');
    let customerPhone = order.customerPhone || null;
    let customerAddress = null;
    
    if (order.customerId) {
      try {
        const customerDoc = await db.collection('customers').doc(order.customerId).get();
        if (customerDoc.exists) {
          const customerData = customerDoc.data();
          customerPhone = customerData.phone || customerPhone;
          customerAddress = customerData.address || null;
          console.log('✅ DEBUG - Customer data fetched:', { phone: customerPhone, address: customerAddress });
        } else {
          console.log('⚠️ DEBUG - Customer document not found for ID:', order.customerId);
        }
      } catch (customerError) {
        console.warn('⚠️ DEBUG - Error fetching customer data:', customerError.message);
      }
    }

    // Get space and building data to fetch city information
    console.log('🔍 DEBUG - Fetching space and building data...');
    let spaceCityName = 'Unknown City';
    let spaceProvinceName = 'Unknown Province';
    let serviceName = order.spaceName || 'Layanan Sewa Space';
    
    if (order.spaceId) {
      try {
        const spaceDoc = await db.collection('spaces').doc(order.spaceId).get();
        if (spaceDoc.exists) {
          const spaceData = spaceDoc.data();
          serviceName = spaceData.category || spaceData.name || serviceName;
          
          // Get building data for location
          if (spaceData.buildingId) {
            const buildingDoc = await db.collection('buildings').doc(spaceData.buildingId).get();
            if (buildingDoc.exists) {
              const buildingData = buildingDoc.data();
              spaceCityName = buildingData.location?.city || spaceCityName;
              spaceProvinceName = buildingData.location?.province || spaceProvinceName;
              console.log('✅ DEBUG - Space and building data fetched:', { 
                serviceName, 
                city: spaceCityName, 
                province: spaceProvinceName 
              });
            }
          }
        } else {
          console.log('⚠️ DEBUG - Space document not found for ID:', order.spaceId);
        }
      } catch (spaceError) {
        console.warn('⚠️ DEBUG - Error fetching space/building data:', spaceError.message);
      }
    }

    // Generate invoice from order data
    console.log('🔍 DEBUG - Generating invoice data...');
    const taxRate = 0.11; // 11% PPN
    const taxAmount = order.amountBase * taxRate;
    const total = order.amountBase + taxAmount;

    console.log('🔍 DEBUG - Generating invoice ID...');
    const invoiceId = await generateInvoiceId();
    console.log('✅ DEBUG - Generated invoice ID:', invoiceId);
    
    const issuedDate = new Date();
    const dueDate = new Date(issuedDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days payment terms

    // Get user info from auth token if available
    console.log('🔍 DEBUG - Getting user from token...');
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;
    console.log('🔍 DEBUG - User:', user ? user.email : 'system');

    console.log('🔍 DEBUG - Creating invoice data structure...');
    const invoiceData = {
      orderId: orderId,
      orderIds: [orderId],
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      amountBase: order.amountBase,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discountRate: 0,
      discountAmount: 0,
      total: total,
      status: 'draft',
      issuedDate: issuedDate,
      dueDate: dueDate,
      paidDate: null,
      paidAmount: 0,
      paymentTerms: 30,
      paymentMethod: null,
      // Add service and city information for reports
      serviceName: serviceName,
      cityName: spaceCityName,
      provinceName: spaceProvinceName,
      // Create items array with proper service description
      items: [{
        description: serviceName,
        quantity: 1,
        unitPrice: order.amountBase,
        amount: order.amountBase,
        // Additional item details
        period: (() => {
          const formatDate = (d) => {
            if (!d) return '-';
            if (d.toDate) return d.toDate().toISOString().split('T')[0]; // Firestore Timestamp
            if (d instanceof Date) return d.toISOString().split('T')[0];
            if (typeof d === 'string') return d.split('T')[0];
            return String(d);
          };
          const startStr = formatDate(order.startDate);
          const endStr = formatDate(order.endDate);
          return `${startStr} - ${endStr}`;
        })(),
        spaceName: order.spaceName || 'Unknown Space'
      }],
      // Format dates safely to YYYY-MM-DD
      notes: (() => {
        const formatDate = (d) => {
          if (!d) return '-';
          if (d.toDate) return d.toDate().toISOString().split('T')[0]; // Firestore Timestamp
          if (d instanceof Date) return d.toISOString().split('T')[0];
          if (typeof d === 'string') return d.split('T')[0];
          return String(d);
        };
        const startStr = formatDate(order.startDate);
        const endStr = formatDate(order.endDate);
        return `Invoice for ${order.spaceName || 'space'} booking (${startStr} - ${endStr})`;
      })(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user ? user.uid : 'system',
      createdByEmail: user ? user.email : 'system'
    };

    console.log('🔍 DEBUG - Invoice data:', JSON.stringify(invoiceData, null, 2));

    // Create invoice
    console.log('🔍 DEBUG - Creating invoice document...');
    await db.collection('invoices').doc(invoiceId).set(invoiceData);
    console.log('✅ DEBUG - Invoice created successfully');

    // Update order with invoice reference
    console.log('🔍 DEBUG - Updating order with invoice reference...');
    await db.collection('orders').doc(orderId).update({
      invoiceId: invoiceId,
      updatedAt: new Date()
    });
    console.log('✅ DEBUG - Order updated successfully');

    console.log('🔍 DEBUG - Sending response...');
    handleResponse(res, { 
      id: invoiceId,
      ...invoiceData 
    }, 201);
  } catch (error) {
    console.error('❌ DEBUG - Error in generateInvoiceFromOrder:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    handleError(res, error);
  }
};

// PUT /invoices/:id
const updateInvoice = async (invoiceId, req, res) => {
  try {
    const db = getDb();
    
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return handleResponse(res, { message: 'Invoice not found' }, 404);
    }

    const updateData = { ...req.body };
    delete updateData.id;

    // Get user info from auth token if available
    const token = verifyAuthToken(req);
    const user = token ? await getUserFromToken(token) : null;

    // Recalculate amounts if base amount or rates changed
    if (updateData.amountBase || updateData.taxRate || updateData.discountRate) {
      const currentData = invoiceDoc.data();
      const amountBase = updateData.amountBase || currentData.amountBase;
      const taxRate = updateData.taxRate || currentData.taxRate;
      const discountRate = updateData.discountRate || currentData.discountRate;

      updateData.taxAmount = amountBase * taxRate;
      updateData.discountAmount = amountBase * discountRate;
      updateData.total = amountBase + updateData.taxAmount - updateData.discountAmount;
    }

    // Handle date fields
    if (updateData.issuedDate) {
      updateData.issuedDate = new Date(updateData.issuedDate);
    }
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    if (updateData.paidDate) {
      updateData.paidDate = new Date(updateData.paidDate);
    }

    // Add update tracking
    updateData.updatedAt = new Date();
    updateData.updatedBy = user ? user.uid : 'system';
    updateData.updatedByEmail = user ? user.email : 'system';

    await db.collection('invoices').doc(invoiceId).update(updateData);

    const updatedDoc = await db.collection('invoices').doc(invoiceId).get();
    const data = updatedDoc.data();
    
    handleResponse(res, { 
      id: invoiceId,
      ...data 
    });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /invoices/:id
const deleteInvoice = async (invoiceId, req, res) => {
  try {
    const db = getDb();
    
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return handleResponse(res, { message: 'Invoice not found' }, 404);
    }

    const invoiceData = invoiceDoc.data();

    // Remove invoice reference from related orders
    if (invoiceData.orderIds && invoiceData.orderIds.length > 0) {
      const batch = db.batch();
      
      for (const orderId of invoiceData.orderIds) {
        const orderRef = db.collection('orders').doc(orderId);
        batch.update(orderRef, {
          invoiceId: admin.firestore.FieldValue.delete(),
          updatedAt: new Date()
        });
      }
      
      await batch.commit();
    }

    await db.collection('invoices').doc(invoiceId).delete();
    
    handleResponse(res, { message: 'Invoice deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

// Helper function to generate invoice ID
const generateInvoiceId = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const db = getDb();
  const invoicesRef = db.collection('invoices');
  const prefix = `INV-${year}-${month}`;
  
  // Get all invoices for this month and find the highest sequence number
  const snapshot = await invoicesRef
    .where('__name__', '>=', `${prefix}-000`)
    .where('__name__', '<', `${prefix}-999`)
    .get();
  
  let maxSequence = 0;
  if (!snapshot.empty) {
    snapshot.forEach(doc => {
      const id = doc.id;
      const sequencePart = id.split('-').pop();
      const sequence = parseInt(sequencePart);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    });
  }
  
  const nextSequence = maxSequence + 1;
  return `${prefix}-${String(nextSequence).padStart(3, '0')}`;
};

module.exports = { invoices }; 