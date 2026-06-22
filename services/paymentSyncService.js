const AdminDocument = require('../models/AdminDocument');

const paymentSyncService = {
    // Called when a payment is completed for a document request
    syncPaymentToDocument: async (requestId, paymentStatus) => {
        try {
            await AdminDocument.updatePaymentStatus(requestId, paymentStatus);
            console.log(`Payment synced: Request #${requestId} → ${paymentStatus}`);
            return true;
        } catch (error) {
            console.error('Payment Sync Error:', error.message);
            return false;
        }
    },

    // Check and return document request payment status
    checkPaymentStatus: async (requestId) => {
        const isPaid = await AdminDocument.isPaid(requestId);
        return {
            request_id: requestId,
            is_paid: isPaid,
            can_send: isPaid
        };
    }
};

module.exports = paymentSyncService;