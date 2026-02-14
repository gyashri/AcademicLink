import { Router } from 'express';
import { checkOnboardingStatus, getSellerBalance } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/onboarding-status', authenticate, checkOnboardingStatus);
router.get('/balance', authenticate, getSellerBalance);

export default router;
