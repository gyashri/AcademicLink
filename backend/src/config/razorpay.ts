import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const PLATFORM_FEE_PHYSICAL = 0.10; // 10%
export const PLATFORM_FEE_DIGITAL = 0.20;  // 20%
