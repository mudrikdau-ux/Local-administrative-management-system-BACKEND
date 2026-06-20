const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const BLUE = "#1a3c5e";
const DARK = "#2c3e50";
const GRAY = "#7f8c8d";
const LIGHT_BG = "#f5f6fa";
const WHITE = "#ffffff";
const BORDER = "#dcdde1";

const pdfService = {
    generateCitizenReport: (data, filters = {}) => {
        return new Promise((resolve, reject) => {
            const fileName = "Citizen_Report_" + Date.now() + ".pdf";
            const filePath = path.join(__dirname, "../uploads/documents", fileName);
            const doc = new PDFDocument({ margin: 45, size: "A4" });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            pdfService.renderHeader(doc, "CITIZEN REPORT");
            pdfService.renderSummaryLine(doc, "Total Records", data.total);
            if (Object.keys(filters).length > 0) pdfService.renderFilters(doc, filters);
            doc.moveDown(0.5);
            if (data.citizens && data.citizens.length > 0) {
                pdfService.renderTable(doc, data.citizens, ["Full Name", "Email", "Phone", "Ward", "Status"], [22, 105, 135, 85, 80, 60], (c) => [c.full_name||"", c.email||"", c.phone||"", c.ward_name||"", c.status||""]);
            }
            pdfService.renderFooter(doc);
            doc.end();
            stream.on("finish", () => resolve({ filePath, fileName }));
            stream.on("error", reject);
        });
    },

    generateAdminReport: (data, filters = {}) => {
        return new Promise((resolve, reject) => {
            const fileName = "Admin_Report_" + Date.now() + ".pdf";
            const filePath = path.join(__dirname, "../uploads/documents", fileName);
            const doc = new PDFDocument({ margin: 45, size: "A4" });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            pdfService.renderHeader(doc, "ADMINISTRATOR REPORT");
            pdfService.renderSummaryLine(doc, "Total Records", data.total);
            if (Object.keys(filters).length > 0) pdfService.renderFilters(doc, filters);
            doc.moveDown(0.5);
            if (data.admins && data.admins.length > 0) {
                pdfService.renderTable(doc, data.admins, ["Full Name", "Email", "Phone", "Ward", "Position", "Status"], [22, 90, 120, 80, 75, 55, 45], (a) => [a.full_name||"", a.email||"", a.phone||"", a.ward_name||"", a.position_name||"", a.status||""]);
            }
            pdfService.renderFooter(doc);
            doc.end();
            stream.on("finish", () => resolve({ filePath, fileName }));
            stream.on("error", reject);
        });
    },

    generateAuditReport: (data, filters = {}) => {
        return new Promise((resolve, reject) => {
            const fileName = "Audit_Report_" + Date.now() + ".pdf";
            const filePath = path.join(__dirname, "../uploads/documents", fileName);
            const doc = new PDFDocument({ margin: 45, size: "A4", layout: "landscape" });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            pdfService.renderHeader(doc, "AUDIT LOG REPORT");
            pdfService.renderSummaryLine(doc, "Total Records", data.total);
            if (Object.keys(filters).length > 0) pdfService.renderFilters(doc, filters);
            doc.moveDown(0.5);
            if (data.logs && data.logs.length > 0) {
                pdfService.renderTable(doc, data.logs, ["Action", "Entity Type", "Entity ID", "Date", "Description"], [22, 100, 65, 50, 80, 200], (l) => [l.action||"", l.entity_type||"", l.entity_id?String(l.entity_id):"", l.created_at?new Date(l.created_at).toLocaleDateString():"", l.description||""]);
            }
            pdfService.renderFooter(doc);
            doc.end();
            stream.on("finish", () => resolve({ filePath, fileName }));
            stream.on("error", reject);
        });
    },

    generateFullSystemReport: (data) => {
        return new Promise((resolve, reject) => {
            const fileName = "Full_System_Report_" + Date.now() + ".pdf";
            const filePath = path.join(__dirname, "../uploads/documents", fileName);
            const doc = new PDFDocument({ margin: 45, size: "A4" });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);
            pdfService.renderHeader(doc, "FULL SYSTEM REPORT");

            doc.fontSize(13).fillColor(BLUE).text("1. System Overview", { underline: true });
            doc.moveDown(0.3);
            pdfService.renderSummaryCard(doc, [
                { label: "Total Citizens", value: data.overview.citizens.total },
                { label: "Active Citizens", value: data.overview.citizens.active },
                { label: "Inactive Citizens", value: data.overview.citizens.inactive },
                { label: "Total Admins", value: data.overview.admins.total },
                { label: "Active Admins", value: data.overview.admins.active },
                { label: "Suspended Admins", value: data.overview.admins.suspended },
                { label: "Total Wards", value: data.overview.wards.total },
                { label: "Audit Logs", value: data.overview.audit_logs.total }
            ]);
            doc.moveDown(0.8);

            pdfService.newSection(doc, "2. Ward Breakdown");
            if (data.wardComparison && data.wardComparison.length > 0) {
                pdfService.renderWardCards(doc, data.wardComparison);
            }
            doc.moveDown(0.5);

            pdfService.newSection(doc, "3. Recent Citizens");
            if (data.citizens && data.citizens.length > 0) {
                pdfService.renderTable(doc, data.citizens.slice(0, 5), ["Full Name", "Email", "Phone", "Ward", "Status"], [22, 105, 135, 85, 80, 60], (c) => [c.full_name||"", c.email||"", c.phone||"", c.ward_name||"", c.status||""]);
            }

            pdfService.newSection(doc, "4. Recent Administrators");
            if (data.admins && data.admins.length > 0) {
                pdfService.renderTable(doc, data.admins.slice(0, 5), ["Full Name", "Email", "Phone", "Ward", "Position", "Status"], [22, 90, 120, 80, 75, 55, 45], (a) => [a.full_name||"", a.email||"", a.phone||"", a.ward_name||"", a.position_name||"", a.status||""]);
            }

            pdfService.renderFooter(doc);
            doc.end();
            stream.on("finish", () => resolve({ filePath, fileName }));
            stream.on("error", reject);
        });
    },

    renderHeader: (doc, title) => {
        doc.rect(0, 0, doc.page.width, 95).fill(BLUE);
        doc.fontSize(24).fillColor(WHITE).font("Helvetica-Bold").text("LAMS", 45, 18);
        doc.fontSize(10).fillColor("#a0bcd8").font("Helvetica").text("Local Administration Management System", 45, 44);
        doc.fontSize(16).fillColor(WHITE).font("Helvetica-Bold").text(title, 45, 64);
        doc.fontSize(8).fillColor("#a0bcd8").text("Generated: " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }), { align: "right" });
        doc.moveDown(1.5);
    },

    renderFooter: (doc) => {
        var pages = doc.bufferedPageRange().count;
        for (var i = 0; i < pages; i++) {
            doc.switchToPage(i);
            var bottom = doc.page.height - 35;
            doc.rect(0, bottom - 5, doc.page.width, 0.5).fill(BORDER);
            doc.fontSize(7).fillColor(GRAY).font("Helvetica");
            doc.text("LAMS - Local Administration Management System", 45, bottom + 2);
            doc.text("Page " + (i + 1) + " of " + pages, { align: "right" });
        }
    },

    renderSummaryLine: (doc, label, value) => {
        doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold").text(label + ": " + value);
        doc.moveDown(0.2);
    },

    renderFilters: (doc, filters) => {
        doc.fontSize(8).fillColor(GRAY).text("Filters: " + JSON.stringify(filters));
        doc.moveDown(0.3);
    },

    renderSummaryCard: (doc, items) => {
        var startY = doc.y;
        var x = 45;
        var cardWidth = 116;
        var cardHeight = 38;
        var cols = 4;
        items.forEach(function(item, i) {
            var col = i % cols;
            var row = Math.floor(i / cols);
            var cx = x + (col * (cardWidth + 8));
            var cy = startY + (row * (cardHeight + 6));
            if (cy + cardHeight > doc.page.height - 50) { doc.addPage(); startY = 50; cy = startY; }
            doc.rect(cx, cy, cardWidth, cardHeight).fill(LIGHT_BG).stroke(BORDER);
            doc.fontSize(7).fillColor(GRAY).font("Helvetica").text(item.label, cx + 6, cy + 5, { width: cardWidth - 12 });
            doc.fontSize(14).fillColor(BLUE).font("Helvetica-Bold").text(String(item.value), cx + 6, cy + 18, { width: cardWidth - 12 });
        });
        doc.y = startY + (Math.ceil(items.length / cols) * (cardHeight + 6)) + 6;
    },

    renderWardCards: (doc, wards) => {
        var startY = doc.y;
        var x = 45;
        var cardWidth = 116;
        var cardHeight = 52;
        var cols = 4;
        wards.forEach(function(ward, i) {
            var col = i % cols;
            var row = Math.floor(i / cols);
            var cx = x + (col * (cardWidth + 8));
            var cy = startY + (row * (cardHeight + 6));
            if (cy + cardHeight > doc.page.height - 50) { doc.addPage(); startY = 50; cy = startY; row = 0; }
            doc.rect(cx, cy, cardWidth, cardHeight).fill(WHITE).stroke(BORDER);
            doc.fontSize(9).fillColor(BLUE).font("Helvetica-Bold").text(ward.ward_name||"", cx + 6, cy + 5, { width: cardWidth - 12 });
            doc.fontSize(7).fillColor(GRAY).font("Helvetica").text("Citizens: " + (ward.citizen_count||0), cx + 6, cy + 22);
            doc.fontSize(7).fillColor(GRAY).text("Admins: " + (ward.admin_count||0), cx + 6, cy + 33);
        });
        doc.y = startY + (Math.ceil(wards.length / cols) * (cardHeight + 6)) + 10;
    },

    newSection: (doc, title) => {
        if (doc.y > doc.page.height - 120) doc.addPage();
        doc.moveDown(0.3);
        doc.fontSize(13).fillColor(BLUE).font("Helvetica-Bold").text(title, { underline: true });
        doc.moveDown(0.4);
    },

    renderTable: (doc, items, headers, widths, getRow) => {
        var tableWidth = widths.reduce((a,b) => a+b, 0);
        var startX = 45;
        var startY = doc.y;
        if (startY + 30 > doc.page.height - 50) doc.addPage();
        startY = doc.y;
        doc.rect(startX, startY, tableWidth, 18).fill(BLUE);
        doc.fontSize(7.5).fillColor(WHITE).font("Helvetica-Bold");
        var xp = startX + 3;
        var idxWidth = widths[0];
        doc.text("#", xp, startY + 4, { width: idxWidth - 3 });
        xp += idxWidth;
        for (var h = 1; h < headers.length; h++) {
            doc.text(headers[h-1], xp, startY + 4, { width: widths[h] - 3 });
            xp += widths[h];
        }
        var yp = startY + 18;
        doc.fontSize(7).font("Helvetica");
        items.forEach(function(item, index) {
            if (yp + 15 > doc.page.height - 50) {
                doc.addPage();
                yp = 50;
                doc.rect(startX, yp, tableWidth, 18).fill(BLUE);
                doc.fontSize(7.5).fillColor(WHITE).font("Helvetica-Bold");
                xp = startX + 3;
                doc.text("#", xp, yp + 4, { width: idxWidth - 3 });
                xp += idxWidth;
                for (var hh = 1; hh < headers.length; hh++) {
                    doc.text(headers[hh-1], xp, yp + 4, { width: widths[hh] - 3 });
                    xp += widths[hh];
                }
                yp += 18;
                doc.fontSize(7).font("Helvetica");
            }
            var bg = index % 2 === 0 ? LIGHT_BG : WHITE;
            doc.rect(startX, yp, tableWidth, 14).fill(bg);
            doc.fillColor(DARK);
            xp = startX + 3;
            doc.text(String(index + 1), xp, yp + 2, { width: idxWidth - 3 });
            xp += idxWidth;
            var rowData = getRow(item);
            for (var c = 0; c < rowData.length; c++) {
                var text = rowData[c] || "";
                if (text.length > widths[c+1] / 5.5) text = text.substring(0, Math.floor(widths[c+1] / 5.5) - 2) + "..";
                doc.text(text, xp, yp + 2, { width: widths[c+1] - 3 });
                xp += widths[c+1];
            }
            yp += 14;
        });
        doc.y = yp + 12;
    }
};

module.exports = pdfService;
