const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfService = {
    // Generate Citizen Report PDF
    generateCitizenReport: (data, filters = {}) => {
        return new Promise((resolve, reject) => {
            const fileName = `Citizen_Report_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/documents', fileName);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            pdfService.addHeader(doc, 'CITIZEN REPORT');

            if (Object.keys(filters).length > 0) {
                doc.fontSize(9).fillColor('#666666').text('Filters Applied:');
                if (filters.ward_name) doc.text(`Ward: ${filters.ward_name}`);
                if (filters.status) doc.text(`Status: ${filters.status}`);
                doc.moveDown(0.5);
            }

            doc.fontSize(11).fillColor('#333333').text(`Total Citizens: ${data.total}`, { underline: true });
            doc.moveDown(1);

            if (data.citizens && data.citizens.length > 0) {
                pdfService.drawCitizenTable(doc, data.citizens);
            } else {
                doc.fontSize(11).fillColor('#999999').text('No citizens found.');
            }

            pdfService.addFooter(doc);

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName }));
            stream.on('error', reject);
        });
    },

    // Generate Admin Report PDF
    generateAdminReport: (data, filters = {}) => {
        return new Promise((resolve, reject) => {
            const fileName = `Admin_Report_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/documents', fileName);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            pdfService.addHeader(doc, 'ADMINISTRATOR REPORT');

            if (Object.keys(filters).length > 0) {
                doc.fontSize(9).fillColor('#666666').text('Filters Applied:');
                if (filters.ward_name) doc.text(`Ward: ${filters.ward_name}`);
                if (filters.status) doc.text(`Status: ${filters.status}`);
                doc.moveDown(0.5);
            }

            doc.fontSize(11).fillColor('#333333').text(`Total Admins: ${data.total}`, { underline: true });
            doc.moveDown(1);

            if (data.admins && data.admins.length > 0) {
                pdfService.drawAdminTable(doc, data.admins);
            } else {
                doc.fontSize(11).fillColor('#999999').text('No admins found.');
            }

            pdfService.addFooter(doc);

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName }));
            stream.on('error', reject);
        });
    },

    // Generate Audit Report PDF
    generateAuditReport: (data, filters = {}) => {
        return new Promise((resolve, reject) => {
            const fileName = `Audit_Report_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/documents', fileName);
            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            pdfService.addHeader(doc, 'AUDIT LOG REPORT');

            if (Object.keys(filters).length > 0) {
                doc.fontSize(9).fillColor('#666666').text('Filters Applied:');
                if (filters.action) doc.text(`Action: ${filters.action}`);
                doc.moveDown(0.5);
            }

            doc.fontSize(11).fillColor('#333333').text(`Total Audit Logs: ${data.total}`, { underline: true });
            doc.moveDown(1);

            if (data.logs && data.logs.length > 0) {
                pdfService.drawAuditTable(doc, data.logs);
            } else {
                doc.fontSize(11).fillColor('#999999').text('No audit logs found.');
            }

            pdfService.addFooter(doc);

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName }));
            stream.on('error', reject);
        });
    },

    // Generate Full System Report PDF
    generateFullSystemReport: (data) => {
        return new Promise((resolve, reject) => {
            const fileName = `Full_System_Report_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/documents', fileName);
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            pdfService.addHeader(doc, 'FULL SYSTEM REPORT');

            // Section 1: System Overview
            doc.fontSize(13).fillColor('#1a5276').text('1. SYSTEM OVERVIEW', { underline: true });
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#333333');
            doc.text(`Total Citizens: ${data.overview.citizens.total}   |   Active: ${data.overview.citizens.active}   |   Inactive: ${data.overview.citizens.inactive}`);
            doc.text(`Total Admins: ${data.overview.admins.total}   |   Active: ${data.overview.admins.active}   |   Suspended: ${data.overview.admins.suspended}   |   Inactive: ${data.overview.admins.inactive}`);
            doc.text(`Total Wards: ${data.overview.wards.total}`);
            doc.text(`Total Audit Logs: ${data.overview.audit_logs.total}`);
            doc.text(`Total Reports Generated: ${data.overview.reports.total}`);
            doc.moveDown(0.8);

            // Section 2: Ward Breakdown
            if (doc.y > 650) doc.addPage();
            doc.fontSize(13).fillColor('#1a5276').text('2. WARD BREAKDOWN', { underline: true });
            doc.moveDown(0.3);
            if (data.wardComparison && data.wardComparison.length > 0) {
                pdfService.drawWardTable(doc, data.wardComparison);
            }

            // Section 3: Recent Citizens
            if (doc.y > 600) doc.addPage();
            doc.fontSize(13).fillColor('#1a5276').text('3. RECENT CITIZENS', { underline: true });
            doc.moveDown(0.3);
            if (data.citizens && data.citizens.length > 0) {
                pdfService.drawCitizenTable(doc, data.citizens.slice(0, 8));
            }

            // Section 4: Recent Admins
            if (doc.y > 600) doc.addPage();
            doc.fontSize(13).fillColor('#1a5276').text('4. RECENT ADMINISTRATORS', { underline: true });
            doc.moveDown(0.3);
            if (data.admins && data.admins.length > 0) {
                pdfService.drawAdminTable(doc, data.admins.slice(0, 8));
            }

            pdfService.addFooter(doc);

            doc.end();

            stream.on('finish', () => resolve({ filePath, fileName }));
            stream.on('error', reject);
        });
    },

    // Header helper
    addHeader: (doc, title) => {
        doc.fontSize(20).fillColor('#1a5276').text('LAMS', { align: 'center' });
        doc.fontSize(9).fillColor('#666666').text('Local Administration Management System', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(14).fillColor('#333333').text(title, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(8).fillColor('#999999').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(0.5);
    },

    // Footer helper
    addFooter: (doc) => {
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            const bottom = doc.page.height - 40;
            doc.fontSize(7).fillColor('#999999');
            doc.text(`Page ${i + 1} of ${totalPages}`, 40, bottom, { align: 'center', width: 500 });
            doc.text('LAMS - Local Administration Management System - Confidential', 40, bottom + 10, { align: 'center', width: 500 });
        }
    },

    // Citizen table
    drawCitizenTable: (doc, citizens) => {
        const tableTop = doc.y;
        const colWidths = [25, 90, 140, 90, 80, 55];
        const headers = ['#', 'Full Name', 'Email', 'Phone', 'Ward', 'Status'];

        if (tableTop + 40 > doc.page.height - 50) {
            doc.addPage();
        }

        const adjustedTop = doc.y;
        doc.fontSize(8).fillColor('#ffffff');
        doc.rect(40, adjustedTop, 500, 16).fill('#1a5276');
        let xPos = 42;
        headers.forEach((header, i) => {
            doc.fillColor('#ffffff').text(header, xPos, adjustedTop + 3, { width: colWidths[i] - 4 });
            xPos += colWidths[i];
        });

        let yPos = adjustedTop + 16;
        doc.fontSize(7);
        citizens.forEach((citizen, index) => {
            if (yPos + 14 > doc.page.height - 50) {
                doc.addPage();
                yPos = 50;
                doc.fontSize(8).fillColor('#ffffff');
                doc.rect(40, yPos, 500, 16).fill('#1a5276');
                let hxPos = 42;
                headers.forEach((header, i) => {
                    doc.fillColor('#ffffff').text(header, hxPos, yPos + 3, { width: colWidths[i] - 4 });
                    hxPos += colWidths[i];
                });
                yPos += 16;
            }

            const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            doc.rect(40, yPos, 500, 14).fill(bgColor);

            xPos = 42;
            const row = [
                (index + 1).toString(),
                (citizen.full_name || '').substring(0, 18),
                (citizen.email || '').substring(0, 28),
                (citizen.phone || '').substring(0, 15),
                (citizen.ward_name || '').substring(0, 15),
                citizen.status || ''
            ];

            row.forEach((cell, i) => {
                doc.fillColor('#333333').text(cell, xPos, yPos + 2, { width: colWidths[i] - 4 });
                xPos += colWidths[i];
            });

            yPos += 14;
        });

        doc.moveDown(2);
    },

    // Admin table
    drawAdminTable: (doc, admins) => {
        const tableTop = doc.y;
        const colWidths = [25, 90, 140, 90, 80, 55];
        const headers = ['#', 'Full Name', 'Email', 'Phone', 'Ward', 'Status'];

        if (tableTop + 40 > doc.page.height - 50) {
            doc.addPage();
        }

        const adjustedTop = doc.y;
        doc.fontSize(8).fillColor('#ffffff');
        doc.rect(40, adjustedTop, 500, 16).fill('#1a5276');
        let xPos = 42;
        headers.forEach((header, i) => {
            doc.fillColor('#ffffff').text(header, xPos, adjustedTop + 3, { width: colWidths[i] - 4 });
            xPos += colWidths[i];
        });

        let yPos = adjustedTop + 16;
        doc.fontSize(7);
        admins.forEach((admin, index) => {
            if (yPos + 14 > doc.page.height - 50) {
                doc.addPage();
                yPos = 50;
                doc.fontSize(8).fillColor('#ffffff');
                doc.rect(40, yPos, 500, 16).fill('#1a5276');
                let hxPos = 42;
                headers.forEach((header, i) => {
                    doc.fillColor('#ffffff').text(header, hxPos, yPos + 3, { width: colWidths[i] - 4 });
                    hxPos += colWidths[i];
                });
                yPos += 16;
            }

            const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            doc.rect(40, yPos, 500, 14).fill(bgColor);

            xPos = 42;
            const row = [
                (index + 1).toString(),
                (admin.full_name || '').substring(0, 18),
                (admin.email || '').substring(0, 28),
                (admin.phone || '').substring(0, 15),
                (admin.ward_name || '').substring(0, 15),
                admin.status || ''
            ];

            row.forEach((cell, i) => {
                doc.fillColor('#333333').text(cell, xPos, yPos + 2, { width: colWidths[i] - 4 });
                xPos += colWidths[i];
            });

            yPos += 14;
        });

        doc.moveDown(2);
    },

    // Audit table
    drawAuditTable: (doc, logs) => {
        const tableTop = doc.y;
        const colWidths = [25, 110, 70, 70, 210];
        const headers = ['#', 'Action', 'Entity Type', 'Date', 'Description'];

        if (tableTop + 40 > doc.page.height - 50) {
            doc.addPage();
        }

        const adjustedTop = doc.y;
        doc.fontSize(8).fillColor('#ffffff');
        doc.rect(40, adjustedTop, 500, 16).fill('#1a5276');
        let xPos = 42;
        headers.forEach((header, i) => {
            doc.fillColor('#ffffff').text(header, xPos, adjustedTop + 3, { width: colWidths[i] - 4 });
            xPos += colWidths[i];
        });

        let yPos = adjustedTop + 16;
        doc.fontSize(7);
        logs.forEach((log, index) => {
            if (yPos + 14 > doc.page.height - 50) {
                doc.addPage();
                yPos = 50;
                doc.fontSize(8).fillColor('#ffffff');
                doc.rect(40, yPos, 500, 16).fill('#1a5276');
                let hxPos = 42;
                headers.forEach((header, i) => {
                    doc.fillColor('#ffffff').text(header, hxPos, yPos + 3, { width: colWidths[i] - 4 });
                    hxPos += colWidths[i];
                });
                yPos += 16;
            }

            const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            doc.rect(40, yPos, 500, 14).fill(bgColor);

            xPos = 42;
            const row = [
                (index + 1).toString(),
                (log.action || '').substring(0, 22),
                (log.entity_type || '').substring(0, 14),
                log.created_at ? new Date(log.created_at).toLocaleDateString() : '',
                (log.description || '').substring(0, 42)
            ];

            row.forEach((cell, i) => {
                doc.fillColor('#333333').text(cell, xPos, yPos + 2, { width: colWidths[i] - 4 });
                xPos += colWidths[i];
            });

            yPos += 14;
        });

        doc.moveDown(2);
    },

    // Ward table
    drawWardTable: (doc, wards) => {
        const tableTop = doc.y;
        const colWidths = [25, 200, 130, 130];
        const headers = ['#', 'Ward Name', 'Citizens', 'Admins'];

        if (tableTop + 40 > doc.page.height - 50) {
            doc.addPage();
        }

        const adjustedTop = doc.y;
        doc.fontSize(8).fillColor('#ffffff');
        doc.rect(40, adjustedTop, 485, 16).fill('#1a5276');
        let xPos = 42;
        headers.forEach((header, i) => {
            doc.fillColor('#ffffff').text(header, xPos, adjustedTop + 3, { width: colWidths[i] - 4 });
            xPos += colWidths[i];
        });

        let yPos = adjustedTop + 16;
        doc.fontSize(8);
        wards.forEach((ward, index) => {
            if (yPos + 14 > doc.page.height - 50) {
                doc.addPage();
                yPos = 50;
                doc.fontSize(8).fillColor('#ffffff');
                doc.rect(40, yPos, 485, 16).fill('#1a5276');
                let hxPos = 42;
                headers.forEach((header, i) => {
                    doc.fillColor('#ffffff').text(header, hxPos, yPos + 3, { width: colWidths[i] - 4 });
                    hxPos += colWidths[i];
                });
                yPos += 16;
            }

            const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
            doc.rect(40, yPos, 485, 14).fill(bgColor);

            xPos = 42;
            const row = [
                (index + 1).toString(),
                ward.ward_name || '',
                ward.citizen_count ? ward.citizen_count.toString() : '0',
                ward.admin_count ? ward.admin_count.toString() : '0'
            ];

            row.forEach((cell, i) => {
                doc.fillColor('#333333').text(cell, xPos, yPos + 2, { width: colWidths[i] - 4 });
                xPos += colWidths[i];
            });

            yPos += 14;
        });

        doc.moveDown(2);
    }
};

module.exports = pdfService;