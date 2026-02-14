import { Router } from 'express';
import { createOrder, verifyPayment, confirmDelivery, disputeOrder, refundOrder, getMyOrders, getOrderDownload } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.post('/verify-payment', authenticate, verifyPayment);
router.post('/:orderId/confirm-delivery', authenticate, confirmDelivery);
router.post('/:orderId/dispute', authenticate, disputeOrder);
router.post('/:orderId/refund', authenticate, refundOrder);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/:orderId/download', authenticate, getOrderDownload);

export default router;
