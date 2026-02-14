import { razorpay, PLATFORM_FEE_PHYSICAL, PLATFORM_FEE_DIGITAL } from '../config/razorpay';
import crypto from 'crypto';

export const createRazorpayOrder = async (
  amount: number,
  listingType: 'physical' | 'digital',
  orderId: string
): Promise<{ razorpayOrderId: string; amount: number; platformFee: number }> => {
  const feeRate = listingType === 'physical' ? PLATFORM_FEE_PHYSICAL : PLATFORM_FEE_DIGITAL;
  const platformFee = Math.round(amount * feeRate);

  // Amount in paise (INR smallest unit)
  const amountInPaise = Math.round(amount * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: orderId,
    notes: {
      orderId,
      platformFee: String(platformFee),
    },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    platformFee,
  };
};

export const verifyRazorpayPayment = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean => {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body)
    .digest('hex');

  return expectedSignature === razorpaySignature;
};

export const refundPayment = async (paymentId: string, amount?: number): Promise<void> => {
  const refundOptions: any = {};
  if (amount) {
    refundOptions.amount = Math.round(amount * 100); // in paise
  }
  await razorpay.payments.refund(paymentId, refundOptions);
};
