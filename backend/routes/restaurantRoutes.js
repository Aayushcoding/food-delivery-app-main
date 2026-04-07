const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');

router.get('/', getRestaurants); // Public - customers can view
router.get('/:id', getRestaurant); // Public - customers can view
router.post('/', auth, roleAuth(['Owner']), createRestaurant); // Only owners can create
router.put('/:id', auth, roleAuth(['Owner']), updateRestaurant); // Only owners can update
router.delete('/:id', auth, roleAuth(['Owner']), deleteRestaurant); // Only owners can delete

module.exports = router;