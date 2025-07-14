const {onRequest} = require('firebase-functions/v2/https');
const {getDb, sanitizeString} = require('./utils/helpers');
const crypto = require('crypto');

// Midtrans configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'your-midtrans-server-key';

// Sanitize and format webhook data
function sanitizeWebhookData(data) {
  const sanitized = {};

  // Required fields for payment notifications
  if (data.orderId) sanitized.orderId = sanitizeString(data.orderId);
  if (data.transactionStatus) sanitized.transactionStatus = sanitizeString(data.transactionStatus);
  if (data.paymentType) sanitized.paymentType = sanitizeString(data.paymentType);
  if (data.transactionTime) sanitized.transactionTime = sanitizeString(data.transactionTime);
  if (data.fraudStatus) sanitized.fraudStatus = sanitizeString(data.fraudStatus);
  
  // Numeric fields
  if (data.grossAmount !== undefined) sanitized.grossAmount = parseFloat(data.grossAmount);
  if (data.statusCode !== undefined) sanitized.statusCode = sanitizeString(data.statusCode);
  
  // Optional fields that might be present in different payment methods
  if (data.bankCode) sanitized.bankCode = sanitizeString(data.bankCode);
  if (data.vaNumber) sanitized.vaNumber = sanitizeString(data.vaNumber);
  if (data.acquirer) sanitized.acquirer = sanitizeString(data.acquirer);
  if (data.currency) sanitized.currency = sanitizeString(data.currency);
  if (data.settlementTime) sanitized.settlementTime = sanitizeString(data.settlementTime);

  return sanitized;
}

/**
 * Verify Midtrans signature for webhook security
 * @param {Object} body - Payment notification body
 * @param {string} signature - Expected signature
 * @return {boolean} True if signature is valid
 */
function verifyMidtransSignature(body, signature) {
  try {
    const {orderId, statusCode, grossAmount} = body;
    const signatureString = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
    const expectedSignature = crypto.createHash('sha512').update(signatureString).digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying Midtrans signature:', error);
    return false;
  }
}

/**
 * Update order status based on payment result
 * @param {string} orderId - Order ID to update
 * @param {Object} paymentData - Payment data from Midtrans
 * @return {Promise<Object>} Update result
 */
async function updateOrderStatus(orderId, paymentData) {
  const db = getDb();

  try {
    console.log(`📋 Updating order status for order: ${orderId}`);
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    // Only update if order is in pending or confirmed status
    if (!['pending', 'confirmed'].includes(currentStatus)) {
      console.log(`⚠️ Order ${orderId} status (${currentStatus}) cannot be updated`);
      return {success: false, message: 'Order status cannot be updated'};
    }

    // Determine new status based on payment result
    const transactionStatus = paymentData.transactionStatus;
    let newStatus = currentStatus;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (paymentData.paymentType === 'credit_card') {
        if (paymentData.fraudStatus === 'accept') {
          console.log(`✅ Credit card payment accepted for order ${orderId}`);
          newStatus = 'confirmed';
        } else if (paymentData.fraudStatus === 'challenge') {
          console.log(`⚠️ Credit card payment challenged for order ${orderId}`);
          newStatus = 'pending';
        }
      } else {
        console.log(`✅ Non-credit card payment confirmed for order ${orderId}`);
        newStatus = 'confirmed';
      }
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      console.log(`❌ Payment failed for order ${orderId}: ${transactionStatus}`);
      newStatus = 'cancelled';
    } else {
      console.log(`ℹ️ Unhandled transaction status for order ${orderId}: ${transactionStatus}`);
    }

    // Update order with payment data
    const updateData = {
      status: newStatus,
      paymentStatus: transactionStatus,
      paymentMethod: paymentData.paymentType,
      paymentData: {
        orderId: paymentData.orderId,
        transactionStatus: paymentData.transactionStatus,
        paymentType: paymentData.paymentType,
        grossAmount: paymentData.grossAmount,
        transactionTime: paymentData.transactionTime,
        fraudStatus: paymentData.fraudStatus,
      },
      updatedAt: new Date().toISOString(),
    };

    await orderDoc.ref.update(updateData);

    console.log(`✅ Order ${orderId} updated successfully: ${currentStatus} → ${newStatus}`);
    return {success: true, orderId, previousStatus: currentStatus, newStatus};
  } catch (error) {
    console.error(`❌ Error updating order ${orderId}:`, error);
    return {success: false, error: error.message};
  }
}

/**
 * Update invoice status based on payment result
 * @param {string} invoiceId - Invoice ID to update
 * @param {Object} paymentData - Payment data from Midtrans
 * @return {Promise<Object>} Update result
 */
