import { Request, Response, NextFunction } from 'express';
import { Listing } from '../models/Listing';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalListings, activeListings, totalOrders, completedOrders, disputedOrders] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'disputed' }),
    ]);

    // Revenue from completed orders
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalFees: { $sum: '$platformFee' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalListings,
        activeListings,
        totalOrders,
        completedOrders,
        disputedOrders,
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        platformEarnings: revenueResult[0]?.totalFees || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFlaggedListings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const listings = await Listing.find({ status: 'flagged' })
      .populate('seller', 'name email')
      .populate('university', 'name')
      .sort('-createdAt');

    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};

export const moderateListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'remove'

    if (!['approve', 'remove'].includes(action)) {
      throw new ApiError(400, 'Action must be "approve" or "remove".');
    }

    const listing = await Listing.findByIdAndUpdate(
      id,
      { status: action === 'approve' ? 'active' : 'removed' },
      { new: true }
    );

    if (!listing) throw new ApiError(404, 'Listing not found.');

    res.json({ success: true, message: `Listing ${action}d.`, data: listing });
  } catch (error) {
    next(error);
  }
};

export const getDisputedOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find({ status: 'disputed' })
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('listing', 'title type')
      .sort('-createdAt');

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
