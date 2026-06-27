const os = require('os');
const pool = require('../config/db');

const healthController = {
    getHealth: async (req, res) => {
        try {
            // Database check
            let dbStatus = 'connected';
            let dbResponseTime = 0;
            try {
                const start = Date.now();
                await pool.execute('SELECT 1');
                dbResponseTime = Date.now() - start;
            } catch (e) {
                dbStatus = 'disconnected';
            }

            const healthData = {
                status: dbStatus === 'connected' ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                server: {
                    platform: os.platform(),
                    node_version: process.version,
                    memory_usage: {
                        total: Math.floor(os.totalmem() / (1024 * 1024)) + ' MB',
                        free: Math.floor(os.freemem() / (1024 * 1024)) + ' MB',
                        usage_percent: Math.floor((1 - os.freemem() / os.totalmem()) * 100)
                    },
                    cpu_cores: os.cpus().length,
                    cpu_load: os.loadavg()
                },
                database: {
                    status: dbStatus,
                    response_time_ms: dbResponseTime,
                    host: process.env.DB_HOST
                },
                api: {
                    status: 'running',
                    port: process.env.PORT || 5000
                }
            };

            res.json({ success: true, health: healthData });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Health check failed.' });
        }
    }
};

module.exports = healthController;