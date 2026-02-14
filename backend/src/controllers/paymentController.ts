import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { AuthRequest } from '../types';

export const checkOnboardingStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // With Razorpay, no seller onboarding is needed.
    // Payments go through platform account directly.
    const razorpayConfigured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id');

    res.json({
      success: true,
      data: { onboarded: razorpayConfigured },
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerBalance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Calculate balance from completed orders
    const orders = await Order.find({ seller: userId, status: 'completed' });
    const totalEarnings = orders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);

    const pendingOrders = await Order.find({ seller: userId, status: 'escrow' });
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.sellerPayout || 0), 0);

    res.json({
      success: true,
      data: {
        available: totalEarnings,
        pending: pendingAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};
