import { Response, NextFunction } from 'express';
import { Listing } from '../models/Listing';
import { Order } from '../models/Order';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import { extractBookInfo, chatWithNotes } from '../services/aiService';
import { getSignedDownloadUrl } from '../services/storageService';

export const ocrExtract = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    if (!file) throw new ApiError(400, 'Image file is required.');

    // Use Gemini Vision for OCR
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const base64Image = file.buffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.mimetype,
          data: base64Image,
        },
      },
      'Extract book/document information from this image. Return ONLY valid JSON with: extractedTitle, isbn (if visible, else null), edition (if visible, else null), tags (array of subject/topic tags). If it\'s handwritten notes, identify the subject and suggest relevant tags. No markdown, just JSON.',
    ]);

    const content = result.response.text();
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const metadata = cleaned ? JSON.parse(cleaned) : {};

    res.json({ success: true, data: metadata });
  } catch (error) {
    next(error);
  }
};

export const chatWithListingNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { listingId } = req.params;
    const { question, chatHistory = [] } = req.body;

    if (!question) throw new ApiError(400, 'Question is required.');

    // Check that user has purchased this listing
    const order = await Order.findOne({
      buyer: userId,
      listing: listingId,
      status: { $in: ['escrow', 'completed'] },
    });

    if (!order) {
      throw new ApiError(403, 'You must purchase this listing to chat with the notes.');
    }

    const listing = await Listing.findById(listingId);
    if (!listing?.fileUrl) throw new ApiError(404, 'No notes file found for this listing.');

    // For RAG, we use the stored summary + AI metadata as context
    // In production, you'd chunk the PDF and use vector search
    let notesContext = '';
    if (listing.aiMetadata?.summary) {
      notesContext = `Summary: ${listing.aiMetadata.summary}\n`;
    }
    if (listing.description) {
      notesContext += `Description: ${listing.description}\n`;
    }
    if (listing.aiMetadata?.tags) {
      notesContext += `Topics: ${listing.aiMetadata.tags.join(', ')}\n`;
    }

    // In a full implementation, fetch and parse the PDF from S3
    // For MVP, use the AI metadata as context
    const answer = await chatWithNotes(notesContext, question, chatHistory);

    res.json({ success: true, data: { answer } });
  } catch (error) {
    next(error);
  }
};

export const getStudyKit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, 'Listing not found.');

    if (!listing.aiMetadata?.summary && !listing.aiMetadata?.mcqs) {
      throw new ApiError(404, 'No study kit available for this listing.');
    }

    // Preview data is available to all; full data requires purchase
    const userId = req.user?.id;
    const hasPurchased = await Order.findOne({
      buyer: userId,
      listing: listingId,
      status: { $in: ['escrow', 'completed'] },
    });

    const data: any = {
      summary: listing.aiMetadata?.summary,
      tags: listing.aiMetadata?.tags,
    };

    if (hasPurchased) {
      data.mcqs = listing.aiMetadata?.mcqs;
    } else {
      // Show only 2 MCQs as preview
      data.mcqs = listing.aiMetadata?.mcqs?.slice(0, 2);
      data.previewOnly = true;
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
