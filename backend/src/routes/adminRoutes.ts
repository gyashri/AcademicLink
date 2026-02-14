import { Router } from 'express';
import { getDashboardStats, getFlaggedListings, moderateListing, getDisputedOrders } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All admin routes require authentication
// In production, add admin role middleware
router.get('/stats', authenticate, getDashboardStats);
router.get('/flagged-listings', authenticate, getFlaggedListings);
router.put('/listings/:id/moderate', authenticate, moderateListing);
router.get('/disputed-orders', authenticate, getDisputedOrders);

export default router;
