const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const receiptService = {
    generateReceipt: (paymentData, citizenName) => {
        return new Promise((resolve, reject) => {
            const fileName = `Receipt_${paymentData.payment_id}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/receipts', fileName);
            const doc = new PDFDocument({ margin: 50, size: 'A5' });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).fillColor('#1a5276').text('LAMS', { align: 'center' });
            doc.fontSize(9).fillColor('#666666').text('Local Administration Management System', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(16).fillColor('#333333').text('PAYMENT RECEIPT', { align: 'center' });
            doc.moveDown(0.5);
            doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(370, doc.y).stroke();
            doc.moveDown(0.5);

            // Receipt Details
            doc.fontSize(10).fillColor('#333333');
            const leftX = 50;
            const rightX = 200;
            const lineHeight = 20;

            const addRow = (label, value, y) => {
                doc.fontSize(9).fillColor('#666666').text(label, leftX, y);
                doc.fontSize(10).fillColor('#333333').text(value || 'N/A', rightX, y);
            };

            let yPos = doc.y;
            addRow('Receipt Number:', paymentData.payment_id, yPos); yPos += lineHeight;
            addRow('Citizen Name:', citizenName, yPos); yPos += lineHeight;
            addRow('Document Type:', paymentData.document_type || 'N/A', yPos); yPos += lineHeight;
            addRow('Amount:', `TZS ${parseFloat(paymentData.amount || 0).toLocaleString()}`, yPos); yPos += lineHeight;
            addRow('Payment Method:', paymentData.payment_method || 'N/A', yPos); yPos += lineHeight;
            addRow('Transaction Ref:', paymentData.transaction_reference || 'N/A', yPos); yPos += lineHeight;
            addRow('Date:', new Date(paymentData.paid_at || Date.now()).toLocaleString(), yPos); yPos += lineHeight;
            addRow('Status:', 'PAID', yPos);

            doc.moveDown(2);
            doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(370, doc.y).stroke();
            doc.moveDown(1);

            doc.fontSize(9).fillColor('#666666').text('Thank you for your payment.', { align: 'center' });
            doc.fontSize(8).fillColor('#999999').text('This is a computer-generated receipt.', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(8).fillColor('#999999').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName }));
            stream.on('error', reject);
        });
    }
};

module.exports = receiptService;