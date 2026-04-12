#!/usr/bin/env node

/**
 * Hash all passwords in db.json
 * Converts plain text passwords to bcrypt hashes
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'config/db.json');

async function hashPasswords() {
  try {
    console.log('📝 Reading db.json...');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

    if (!data.users || !Array.isArray(data.users)) {
      console.error('❌ No users array found in db.json');
      process.exit(1);
    }

    console.log(`🔐 Hashing ${data.users.length} user passwords...`);
    
    for (let i = 0; i < data.users.length; i++) {
      const user = data.users[i];
      if (user.password && !user.password.startsWith('$2')) { // Not already hashed
        user.password = await bcrypt.hash(user.password, 10);
        console.log(`   ✓ User ${i + 1}/${data.users.length}: ${user.email}`);
      }
    }

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log('✅ All passwords hashed successfully!');
    console.log('💾 Changes saved to db.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

hashPasswords();
