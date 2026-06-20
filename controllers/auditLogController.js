const AuditLogModel = require('../models/AuditLogModel');
const pdfService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

const auditLogController = {
    getLogs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const data = await AuditLogModel.getAll(page, limit);
            res.json(data);
        } catch (error) {
            console.error('Get Logs Error:', error);
            res.status(500).json({ message: 'Server error fetching logs.' });
        }
    },

    getLogById: async (req, res) => {
        try {
            const log = await AuditLogModel.getById(req.params.id);
            if (!log) return res.status(404).json({ message: 'Log not found.' });
            res.json({ log });
        } catch (error) {
            console.error('Get Log Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    searchLogs: async (req, res) => {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            if (!q || q.trim().length < 2) return res.status(400).json({ message: 'Search query must be at least 2 characters.' });
            const data = await AuditLogModel.search(q.trim(), page, limit);
            res.json({ ...data, query: q });
        } catch (error) {
            console.error('Search Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    filterLogs: async (req, res) => {
        try {
            const { type, status, start_date, end_date } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const filters = {};
            if (type) filters.type = type;
            if (status) filters.status = status;
            if (start_date && end_date) { filters.start_date = start_date; filters.end_date = end_date; }
            const data = await AuditLogModel.filter(filters, page, limit);
            res.json(data);
        } catch (error) {
            console.error('Filter Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    getStatistics: async (req, res) => {
        try {
            const [stats, statusBreakdown, typeBreakdown] = await Promise.all([
                AuditLogModel.getStats(),
                AuditLogModel.getStatusBreakdown(),
                AuditLogModel.getTypeBreakdown()
            ]);
            res.json({ summary_cards: stats, charts: { status_breakdown: statusBreakdown, type_breakdown: typeBreakdown } });
        } catch (error) {
            console.error('Statistics Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    exportCSV: async (req, res) => {
        try {
            const filters = req.query;
            const logs = await AuditLogModel.getAllForExport(filters);
            let csv = 'ID,Email,Role,Action,Type,Status,Description,IP Address,Date,Time\n';
            logs.forEach(log => {
                const date = new Date(log.created_at);
                csv += '"' + log.id + '","' + (log.email || '') + '","' + (log.role || '') + '","' + (log.action || '') + '","' + (log.type || '') + '","' + (log.status || '') + '","' + ((log.description || '').replace(/"/g, '""')) + '","' + (log.ip_address || '') + '","' + date.toLocaleDateString() + '","' + date.toLocaleTimeString() + '"\n';
            });
            const fileName = 'Audit_Logs_' + Date.now() + '.csv';
            const filePath = path.join(__dirname, '../uploads/documents', fileName);
            fs.writeFileSync(filePath, csv);
            res.download(filePath, fileName, () => { fs.unlinkSync(filePath); });
        } catch (error) {
            console.error('CSV Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    exportPDF: async (req, res) => {
        try {
            const filters = req.query;
            const logs = await AuditLogModel.getAllForExport(filters);
            const { filePath, fileName } = await pdfService.generateAuditReport({ logs, total: logs.length }, filters);
            res.download(filePath, fileName, () => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); });
        } catch (error) {
            console.error('PDF Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    recordLog: async (req, res) => {
        try {
            const logId = await AuditLogModel.create(req.body);
            res.status(201).json({ message: 'Log recorded.', log_id: logId });
        } catch (error) {
            console.error('Record Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    }
};

module.exports = auditLogController;
