const Dashboard = require('../models/Dashboard');

const dashboardController = {
    getFullDashboard: async (req, res) => {
        try {
            const dashboardData = await Dashboard.getFullDashboard();
            res.json(dashboardData);
        } catch (error) {
            console.error('Dashboard Error:', error);
            res.status(500).json({ message: 'Server error loading dashboard.' });
        }
    },

    getStatistics: async (req, res) => {
        try {
            const stats = await Dashboard.getSummaryStats();
            const systemStatus = await Dashboard.getSystemStatus();
            res.json({ system_status: systemStatus, statistics: stats });
        } catch (error) {
            res.status(500).json({ message: 'Server error loading statistics.' });
        }
    },

    getLeadership: async (req, res) => {
        try {
            const leadership = await Dashboard.getLeadershipOverview();
            res.json({ leadership });
        } catch (error) {
            res.status(500).json({ message: 'Server error loading leadership data.' });
        }
    },

    getActivities: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const activities = await Dashboard.getRecentActivities(limit);
            res.json({ activities, total: activities.length });
        } catch (error) {
            res.status(500).json({ message: 'Server error loading activities.' });
        }
    },

    getNotifications: async (req, res) => {
        try {
            const notifications = await Dashboard.getNotifications(10);
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ message: 'Server error loading notifications.' });
        }
    },

    getChartData: async (req, res) => {
        try {
            const [citizensPerWard, adminsPerWard, adminStatusDistribution, citizenStatusDistribution, revenueOverview] = await Promise.all([
                Dashboard.getCitizensPerWard(),
                Dashboard.getAdminsPerWard(),
                Dashboard.getAdminStatusDistribution(),
                Dashboard.getCitizenStatusDistribution(),
                Dashboard.getRevenueOverview()
            ]);

            res.json({
                citizens_per_ward: citizensPerWard,
                admins_per_ward: adminsPerWard,
                admin_status_distribution: adminStatusDistribution,
                citizen_status_distribution: citizenStatusDistribution,
                revenue_overview: revenueOverview
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error loading chart data.' });
        }
    },

    getSystemStatus: async (req, res) => {
        try {
            const status = await Dashboard.getSystemStatus();
            res.json(status);
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'System check failed.' });
        }
    }
};

module.exports = dashboardController;