////userRoutes.js
const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  addAddress,
  deleteAddress
} = require('../controllers/userController');

// Protected — requires auth (not exposed publicly)
router.get('/', auth, getUsers);
router.get('/:id', getUser);

// Registration (public — use /api/auth/register/* instead, this is legacy)
router.post('/signup', createUser);

// Protected
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);

// ── Address management ──────────────────────────────────────────────────────
// POST   /api/users/:id/addresses          → add a new saved address
// DELETE /api/users/:id/addresses/:addressId → remove a saved address
router.post('/:id/addresses', auth, addAddress);
router.delete('/:id/addresses/:addressId', auth, deleteAddress);

module.exports = router;