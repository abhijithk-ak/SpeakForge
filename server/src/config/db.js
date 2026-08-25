// Creates and exports the PostgreSQL connection pool.
// We use a pool (not a single connection) so multiple
// requests can be handled simultaneously.

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,           // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', err);
});

// Test the connection on startup
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    logger.error('PostgreSQL connection failed', err);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
