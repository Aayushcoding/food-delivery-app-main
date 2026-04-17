/**
 * seed-agent.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot script: creates the demo Delivery Agent account if it does not
 * already exist.
 *
 * Usage (from the /backend directory):
 *   node seed-agent.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();            // Load MONGODB_URI from .env
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/* ── Inline schemas (avoids circular-require issues when run standalone) ── */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const userSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email:    { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phoneNo:  { type: String, default: '' },
  role:     { type: String, enum: ['Customer', 'Owner', 'DeliveryAgent', 'Admin'], default: 'Customer' },
  createdAt:{ type: String, default: () => new Date().toISOString() }
}, { versionKey: false });
userSchema.index({ email: 1, role: 1 }, { unique: true });
const User = mongoose.models.User || mongoose.model('User', userSchema);

/* ── Helper: next auto-increment ID ──────────────────────────────────────── */
async function getNextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${name.toUpperCase()}-${String(doc.seq).padStart(4, '0')}`;
}

/* ── Main ────────────────────────────────────────────────────────────────── */
async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bytebites';

  console.log('🔗 Connecting to MongoDB …');
  await mongoose.connect(uri);
  console.log('✅ Connected.');

  const TARGET_EMAIL = 'agent@test.com';
  const TARGET_ROLE  = 'DeliveryAgent';

  const existing = await User.findOne({ email: TARGET_EMAIL, role: TARGET_ROLE });
  if (existing) {
    console.log(`ℹ️  Agent account already exists  (email: ${TARGET_EMAIL})`);
    console.log('   id      :', existing.id);
    console.log('   username:', existing.username);
    await mongoose.disconnect();
    return;
  }

  const id       = await getNextSequence('usr');
  const hashed   = await bcrypt.hash('123456', 10);
  const agent    = await new User({
    id,
    username: 'Test Agent',
    email:    TARGET_EMAIL,
    password: hashed,
    phoneNo:  '9876543210',
    role:     TARGET_ROLE
  }).save();

  console.log('🎉 Delivery Agent account created successfully!');
  console.log('   id      :', agent.id);
  console.log('   email   :', agent.email);
  console.log('   password: 123456  (plain — hashed in DB)');
  console.log('   role    :', agent.role);

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
