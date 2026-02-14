import { Router } from 'express';
import { getUniversities, getUniversity, createUniversity } from '../controllers/universityController';

const router = Router();

router.get('/', getUniversities);
router.get('/:id', getUniversity);
router.post('/', createUniversity); // In production, restrict to admin

export default router;
