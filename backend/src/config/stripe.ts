import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const PLATFORM_FEE_PHYSICAL = 0.10; // 10%
export const PLATFORM_FEE_DIGITAL = 0.20;  // 20%
