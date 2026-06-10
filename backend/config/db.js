/**
 * MySQL Database Connection
 * Uses mysql2 with promise support for async/await
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool (reuses connections - better for production)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_task_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');
    connection.release();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
};

module.exports = { pool, testConnection };
