// Run this with: node database/migrate.js
// It reads all .sql files in order and runs them against your database

require('dotenv').config({ path: 'server/.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // runs in filename order: 001_, 002_, etc.

  console.log(`Running ${files.length} migrations...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`  Running ${file}...`);
    await pool.query(sql);
    console.log(`  ✓ ${file}`);
  }

  console.log('All migrations complete.');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