async function updateInvoiceStatus(invoiceId, paymentData) {
  const db = getDb();

  try {
    console.log(`📋 Updating invoice status for invoice: ${invoiceId}`);
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const invoiceData = invoiceDoc.data();
    const currentStatus = invoiceData.status;

    // Determine new status based on payment result
    let newStatus = currentStatus;
    const transactionStatus = paymentData.transactionStatus;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      console.log(`✅ Payment confirmed for invoice ${invoiceId}`);
      newStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      console.log(`❌ Payment failed for invoice ${invoiceId}: ${transactionStatus}`);
      newStatus = 'cancelled';
    }

    // Update invoice with payment data
    const updateData = {
      status: newStatus,
      paymentStatus: transactionStatus,
      paymentMethod: paymentData.paymentType,
      paymentData: {
        orderId: paymentData.orderId,
        transactionStatus: paymentData.transactionStatus,
        paymentType: paymentData.paymentType,
        grossAmount: paymentData.grossAmount,
        transactionTime: paymentData.transactionTime,
        fraudStatus: paymentData.fraudStatus,
      },
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === 'paid') {
      updateData.paidDate = new Date().toISOString();
    }

    await invoiceDoc.ref.update(updateData);

    console.log(`✅ Invoice ${invoiceId} updated successfully: ${currentStatus} → ${newStatus}`);
    return {success: true, invoiceId, previousStatus: currentStatus, newStatus};
  } catch (error) {
    console.error(`❌ Error updating invoice ${invoiceId}:`, error);
    return {success: false, error: error.message};
  }
}

/**
 * Process order updates from payment data
 * @param {Object} orderRef - Order reference
 * @param {Object} orderData - Order data
 * @return {Promise<Object>} Process result
 */
async function processOrderUpdates(orderRef, orderData) {
  const db = getDb();

  try {
    const orderId = orderRef.id;
    const status = orderData.status;
    const grossAmount = parseFloat(orderData.grossAmount);

    console.log(`Processing order updates for ${orderId}: status=${status}, amount=${grossAmount}`);

    if (status === 'settlement' || status === 'capture') {
      // Update order status to confirmed if payment is successful
      await orderRef.update({
        status: 'confirmed',
        paymentStatus: 'paid',
        paidAt: new Date().toISOString(),
        grossAmount: grossAmount,
        paymentMethod: orderData.paymentType,
        transactionId: orderData.transactionId,
        transactionTime: orderData.transactionTime,
        updatedAt: new Date().toISOString(),
      });

      // Update space booking status if space is involved
      if (orderData.spaceId) {
        const spaceRef = db.collection('spaces').doc(orderData.spaceId);
        await spaceRef.update({
          isBooked: true,
          bookingOrderId: orderId,
          lastBookingUpdate: new Date(),
        });
      }

      // Generate invoice if doesn't exist
      if (!orderData.invoiceId) {
        try {
          console.log(`Generating invoice for confirmed order ${orderId}`);
          const invoiceData = {
            orderId: orderId,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            amountBase: grossAmount,
            amountTax: 0,
            amountTotal: grossAmount,
            status: 'paid',
            paidDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const invoiceRef = db.collection('invoices').doc();
          await invoiceRef.set(invoiceData);

          // Update order with invoice ID
          await orderRef.update({invoiceId: invoiceRef.id});

          console.log(`✅ Generated invoice ${invoiceRef.id} for order ${orderId}`);
        } catch (invoiceError) {
          console.error(`Error generating invoice for order ${orderId}:`, invoiceError);
        }
      }
    } else if (['cancel', 'deny', 'expire'].includes(status)) {
      // Update order status to cancelled
      await orderRef.update({
        status: 'cancelled',
        paymentStatus: 'failed',
        updatedAt: new Date().toISOString(),
      });

      // Free up space if it was booked
      if (orderData.spaceId) {
        const spaceRef = db.collection('spaces').doc(orderData.spaceId);
        await spaceRef.update({
          isBooked: false,
          bookingOrderId: null,
          lastBookingUpdate: new Date(),
        });
      }
    }

    return {success: true, orderId, status};
  } catch (error) {
    console.error('Error processing order updates:', error);
    return {success: false, error: error.message};
  }
}

const paymentWebhook = onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed',
      });
    }

    const notificationBody = req.body;
    const signature = req.headers['x-callback-token'] || req.headers['signature'];

    // Sanitize webhook data
    const sanitizedData = sanitizeWebhookData(notificationBody);

    // Verify signature for production (using original body for signature verification)
    if (process.env.NODE_ENV === 'production' && !verifyMidtransSignature(notificationBody, signature)) {
      console.warn('Invalid signature received');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    console.log(`Received payment webhook for order ${sanitizedData.orderId}: ${sanitizedData.transactionStatus}`);

    // Process order update
    const orderResult = await updateOrderStatus(sanitizedData.orderId, sanitizedData);

    console.log('Order update result:', orderResult);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: sanitizedData.orderId,
      transactionStatus: sanitizedData.transactionStatus,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = {
  paymentWebhook,
  updateOrderStatus,
  updateInvoiceStatus,
  processOrderUpdates,
  verifyMidtransSignature,
};
