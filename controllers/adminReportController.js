const AdminAnalytics = require('../models/AdminAnalytics');
const GeneratedReport = require('../models/GeneratedReport');
const adminPdfService = require('../services/adminPdfService');
const AuditLogModel = require('../models/AuditLogModel');
const fs = require('fs');
const path = require('path');

const adminReportController = {
    // ====================================
    // DASHBOARD SUMMARY
    // ====================================
    getDashboardSummary: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const summary = await AdminAnalytics.getDashboardSummary(wardId);
            res.json({ success: true, summary });
        } catch (error) {
            console.error('Dashboard Summary Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // CITIZENS CHART DATA
    // ====================================
    getCitizensChart: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const data = await AdminAnalytics.getCitizensChartData(wardId);
            res.json({ success: true, ...data });
        } catch (error) {
            console.error('Citizens Chart Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // PAYMENTS CHART DATA
    // ====================================
    getPaymentsChart: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const data = await AdminAnalytics.getPaymentsChartData(wardId);
            res.json({ success: true, ...data });
        } catch (error) {
            console.error('Payments Chart Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // DOCUMENTS CHART DATA
    // ====================================
    getDocumentsChart: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const data = await AdminAnalytics.getDocumentsChartData(wardId);
            res.json({ success: true, ...data });
        } catch (error) {
            console.error('Documents Chart Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GENERATE REPORT
    // ====================================
    generateReport: async (req, res) => {
        try {
            const { report_type, filters } = req.body;
            const wardId = req.user.ward_id;
            const wardName = req.user.ward_name || 'Ward';
            const generatedByName = req.user.full_name || 'Admin';
            const generatedBy = req.user.admin_id || req.user.id;

            let result;
            let recordCount = 0;
            let reportName = '';

            switch (report_type) {
                case 'citizens': {
                    const citizens = await AdminAnalytics.getCitizensForReport(wardId, filters || {});
                    recordCount = citizens.length;
                    reportName = 'Citizens Report';
                    result = await adminPdfService.generateCitizensReport({ citizens }, wardName, generatedByName);
                    break;
                }
                case 'payments': {
                    const payments = await AdminAnalytics.getPaymentsForReport(wardId, filters || {});
                    recordCount = payments.length;
                    reportName = 'Payments Report';
                    result = await adminPdfService.generatePaymentsReport({ payments }, wardName, generatedByName);
                    break;
                }
                case 'documents': {
                    const documents = await AdminAnalytics.getDocumentsForReport(wardId, filters || {});
                    recordCount = documents.length;
                    reportName = 'Documents Report';
                    result = await adminPdfService.generateDocumentsReport({ documents }, wardName, generatedByName);
                    break;
                }
                case 'system': {
                    const [summary, citizens, payments] = await Promise.all([
                        AdminAnalytics.getDashboardSummary(wardId),
                        AdminAnalytics.getCitizensForReport(wardId),
                        AdminAnalytics.getPaymentsForReport(wardId)
                    ]);
                    recordCount = citizens.length + payments.length;
                    reportName = 'System Report';
                    result = await adminPdfService.generateSystemReport(
                        { summary, citizens, payments }, wardName, generatedByName
                    );
                    break;
                }
                default:
                    return res.status(400).json({ success: false, message: 'Invalid report type.' });
            }

            // Save report record
            const reportId = await GeneratedReport.create({
                report_name: reportName,
                report_type,
                file_path: result.filePath,
                file_size: fs.statSync(result.filePath).size,
                filters_applied: filters || {},
                record_count: recordCount,
                generated_by: generatedBy,
                generated_by_name: generatedByName,
                ward_id: wardId
            });

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'REPORT_GENERATED',
                type: 'report',
                status: 'success',
                description: `${reportName} generated with ${recordCount} records`,
                entity_type: 'report',
                entity_id: reportId,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Report generated successfully.',
                report: {
                    id: reportId,
                    name: reportName,
                    type: report_type,
                    file_name: result.fileName,
                    record_count: recordCount,
                    download_url: `/api/admin/reports/download/${reportId}`
                }
            });
        } catch (error) {
            console.error('Generate Report Error:', error);
            res.status(500).json({ success: false, message: 'Report generation failed.' });
        }
    },

    // ====================================
    // DOWNLOAD REPORT
    // ====================================
    downloadReport: async (req, res) => {
        try {
            const { reportId } = req.params;
            const wardId = req.user.ward_id;

            const report = await GeneratedReport.getById(reportId, wardId);
            if (!report || !report.file_path) {
                return res.status(404).json({ success: false, message: 'Report not found.' });
            }

            const filePath = report.file_path;
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ success: false, message: 'Report file not found on server.' });
            }

            // Increment download count
            await GeneratedReport.incrementDownload(reportId);

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'REPORT_DOWNLOADED',
                type: 'report',
                status: 'success',
                description: `Report downloaded: ${report.report_name}`,
                entity_type: 'report',
                entity_id: reportId,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            const fileName = path.basename(filePath);
            res.download(filePath, fileName);
        } catch (error) {
            console.error('Download Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // GET REPORT HISTORY
    // ====================================
    getReportHistory: async (req, res) => {
        try {
            const wardId = req.user.ward_id;
            const { page, limit, search, type } = req.query;

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                search: search || null,
                type: type || null
            };

            const result = await GeneratedReport.getAll(wardId, options);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('History Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    },

    // ====================================
    // SHARE REPORT
    // ====================================
    shareReport: async (req, res) => {
        try {
            const { reportId, method, recipient } = req.body;
            const wardId = req.user.ward_id;

            const report = await GeneratedReport.getById(reportId, wardId);
            if (!report) {
                return res.status(404).json({ success: false, message: 'Report not found.' });
            }

            // For email sharing
            if (method === 'email' && recipient) {
                const { sendReportEmail } = require('../services/emailService');
                try {
                    await sendReportEmail(recipient, report, req.user.full_name);
                } catch (emailError) {
                    console.log('Email not sent:', emailError.message);
                }
            }

            // Audit log
            await AuditLogModel.create({
                email: req.user.email,
                role: 'admin',
                action: 'REPORT_SHARED',
                type: 'report',
                status: 'success',
                description: `Report shared via ${method} to ${recipient || 'link'}`,
                entity_type: 'report',
                entity_id: reportId,
                performed_by: req.user.id,
                ip_address: req.ip
            });

            res.json({
                success: true,
                message: 'Report shared successfully.',
                share_method: method,
                download_url: `/api/admin/reports/download/${reportId}`
            });
        } catch (error) {
            console.error('Share Error:', error);
            res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
};

module.exports = adminReportController;