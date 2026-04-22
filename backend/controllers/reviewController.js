// controllers/reviewController.js
const Review      = require('../models/Review');
const Order       = require('../models/Order');
const User        = require('../models/User');
const Restaurant  = require('../models/Restaurant');
const { getNextSequence } = require('../utils/counter');

/** Recalculate avg rating + reviewCount and persist to Restaurant */
async function updateRestaurantRating(restaurantId) {
  if (!restaurantId) return;
  const reviews = await Review.find({ restaurantId }).lean();
  const count   = reviews.length;
  const avg     = count > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  await Restaurant.findOneAndUpdate(
    { restaurantId },
    { rating: avg, reviewCount: count }
  );
}

// POST /api/reviews  — submit a review (only for delivered orders)
const submitReview = async (req, res) => {
  try {
    const { orderId, rating, comment, restaurantId } = req.body;

    if (!orderId)     return res.status(400).json({ success: false, message: 'orderId is required' });
    if (!rating)      return res.status(400).json({ success: false, message: 'rating is required' });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });

    // Verify the order exists and is delivered
    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'delivered')
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for delivered orders' });

    // Ensure only the customer who placed the order can review it
    if (req.user && order.userId !== req.user.id)
      return res.status(403).json({ success: false, message: 'You can only review your own orders' });

    // Prevent duplicate reviews for the same order
    const existing = await Review.findOne({ orderId }).lean();
    if (existing)
      return res.status(400).json({ success: false, message: 'A review for this order already exists' });

    // Resolve username
    const user = await User.findOne({ id: order.userId }).lean();
    const username = user?.username || 'Anonymous';

    const resolvedRestaurantId = restaurantId || order.restaurantId || '';

    const review = await new Review({
      id:           await getNextSequence('rev'),
      userId:       order.userId,
      restaurantId: resolvedRestaurantId,
      orderId,
      username,
      rating:       Number(rating),
      comment:      comment?.trim() || '',
      createdAt:    new Date().toISOString()
    }).save();

    const { _id, __v, ...clean } = review.toObject();

    // Update restaurant rating + review count
    await updateRestaurantRating(resolvedRestaurantId);

    res.status(201).json({ success: true, message: 'Review submitted successfully', data: clean });
  } catch (err) {
    console.error('[submitReview]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/:restaurantId  — get all reviews for a restaurant
const getReviewsByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId)
      return res.status(400).json({ success: false, message: 'restaurantId is required' });

    const reviews = await Review.find({ restaurantId }).sort({ createdAt: -1 }).lean();
    const clean   = reviews.map(({ _id, __v, ...r }) => r);
    res.json({ success: true, data: clean });
  } catch (err) {
    console.error('[getReviewsByRestaurant]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/order/:orderId — check if review exists for an order
const getReviewByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({ orderId }).lean();
    if (!review)
      return res.json({ success: true, data: null });
    const { _id, __v, ...clean } = review;
    res.json({ success: true, data: clean });
  } catch (err) {
    console.error('[getReviewByOrder]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { submitReview, getReviewsByRestaurant, getReviewByOrder };
