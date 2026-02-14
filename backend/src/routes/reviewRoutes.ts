import { Router } from 'express';
import { createReview, getSellerReviews } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createReview);
router.get('/seller/:sellerId', getSellerReviews);

export default router;
