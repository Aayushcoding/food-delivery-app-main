////db.js
// Using JSON file database (db.json) instead of MongoDB
// All data operations go through utils/dbManager.js

const initDB = async() => {
  try {
    console.log('Database: Using db.json file system');
    console.log('Location: config/db.json');
  } catch(error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

module.exports = initDB;