const dotenv = require('dotenv');
dotenv.config();
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASSWORD);