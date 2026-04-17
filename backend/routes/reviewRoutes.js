// routes/reviewRoutes.js
const express = require('express');
const router  = express.Router();
const { submitReview, getReviewsByRestaurant, getReviewByOrder } = require('../controllers/reviewController');

// POST /api/reviews           — submit a review
router.post('/', submitReview);

// GET  /api/reviews/order/:orderId  — check review for a specific order (must come before /:restaurantId)
router.get('/order/:orderId', getReviewByOrder);

// GET  /api/reviews/:restaurantId   — all reviews for a restaurant
router.get('/:restaurantId', getReviewsByRestaurant);

module.exports = router;
