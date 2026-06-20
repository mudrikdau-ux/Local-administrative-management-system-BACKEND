const Report = require('../models/Report');
const pdfService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

const reportController = {
    // ====================================
    // DASHBOARD STATISTICS
    // ====================================
    getDashboardStats: async (req, res) => {
        try {
            const overview = await Report.getSystemOverview();
            const wardComparison = await Report.getWardComparisonData();
            const citizenStatusBreakdown = await Report.getCitizenStatusBreakdown();
            const adminStatusBreakdown = await Report.getAdminStatusBreakdown();
            const reportStats = await Report.getStats();

            res.json({
                summary_cards: {
                    total_citizens: overview.citizens.total,
                    total_admins: overview.admins.total,
                    active_citizens: overview.citizens.active,
                    active_admins: overview.admins.active,
                    total_audit_logs: overview.audit_logs.total,
                    total_reports: overview.reports.total
                },
                charts: {
                    ward_comparison: wardComparison,
                    citizen_status: citizenStatusBreakdown,
                    admin_status: adminStatusBreakdown
                },
                report_stats: reportStats
            });
        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            res.status(500).json({ message: 'Server error fetching dashboard statistics.' });
        }
    },

    // ====================================
    // GENERATE CITIZEN REPORT
    // ====================================
    generateCitizenReport: async (req, res) => {
        try {
            const filters = req.body || {};
            const citizens = await Report.getCitizensForReport(filters);
            const generatedBy = req.body.generated_by || 1;
            const generatedByName = req.body.generated_by_name || 'Super Admin';

            const { filePath, fileName } = await pdfService.generateCitizenReport({
                citizens,
                total: citizens.length
            }, filters);

            // Save report record
            await Report.create({
                report_type: 'citizens',
                report_name: 'Citizen Report',
                description: 'Complete report of all citizens',
                file_path: filePath,
                filters_applied: filters,
                record_count: citizens.length,
                generated_by: generatedBy,
                generated_by_name: generatedByName
            });

            res.json({
                message: 'Citizen report generated successfully.',
                report: {
                    file_name: fileName,
                    file_path: filePath,
                    record_count: citizens.length,
                    download_url: `/api/super-admin/reports/download/${fileName}`
                }
            });
        } catch (error) {
            console.error('Generate Citizen Report Error:', error);
            res.status(500).json({ message: 'Server error generating report.' });
        }
    },

    // ====================================
    // GENERATE ADMIN REPORT
    // ====================================
    generateAdminReport: async (req, res) => {
        try {
            const filters = req.body || {};
            const admins = await Report.getAdminsForReport(filters);
            const generatedBy = req.body.generated_by || 1;
            const generatedByName = req.body.generated_by_name || 'Super Admin';

            const { filePath, fileName } = await pdfService.generateAdminReport({
                admins,
                total: admins.length
            }, filters);

            await Report.create({
                report_type: 'admins',
                report_name: 'Admin Report',
                description: 'Complete report of all administrators',
                file_path: filePath,
                filters_applied: filters,
                record_count: admins.length,
                generated_by: generatedBy,
                generated_by_name: generatedByName
            });

            res.json({
                message: 'Admin report generated successfully.',
                report: {
                    file_name: fileName,
                    file_path: filePath,
                    record_count: admins.length,
                    download_url: `/api/super-admin/reports/download/${fileName}`
                }
            });
        } catch (error) {
            console.error('Generate Admin Report Error:', error);
            res.status(500).json({ message: 'Server error generating report.' });
        }
    },

    // ====================================
    // GENERATE AUDIT REPORT
    // ====================================
    generateAuditReport: async (req, res) => {
        try {
            const filters = req.body || {};
            const logs = await Report.getAuditLogsForReport(filters);
            const generatedBy = req.body.generated_by || 1;
            const generatedByName = req.body.generated_by_name || 'Super Admin';

            const { filePath, fileName } = await pdfService.generateAuditReport({
                logs,
                total: logs.length
            }, filters);

            await Report.create({
                report_type: 'audit',
                report_name: 'Audit Report',
                description: 'System activities and logs',
                file_path: filePath,
                filters_applied: filters,
                record_count: logs.length,
                generated_by: generatedBy,
                generated_by_name: generatedByName
            });

            res.json({
                message: 'Audit report generated successfully.',
                report: {
                    file_name: fileName,
                    file_path: filePath,
                    record_count: logs.length,
                    download_url: `/api/super-admin/reports/download/${fileName}`
                }
            });
        } catch (error) {
            console.error('Generate Audit Report Error:', error);
            res.status(500).json({ message: 'Server error generating report.' });
        }
    },

    // ====================================
    // GENERATE FULL SYSTEM REPORT
    // ====================================
    generateFullSystemReport: async (req, res) => {
        try {
            const generatedBy = req.body.generated_by || 1;
            const generatedByName = req.body.generated_by_name || 'Super Admin';

            const [overview, wardComparison, citizens, admins] = await Promise.all([
                Report.getSystemOverview(),
                Report.getWardComparisonData(),
                Report.getCitizensForReport({}),
                Report.getAdminsForReport({})
            ]);

            const { filePath, fileName } = await pdfService.generateFullSystemReport({
                overview,
                wardComparison,
                citizens,
                admins
            });

            await Report.create({
                report_type: 'full_system',
                report_name: 'Full System Report',
                description: 'Complete system overview including citizens, admins, audit logs, wards, and statistics',
                file_path: filePath,
                filters_applied: {},
                record_count: citizens.length + admins.length,
                generated_by: generatedBy,
                generated_by_name: generatedByName
            });

            res.json({
                message: 'Full system report generated successfully.',
                report: {
                    file_name: fileName,
                    file_path: filePath,
                    record_count: citizens.length + admins.length,
                    download_url: `/api/super-admin/reports/download/${fileName}`
                }
            });
        } catch (error) {
            console.error('Generate Full System Report Error:', error);
            res.status(500).json({ message: 'Server error generating report.' });
        }
    },

    // ====================================
    // DOWNLOAD REPORT
    // ====================================
    downloadReport: async (req, res) => {
        try {
            const { fileName } = req.params;
            const filePath = path.join(__dirname, '../uploads/documents', fileName);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Report file not found.' });
            }

            res.download(filePath, fileName);
        } catch (error) {
            console.error('Download Error:', error);
            res.status(500).json({ message: 'Server error downloading report.' });
        }
    },

    // ====================================
    // VIEW REPORT (Preview)
    // ====================================
    viewReport: async (req, res) => {
        try {
            const { fileName } = req.params;
            const filePath = path.join(__dirname, '../uploads/documents', fileName);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Report file not found.' });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } catch (error) {
            console.error('View Error:', error);
            res.status(500).json({ message: 'Server error viewing report.' });
        }
    },

    // ====================================
    // GET REPORT HISTORY
    // ====================================
    getReportHistory: async (req, res) => {
        try {
            const reports = await Report.getHistory();
            res.json({ reports, total: reports.length });
        } catch (error) {
            console.error('History Error:', error);
            res.status(500).json({ message: 'Server error fetching history.' });
        }
    },

    // ====================================
    // DELETE REPORT
    // ====================================
    deleteReport: async (req, res) => {
        try {
            const { id } = req.params;
            const report = await Report.getById(id);

            if (!report) {
                return res.status(404).json({ message: 'Report not found.' });
            }

            // Delete file if exists
            if (report.file_path && fs.existsSync(report.file_path)) {
                fs.unlinkSync(report.file_path);
            }

            await Report.delete(id);
            res.json({ message: 'Report deleted successfully.' });
        } catch (error) {
            console.error('Delete Error:', error);
            res.status(500).json({ message: 'Server error deleting report.' });
        }
    }
};

module.exports = reportController;