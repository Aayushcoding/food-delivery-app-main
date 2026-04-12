////seed.js
// ─────────────────────────────────────────────────────────────────────────────
// SEED — NOT NEEDED
// The database (config/db.json) already contains all required seed data.
// Running this file is safe: it will print a message and exit cleanly.
//
// DO NOT run this file — it was previously using Mongoose (MongoDB) which is
// not connected in this project. All data lives in db.json via dbManager.js.
// ─────────────────────────────────────────────────────────────────────────────

const path = require('path');
const fs   = require('fs');

const dbPath = path.join(__dirname, '../config/db.json');

try {
  const raw  = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SEED — NOT REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Users:       ${(data.users        || []).length}`);
  console.log(`  Restaurants: ${(data.restaurants  || []).length}`);
  console.log(`  Menus:       ${(data.menus        || []).length}`);
  console.log(`  Orders:      ${(data.orders       || []).length}`);
  console.log(`  Carts:       ${(data.carts        || []).length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  db.json already has data. Nothing to seed.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  process.exit(0);
} catch(err) {
  console.error('Could not read db.json:', err.message);
  process.exit(1);
}