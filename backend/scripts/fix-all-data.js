/**
 * fix-all-data.js
 * ───────────────────────────────────────────────────────────────────────────
 * One-shot repair script.  Run ONCE after deploying the code fixes:
 *   node scripts/fix-all-data.js
 *
 * What this does:
 *   1. Lowercase + trim Restaurant.city on every document.
 *   2. Lowercase + trim city in every User.addresses subdocument.
 *   3. Patch orders whose restaurantId is empty/null by reading the
 *      restaurantId from the first cart-item's menu record.
 * ───────────────────────────────────────────────────────────────────────────
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food-delivery';

// ── Minimal loose schemas (strict:false so we read every field) ───────────
const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
const User       = mongoose.model('User',       new mongoose.Schema({}, { strict: false }));
const Order      = mongoose.model('Order',      new mongoose.Schema({}, { strict: false }));
const Menu       = mongoose.model('Menu',       new mongoose.Schema({}, { strict: false }));

// ─────────────────────────────────────────────────────────────────────────
// 1. Normalize Restaurant.city
// ─────────────────────────────────────────────────────────────────────────
async function fixRestaurantCities() {
  console.log('\n── Fix 1: Restaurant.city → lowercase + trim ───────────────────────────');
  const restaurants = await Restaurant.find({}).lean();
  let updated = 0;

  for (const r of restaurants) {
    const raw = r.city || '';
    const fixed = raw.trim().toLowerCase();
    if (raw !== fixed) {
      await Restaurant.updateOne({ _id: r._id }, { $set: { city: fixed } });
      console.log(`  ✏️  "${r.restaurantName}" | "${raw}" → "${fixed}"`);
      updated++;
    } else {
      console.log(`  ✅ "${r.restaurantName}" | city="${fixed}" (ok)`);
    }
  }
  console.log(`\n  → ${updated} of ${restaurants.length} restaurants updated.\n`);
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Normalize User.addresses[].city
// ─────────────────────────────────────────────────────────────────────────
async function fixUserAddressCities() {
  console.log('── Fix 2: User.addresses[].city → lowercase + trim ─────────────────────');
  const users = await User.find({ 'addresses.0': { $exists: true } }).lean();
  let updatedUsers = 0;

  for (const u of users) {
    let changed = false;
    const newAddresses = (u.addresses || []).map(a => {
      const raw   = a.city || '';
      const fixed = raw.trim().toLowerCase();
      if (raw !== fixed) changed = true;
      return { ...a, city: fixed };
    });

    if (changed) {
      await User.updateOne({ _id: u._id }, { $set: { addresses: newAddresses } });
      console.log(`  ✏️  User "${u.username}" – addresses city fixed`);
      updatedUsers++;
    }
  }
  console.log(`\n  → ${updatedUsers} of ${users.length} users (with addresses) updated.\n`);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Patch orders with missing restaurantId
// ─────────────────────────────────────────────────────────────────────────
async function fixOrderRestaurantIds() {
  console.log('── Fix 3: Orders with empty restaurantId → backfill from menu ──────────');

  const badOrders = await Order.find({
    $or: [{ restaurantId: '' }, { restaurantId: null }, { restaurantId: { $exists: false } }]
  }).lean();

  if (badOrders.length === 0) {
    console.log('  ✅ No orders with missing restaurantId found.\n');
    return;
  }

  let fixed = 0;
  for (const o of badOrders) {
    const firstItemId = (o.items || [])[0]?.itemId;
    if (!firstItemId) {
      console.log(`  ⚠️  Order ${o.id} – no items, cannot backfill restaurantId`);
      continue;
    }
    const menuItem = await Menu.findOne({ menuId: firstItemId }).lean();
    if (!menuItem?.restaurantId) {
      console.log(`  ⚠️  Order ${o.id} – menu item ${firstItemId} not found, skipping`);
      continue;
    }
    await Order.updateOne({ _id: o._id }, { $set: { restaurantId: menuItem.restaurantId } });
    console.log(`  ✏️  Order ${o.id} → restaurantId set to "${menuItem.restaurantId}"`);
    fixed++;
  }
  console.log(`\n  → ${fixed} of ${badOrders.length} bad orders fixed.\n`);
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Patch orders where finalAmount is 0 but totalAmount > 0
// ─────────────────────────────────────────────────────────────────────────
async function fixFinalAmounts() {
  console.log('── Fix 4: Orders with finalAmount=0 but totalAmount>0 → fix finalAmount ─');

  const result = await Order.updateMany(
    { finalAmount: 0, totalAmount: { $gt: 0 } },
    [{ $set: { finalAmount: '$totalAmount' } }]
  );
  console.log(`  → ${result.modifiedCount} orders updated.\n`);
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
async function run() {
  console.log('🔌 Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected.\n');

  await fixRestaurantCities();
  await fixUserAddressCities();
  await fixOrderRestaurantIds();
  await fixFinalAmounts();

  await mongoose.disconnect();
  console.log('🏁 All fixes applied. MongoDB disconnected.');
}

run().catch(err => {
  console.error('❌ Script failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
