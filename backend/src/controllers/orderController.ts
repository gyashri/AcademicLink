import { Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Listing } from '../models/Listing';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { createRazorpayOrder, verifyRazorpayPayment, refundPayment } from '../services/paymentService';
import { getSignedDownloadUrl } from '../services/storageService';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerId = req.user?.id;
    const { listingId } = req.body;

    if (!listingId) throw new ApiError(400, 'Listing ID is required.');

    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, 'Listing not found.');
    if (listing.status !== 'active') throw new ApiError(400, 'This listing is no longer available.');
    // In production, prevent buying own listing; in dev, allow for testing
    if (process.env.NODE_ENV === 'production' && listing.seller.toString() === buyerId) {
      throw new ApiError(400, 'You cannot buy your own listing.');
    }

    // Prevent duplicate purchase
    const existingOrder = await Order.findOne({
      buyer: buyerId,
      listing: listingId,
      status: { $in: ['pending', 'escrow', 'completed'] },
    });
    if (existingOrder) {
      throw new ApiError(400, 'You have already purchased this item.');
    }

    const feeRate = listing.type === 'digital' ? 0.20 : 0.10;
    const platformFee = Math.round(listing.price * feeRate);

    // Create the order first (pending payment)
    const order = await Order.create({
      buyer: buyerId,
      seller: listing.seller,
      listing: listing._id,
      amount: listing.price,
      platformFee,
      sellerPayout: listing.price - platformFee,
      status: 'pending',
      disputeDeadline: listing.type === 'digital'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : undefined,
    });

    // Create Razorpay order
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    let razorpayOrder = null;

    if (razorpayKeyId && razorpayKeyId !== 'your_razorpay_key_id') {
      try {
        const rpOrder = await createRazorpayOrder(
          listing.price,
          listing.type,
          String(order._id)
        );
        order.paymentIntentId = rpOrder.razorpayOrderId; // reuse field for razorpay order id
        await order.save();
        razorpayOrder = {
          id: rpOrder.razorpayOrderId,
          amount: rpOrder.amount,
          currency: 'INR',
          keyId: razorpayKeyId,
        };
      } catch (err) {
        console.error('Razorpay order creation failed:', err);
        // Fall back to dev mode if Razorpay fails
      }
    }

    // If no Razorpay, go straight to escrow (dev mode)
    if (!razorpayOrder) {
      order.status = 'escrow';
      await order.save();
    }

    // Notify seller
    await Notification.create({
      user: listing.seller,
      type: 'order',
      title: 'New Order',
      body: `Someone wants to buy "${listing.title}".`,
      relatedId: String(order._id),
    });

    res.status(201).json({
      success: true,
      message: razorpayOrder ? 'Order created. Complete payment.' : 'Order created (dev mode - payment skipped).',
      data: { order, razorpayOrder },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, 'Missing payment verification fields.');
    }

    // Verify signature
    const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      throw new ApiError(400, 'Payment verification failed. Invalid signature.');
    }

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found.');

    // Update order with payment details
    order.status = 'escrow';
    order.paymentIntentId = razorpay_payment_id;
    await order.save();

    res.json({ success: true, message: 'Payment verified. Funds in escrow.', data: order });
  } catch (error) {
    next(error);
  }
};

export const confirmDelivery = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerId = req.user?.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('listing');
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.buyer.toString() !== buyerId) throw new ApiError(403, 'Not authorized.');
    if (order.status !== 'escrow') throw new ApiError(400, 'Order is not in escrow.');

    order.status = 'completed';
    order.downloadConfirmed = true;
    await order.save();

    // Mark listing as sold if physical
    const listing = await Listing.findById(order.listing);
    if (listing?.type === 'physical') {
      listing.status = 'sold';
      await listing.save();
    }

    // Notify seller
    await Notification.create({
      user: order.seller,
      type: 'order',
      title: 'Delivery Confirmed',
      body: 'The buyer confirmed receipt. Payment released to your account.',
      relatedId: String(order._id),
    });

    res.json({ success: true, message: 'Delivery confirmed. Payment released.', data: order });
  } catch (error) {
    next(error);
  }
};

export const disputeOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerId = req.user?.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.buyer.toString() !== buyerId) throw new ApiError(403, 'Not authorized.');
    if (order.status !== 'escrow') throw new ApiError(400, 'Order cannot be disputed in current state.');

    if (order.disputeDeadline && new Date() > order.disputeDeadline) {
      throw new ApiError(400, 'Dispute window has expired.');
    }

    order.status = 'disputed';
    order.disputeReason = reason || 'Quality issue';
    await order.save();

    // Notify seller
    await Notification.create({
      user: order.seller,
      type: 'dispute',
      title: 'Order Disputed',
      body: `Buyer raised a dispute: "${order.disputeReason}".`,
      relatedId: String(order._id),
    });

    res.json({ success: true, message: 'Dispute raised successfully.', data: order });
  } catch (error) {
    next(error);
  }
};

export const refundOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.status !== 'disputed') throw new ApiError(400, 'Only disputed orders can be refunded.');

    if (order.paymentIntentId) {
      await refundPayment(order.paymentIntentId);
    }

    order.status = 'refunded';
    await order.save();

    await Notification.create({
      user: order.buyer,
      type: 'order',
      title: 'Refund Processed',
      body: 'Your dispute was resolved. Refund has been initiated.',
      relatedId: String(order._id),
    });

    res.json({ success: true, message: 'Order refunded.', data: order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { role } = req.query;

    const filter: any = {};
    if (role === 'seller') {
      filter.seller = userId;
    } else {
      filter.buyer = userId;
    }

    const orders = await Order.find(filter)
      .populate('listing', 'title type category price images')
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .sort('-createdAt');

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderDownload = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const buyerId = req.user?.id;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, 'Order not found.');
    if (order.buyer.toString() !== buyerId) throw new ApiError(403, 'Not authorized.');
    if (!['escrow', 'completed'].includes(order.status)) {
      throw new ApiError(400, 'Payment not completed yet.');
    }

    const listing = await Listing.findById(order.listing);
    if (!listing?.fileUrl) throw new ApiError(404, 'No downloadable file for this listing.');

    const downloadUrl = await getSignedDownloadUrl(listing.fileUrl, 300);

    res.json({ success: true, data: { downloadUrl } });
  } catch (error) {
    next(error);
  }
};
