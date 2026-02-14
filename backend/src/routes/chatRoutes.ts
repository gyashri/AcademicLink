import { Router } from 'express';
import { getOrCreateChat, getMyChats, getChatMessages, sendMessage } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, getOrCreateChat);
router.get('/', authenticate, getMyChats);
router.get('/:chatId', authenticate, getChatMessages);
router.post('/:chatId/message', authenticate, sendMessage);

export default router;
