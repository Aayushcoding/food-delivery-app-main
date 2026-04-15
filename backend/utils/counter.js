// utils/counter.js
// Atomic auto-increment ID generator backed by MongoDB.
// Uses findOneAndUpdate + $inc — safe under concurrent requests.
// Format: <prefix>_<seq>  e.g. usr_1, rest_2, menu_3, ord_4, cart_5

const Counter = require('../models/Counter');

/**
 * Returns the next sequential ID for a given name.
 * @param {string} name  - counter name, e.g. 'usr', 'rest', 'menu', 'ord', 'cart'
 * @returns {Promise<string>}  e.g. 'usr_1'
 */
const getNextSequence = async (name) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${name}_${counter.seq}`;
};

module.exports = { getNextSequence };
