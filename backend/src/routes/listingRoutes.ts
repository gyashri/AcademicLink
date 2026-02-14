import { Router } from 'express';
import { createListing, getListings, searchListings, getListing, updateListing, deleteListing, getMyListings } from '../controllers/listingController';
import { authenticate } from '../middleware/auth';
import { uploadAny } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getListings);
router.get('/search', searchListings);

// Protected routes (before /:id to avoid conflicts)
router.get('/user/my-listings', authenticate, getMyListings);
router.post('/', authenticate, uploadAny, createListing);
router.put('/:id', authenticate, updateListing);
router.delete('/:id', authenticate, deleteListing);

// Public - single listing (after named routes)
router.get('/:id', getListing);

export default router;
