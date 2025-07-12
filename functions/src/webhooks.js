const { onRequest } = require("firebase-functions/v2/https");
const { getDb } = require('./utils/helpers');
const crypto = require('crypto');

// Midtrans configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'your-midtrans-server-key';

/**
 * Verify Midtrans signature for webhook security
 */
function verifyMidtransSignature(body, signature) {
  try {
    const { order_id, status_code, gross_amount } = body;
    const signatureString = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying Midtrans signature:', error);
    return false;
  }
}

/**
 * Update order status based on payment result
 */
async function updateOrderStatus(orderId, paymentData) {
  const db = getDb();
  
  try {
    console.log(`🔄 Updating order ${orderId} with payment data:`, paymentData);
    
    // Find order by order ID
    const ordersSnapshot = await db.collection('orders')
      .where('orderId', '==', orderId)
      .limit(1)
      .get();
    
    if (ordersSnapshot.empty) {
      console.error(`❌ Order not found: ${orderId}`);
      return { success: false, error: 'Order not found' };
    }
    
    const orderDoc = ordersSnapshot.docs[0];
    const orderData = orderDoc.data();
    
    // Prepare update data
    const updateData = {
      status: 'confirmed', // Update from 'pending' to 'confirmed'
      paymentData: paymentData,
      updatedAt: new Date().toISOString(),
      paymentStatus: 'paid',
      paidAt: new Date().toISOString()
    };
    
    // Update order
    await orderDoc.ref.update(updateData);
    
    console.log(`✅ Order ${orderId} updated successfully`);
    return { 
      success: true, 
      orderId: orderId,
      orderRef: orderDoc.ref,
      invoiceId: orderData.invoiceId 
    };
    
  } catch (error) {
    console.error(`❌ Error updating order ${orderId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Update invoice status based on payment result
 */
async function updateInvoiceStatus(invoiceId, paymentData) {
  const db = getDb();
  
  try {
    console.log(`🔄 Updating invoice ${invoiceId} with payment data:`, paymentData);
    
    // Find invoice by ID
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    
    if (!invoiceDoc.exists) {
      console.error(`❌ Invoice not found: ${invoiceId}`);
      return { success: false, error: 'Invoice not found' };
    }
    
    // Prepare update data
    const updateData = {
      status: 'paid', // Update from 'draft' to 'paid'
      paidDate: new Date().toISOString(),
      paymentMethod: paymentData.payment_type || 'Midtrans',
      paymentData: paymentData,
      updatedAt: new Date().toISOString()
    };
    
    // Update invoice
    await invoiceDoc.ref.update(updateData);
    
    console.log(`✅ Invoice ${invoiceId} updated successfully`);
    return { success: true, invoiceId: invoiceId };
    
  } catch (error) {
    console.error(`❌ Error updating invoice ${invoiceId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate invoice if not exists for confirmed order
 */
async function generateInvoiceForOrder(orderRef, orderData) {
  const db = getDb();
  
  try {
    // Check if invoice already exists
    if (orderData.invoiceId) {
      console.log(`📄 Invoice already exists for order: ${orderData.orderId}`);
      return { success: true, invoiceId: orderData.invoiceId };
    }
    
    // Generate new invoice
    const invoiceData = {
      orderId: orderData.orderId,
      customerName: orderData.customerName || orderData.customer,
      customerEmail: orderData.customerEmail || '',
      spaceName: orderData.spaceName || orderData.location,
      amountBase: orderData.amountBase || orderData.amount || 0,
      taxAmount: (orderData.amountBase || orderData.amount || 0) * 0.11, // 11% tax
      total: (orderData.amountBase || orderData.amount || 0) * 1.11,
      status: 'paid', // Set as paid since payment is successful
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      paidDate: new Date().toISOString(),
      paymentMethod: 'Midtrans',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Create invoice
    const invoiceRef = await db.collection('invoices').add(invoiceData);
    const invoiceId = invoiceRef.id;
    
    // Update order with invoice ID
    await orderRef.update({
      invoiceId: invoiceId,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Generated invoice ${invoiceId} for order ${orderData.orderId}`);
    return { success: true, invoiceId: invoiceId };
    
  } catch (error) {
    console.error(`❌ Error generating invoice for order ${orderData.orderId}:`, error);
    return { success: false, error: error.message };
  }
}

// POST /webhooks/midtrans
const handleMidtransWebhook = onRequest(
  {
    cors: {
      origin: true,
      methods: ['POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    region: 'asia-southeast1'
  },
  async (req, res) => {
    try {
      console.log('🎣 Midtrans webhook received:', JSON.stringify(req.body, null, 2));
      
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      const body = req.body;
      const signature = req.headers['x-signature'] || req.headers['X-Signature'];
      
      // Verify signature for security (optional but recommended)
      if (MIDTRANS_SERVER_KEY && MIDTRANS_SERVER_KEY !== 'your-midtrans-server-key') {
        if (!signature || !verifyMidtransSignature(body, signature)) {
          console.error('❌ Invalid Midtrans signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }
      
      const {
        order_id,
        transaction_status,
        payment_type,
        gross_amount,
        transaction_time,
        fraud_status
      } = body;
      
      console.log(`📦 Processing payment for order: ${order_id}, status: ${transaction_status}`);
      
      // Handle different transaction statuses
      let shouldUpdateOrder = false;
      let newOrderStatus = 'pending';
      
      switch (transaction_status) {
        case 'capture':
          if (payment_type === 'credit_card') {
            if (fraud_status === 'challenge') {
              // Payment is challenged, wait for manual review
              console.log(`⚠️ Payment challenged for order: ${order_id}`);
              newOrderStatus = 'pending';
            } else if (fraud_status === 'accept') {
              // Payment successful
              console.log(`✅ Payment successful for order: ${order_id}`);
              shouldUpdateOrder = true;
              newOrderStatus = 'confirmed';
            }
          }
          break;
          
        case 'settlement':
          // Payment successful
          console.log(`✅ Payment settled for order: ${order_id}`);
          shouldUpdateOrder = true;
          newOrderStatus = 'confirmed';
          break;
          
        case 'pending':
          // Payment pending
          console.log(`⏳ Payment pending for order: ${order_id}`);
          break;
          
        case 'deny':
        case 'cancel':
        case 'expire':
          // Payment failed
          console.log(`❌ Payment failed for order: ${order_id}, status: ${transaction_status}`);
          // Could update order to 'failed' or 'cancelled' status
          break;
          
        default:
          console.log(`❓ Unknown transaction status: ${transaction_status} for order: ${order_id}`);
          break;
      }
      
      // Process successful payment
      if (shouldUpdateOrder && newOrderStatus === 'confirmed') {
        const paymentData = {
          transaction_id: body.transaction_id,
          transaction_status,
          payment_type,
          gross_amount: parseFloat(gross_amount),
          transaction_time,
          fraud_status,
          midtrans_data: body
        };
        
        // Update order status
        const orderResult = await updateOrderStatus(order_id, paymentData);
        
        if (orderResult.success) {
          let invoiceResult = { success: true };
          
          // Handle invoice update/creation
          if (orderResult.invoiceId) {
            // Update existing invoice
            invoiceResult = await updateInvoiceStatus(orderResult.invoiceId, paymentData);
          } else {
            // Generate new invoice
            const orderDoc = await orderResult.orderRef.get();
            invoiceResult = await generateInvoiceForOrder(orderResult.orderRef, orderDoc.data());
          }
          
          if (invoiceResult.success) {
            console.log(`🎉 Successfully processed payment for order: ${order_id}`);
            return res.status(200).json({
              success: true,
              message: 'Payment processed successfully',
              orderId: order_id,
              invoiceId: invoiceResult.invoiceId
            });
          } else {
            console.error(`❌ Failed to update invoice: ${invoiceResult.error}`);
            return res.status(500).json({
              success: false,
              error: 'Failed to update invoice',
              details: invoiceResult.error
            });
          }
        } else {
          console.error(`❌ Failed to update order: ${orderResult.error}`);
          return res.status(500).json({
            success: false,
            error: 'Failed to update order',
            details: orderResult.error
          });
        }
      }
      
      // For non-success cases, still return 200 to acknowledge webhook
      return res.status(200).json({
        success: true,
        message: 'Webhook received',
        orderId: order_id,
        status: transaction_status
      });
      
    } catch (error) {
      console.error('❌ Error processing Midtrans webhook:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
);

module.exports = {
  handleMidtransWebhook,
  updateOrderStatus,
  updateInvoiceStatus,
  generateInvoiceForOrder
};