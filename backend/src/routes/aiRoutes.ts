import { Router } from 'express';
import { ocrExtract, chatWithListingNotes, getStudyKit } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { uploadImages } from '../middleware/upload';
import multer from 'multer';

const router = Router();

const singleImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single('image');

router.post('/ocr-extract', authenticate, singleImage, ocrExtract);
router.post('/chat/:listingId', authenticate, chatWithListingNotes);
router.get('/study-kit/:listingId', authenticate, getStudyKit);

export default router;
