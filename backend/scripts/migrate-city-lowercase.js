/**
 * migrate-city-lowercase.js
 * One-time migration: lowercase + trim city in all Restaurant docs
 * and city in all User.addresses subdocuments.
 *
 * Run once: node scripts/migrate-city-lowercase.js
 */
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/food-delivery';

// ── Minimal schemas (lean, no controllers) ────────────────────────────
const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({}, { strict: false }));
const User       = mongoose.model('User',       new mongoose.Schema({}, { strict: false }));

async function migrateRestaurantCities() {
  const restaurants = await Restaurant.find({}).lean();
  let updated = 0;

  for (const r of restaurants) {
    const rawCity = r.city || '';
    const normalized = rawCity.trim().toLowerCase();
    if (rawCity !== normalized) {
      await Restaurant.updateOne({ _id: r._id }, { $set: { city: normalized } });
      console.log(`  [restaurant] "${r.restaurantName}" : "${rawCity}" → "${normalized}"`);
      updated++;
    } else {
      console.log(`  [restaurant] "${r.restaurantName}" : "${rawCity}" ← already OK`);
    }
  }
  console.log(`\n✅ Restaurants: ${updated} of ${restaurants.length} updated.\n`);
}

async function migrateUserAddressCities() {
  const users = await User.find({ 'addresses.0': { $exists: true } }).lean();
  let updatedUsers = 0;

  for (const u of users) {
    let changed = false;
    const newAddresses = (u.addresses || []).map(a => {
      const rawCity   = a.city || '';
      const normalized = rawCity.trim().toLowerCase();
      if (rawCity !== normalized) { changed = true; }
      return { ...a, city: normalized };
    });

    if (changed) {
      await User.updateOne({ _id: u._id }, { $set: { addresses: newAddresses } });
      console.log(`  [user] "${u.username}" addresses updated.`);
      updatedUsers++;
    }
  }
  console.log(`✅ Users with addresses updated: ${updatedUsers} of ${users.length}.\n`);
}

async function run() {
  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected.\n');

  console.log('── Migrating Restaurant.city ───────────────────────────────────');
  await migrateRestaurantCities();

  console.log('── Migrating User.addresses[].city ─────────────────────────────');
  await migrateUserAddressCities();

  await mongoose.disconnect();
  console.log('🏁 Migration complete. MongoDB disconnected.');
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
