// Run this with: node database/migrate.js from project root or server directory
const path = require('path');
const fs = require('fs');

// Try finding dotenv from server/node_modules or local
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (fs.existsSync(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

const envPath = fs.existsSync(path.join(__dirname, '..', 'server', '.env'))
  ? path.join(__dirname, '..', 'server', '.env')
  : path.join(__dirname, '.env');

require('dotenv').config({ path: envPath });

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migrations...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    process.stdout.write(`  Running ${file}... `);
    await pool.query(sql);
    console.log(`✓`);
  }

  console.log('All migrations complete.');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
