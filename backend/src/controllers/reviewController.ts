import { Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Order } from '../models/Order';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviewerId = req.user?.id;
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) throw new ApiError(400, 'Order ID and rating are required.');
    if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.status !== 'completed') throw new ApiError(400, 'Can only review completed orders.');
    if (order.buyer.toString() !== reviewerId) throw new ApiError(403, 'Only the buyer can leave a review.');

    // Check for existing review
    const existing = await Review.findOne({ order: orderId, reviewer: reviewerId });
    if (existing) throw new ApiError(400, 'You have already reviewed this order.');

    const review = await Review.create({
      order: orderId,
      reviewer: reviewerId,
      reviewee: order.seller,
      listing: order.listing,
      rating,
      comment: comment || '',
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

export const getSellerReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sellerId } = req.params;

    const reviews = await Review.find({ reviewee: sellerId })
      .populate('reviewer', 'name avatar')
      .populate('listing', 'title')
      .sort('-createdAt');

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: { reviews, averageRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length },
    });
  } catch (error) {
    next(error);
  }
};
