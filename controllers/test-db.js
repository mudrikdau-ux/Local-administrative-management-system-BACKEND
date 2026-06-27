const pool = require('./config/db');

async function test() {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', ['superadmin@lams.com']);
        console.log('Database connected!');
        console.log('User found:', rows[0]);
    } catch (error) {
        console.error('Database error:', error.message);
    }
    process.exit();
}

test();