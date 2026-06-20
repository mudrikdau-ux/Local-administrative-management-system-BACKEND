const Citizen = require('../models/Citizen');
const AuditLog = require('../models/AuditLog');

const citizenMonitoringController = {
    // ====================================
    // GET ALL CITIZENS
    // ====================================
    getAllCitizens: async (req, res) => {
        try {
            const citizens = await Citizen.getAll();
            res.json({
                citizens,
                total: citizens.length
            });
        } catch (error) {
            console.error('Get All Citizens Error:', error);
            res.status(500).json({ message: 'Server error fetching citizens.' });
        }
    },

    // ====================================
    // GET CITIZEN BY ID
    // ====================================
    getCitizenById: async (req, res) => {
        try {
            const citizen = await Citizen.getById(req.params.id);
            if (!citizen) {
                return res.status(404).json({ message: 'Citizen not found.' });
            }

            // Log view action
            await AuditLog.create({
                action: 'CITIZEN_VIEWED',
                entity_type: 'citizen',
                entity_id: req.params.id,
                description: `Citizen ${citizen.full_name} profile viewed`,
                performed_by: req.query.super_admin_id || null,
                ip_address: req.ip
            });

            res.json({ citizen });
        } catch (error) {
            console.error('Get Citizen Error:', error);
            res.status(500).json({ message: 'Server error fetching citizen.' });
        }
    },

    // ====================================
    // SEARCH CITIZENS
    // ====================================
    searchCitizens: async (req, res) => {
        try {
            const { q } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({ message: 'Search query must be at least 2 characters.' });
            }

            const citizens = await Citizen.search(q.trim());

            // Log search action
            await AuditLog.create({
                action: 'CITIZEN_SEARCH',
                entity_type: 'citizen',
                description: `Citizen search performed with query: "${q}"`,
                performed_by: req.query.super_admin_id || null,
                ip_address: req.ip
            });

            res.json({
                citizens,
                total: citizens.length,
                query: q
            });
        } catch (error) {
            console.error('Search Citizens Error:', error);
            res.status(500).json({ message: 'Server error during search.' });
        }
    },

    // ====================================
    // FILTER CITIZENS
    // ====================================
    filterCitizens: async (req, res) => {
        try {
            const { status, ward_id } = req.query;
            const filters = {};

            if (status) filters.status = status;
            if (ward_id) filters.ward_id = ward_id;

            const citizens = await Citizen.filter(filters);

            res.json({
                citizens,
                total: citizens.length,
                filters_applied: filters
            });
        } catch (error) {
            console.error('Filter Citizens Error:', error);
            res.status(500).json({ message: 'Server error during filtering.' });
        }
    },

    // ====================================
    // OVERALL STATISTICS (Summary Cards)
    // ====================================
    getOverallStatistics: async (req, res) => {
        try {
            const stats = await Citizen.getOverallStats();
            res.json({ statistics: stats });
        } catch (error) {
            console.error('Statistics Error:', error);
            res.status(500).json({ message: 'Server error fetching statistics.' });
        }
    },

    // ====================================
    // WARD STATISTICS (Ward Cards)
    // ====================================
    getWardStatistics: async (req, res) => {
        try {
            const wardStats = await Citizen.getWardStats();
            res.json({
                wards: wardStats,
                total_wards: wardStats.length
            });
        } catch (error) {
            console.error('Ward Statistics Error:', error);
            res.status(500).json({ message: 'Server error fetching ward statistics.' });
        }
    },

    // ====================================
    // CITIZENS BY WARD
    // ====================================
    getCitizensByWard: async (req, res) => {
        try {
            const { ward_id } = req.params;
            const citizens = await Citizen.getCitizensByWard(ward_id);
            res.json({
                ward_id,
                citizens,
                total: citizens.length
            });
        } catch (error) {
            console.error('Citizens By Ward Error:', error);
            res.status(500).json({ message: 'Server error.' });
        }
    },

    // ====================================
    // FULL DASHBOARD DATA (All in one)
    // ====================================
    getDashboardData: async (req, res) => {
        try {
            const [overallStats, wardStats] = await Promise.all([
                Citizen.getOverallStats(),
                Citizen.getWardStats()
            ]);

            res.json({
                summary_cards: overallStats,
                ward_cards: wardStats
            });
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({ message: 'Server error fetching dashboard data.' });
        }
    }
};

module.exports = citizenMonitoringController;