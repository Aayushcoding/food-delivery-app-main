const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  deleteMenu
} = require('../controllers/menuController');

router.get('/', getMenus); // Public - customers can view
router.get('/:id', getMenu); // Public - customers can view
router.post('/', auth, roleAuth(['Owner']), createMenu); // Only owners can create
router.put('/:id', auth, roleAuth(['Owner']), updateMenu); // Only owners can update
router.delete('/:id', auth, roleAuth(['Owner']), deleteMenu); // Only owners can delete

module.exports = router;