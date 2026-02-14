import { Request, Response, NextFunction } from 'express';
import { Listing } from '../models/Listing';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { uploadToS3, getSignedDownloadUrl, deleteFromS3 } from '../services/s3Service';
import { checkAcademicIntegrity, generateStudyKit } from '../services/aiService';
import pdfParse from 'pdf-parse';

export const createListing = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { title, description, type, category, price, department, courseCode, professor, condition, tags } = req.body;

    if (!title || !description || !type || !category || !price || !department || !courseCode) {
      throw new ApiError(400, 'Missing required fields: title, description, type, category, price, department, courseCode.');
    }

    // Get user's university
    const { User } = await import('../models/User');
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found.');
    if (!user.verified) throw new ApiError(403, 'Please verify your email first.');

    const listingData: any = {
      seller: userId,
      title,
      description,
      type,
      category,
      price: Number(price),
      department,
      courseCode: courseCode.toUpperCase(),
      professor,
      condition: type === 'physical' ? condition : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
      university: user.university,
      images: [],
      previewPages: [],
    };

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (files?.images) {
      const imageKeys = await Promise.all(
        files.images.map((img) => uploadToS3(img.buffer, img.originalname, img.mimetype, 'images'))
      );
      listingData.images = imageKeys;
    }

    if (files?.file && files.file[0]) {
      const pdfFile = files.file[0];
      const fileKey = await uploadToS3(pdfFile.buffer, pdfFile.originalname, pdfFile.mimetype, 'documents');
      listingData.fileUrl = fileKey;

      // Parse PDF for AI processing
      try {
        const pdfData = await pdfParse(pdfFile.buffer);
        const pdfText = pdfData.text;

        // Academic integrity check
        const integrityCheck = checkAcademicIntegrity(pdfText);
        if (integrityCheck.flagged) {
          listingData.status = 'flagged';
          listingData.aiMetadata = {
            integrityFlag: true,
            integrityReason: integrityCheck.reason,
          };
        } else {
          // Generate study kit (summary, MCQs, tags)
          const studyKit = await generateStudyKit(pdfText);
          listingData.aiMetadata = {
            ...studyKit,
            integrityFlag: false,
          };

          // Merge AI-suggested tags
          if (studyKit.tags) {
            listingData.tags = [...new Set([...listingData.tags, ...studyKit.tags])];
          }
        }
      } catch (parseError) {
        console.error('PDF processing error:', parseError);
        // Continue without AI metadata if PDF parsing fails
      }
    }

    const listing = await Listing.create(listingData);

    res.status(201).json({
      success: true,
      message: listing.status === 'flagged'
        ? 'Listing created but flagged for review due to potential academic integrity concerns.'
        : 'Listing created successfully.',
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

export const getListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      university, department, courseCode, professor, type, category,
      minPrice, maxPrice, status, page = '1', limit = '20', sort = '-createdAt',
    } = req.query;

    const filter: any = { status: status || 'active' };
    if (university) filter.university = university;
    if (department) filter.department = department;
    if (courseCode) filter.courseCode = (courseCode as string).toUpperCase();
    if (professor) filter.professor = { $regex: professor, $options: 'i' };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('seller', 'name avatar')
        .populate('university', 'name')
        .sort(sort as string)
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchListings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, page = '1', limit = '20' } = req.query;

    if (!q) {
      throw new ApiError(400, 'Search query "q" is required.');
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [listings, total] = await Promise.all([
      Listing.find(
        { $text: { $search: q as string }, status: 'active' },
        { score: { $meta: 'textScore' } }
      )
        .populate('seller', 'name avatar')
        .populate('university', 'name')
        .sort({ score: { $meta: 'textScore' } })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Listing.countDocuments({ $text: { $search: q as string }, status: 'active' }),
    ]);

    res.json({
      success: true,
      data: { listings, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } },
    });
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name avatar email')
      .populate('university', 'name domain departments');

    if (!listing) throw new ApiError(404, 'Listing not found.');

    // Increment view count
    listing.viewCount += 1;
    await listing.save();

    // Generate signed URLs for images
    const imageUrls = await Promise.all(listing.images.map((key) => getSignedDownloadUrl(key)));

    res.json({
      success: true,
      data: { ...listing.toObject(), imageUrls },
    });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ApiError(404, 'Listing not found.');
    if (listing.seller.toString() !== req.user?.id) throw new ApiError(403, 'Not authorized.');

    const allowedUpdates = ['title', 'description', 'price', 'tags', 'professor', 'condition', 'status'];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ApiError(404, 'Listing not found.');
    if (listing.seller.toString() !== req.user?.id) throw new ApiError(403, 'Not authorized.');

    // Delete S3 files
    const deletePromises: Promise<void>[] = [];
    listing.images.forEach((key) => deletePromises.push(deleteFromS3(key)));
    if (listing.fileUrl) deletePromises.push(deleteFromS3(listing.fileUrl));
    await Promise.all(deletePromises);

    await Listing.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Listing deleted.' });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const listings = await Listing.find({ seller: req.user?.id })
      .populate('university', 'name')
      .sort('-createdAt');

    res.json({ success: true, data: listings });
  } catch (error) {
    next(error);
  }
};
