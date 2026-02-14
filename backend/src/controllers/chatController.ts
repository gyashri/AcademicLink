import { Response, NextFunction } from 'express';
import { Chat } from '../models/Chat';
import { Listing } from '../models/Listing';
import { AuthRequest } from '../types';
import { ApiError } from '../utils/apiError';

export const getOrCreateChat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { listingId, sellerId } = req.body;

    if (!listingId || !sellerId) throw new ApiError(400, 'Listing ID and seller ID are required.');
    if (userId === sellerId) throw new ApiError(400, 'Cannot chat with yourself.');

    const listing = await Listing.findById(listingId);
    if (!listing) throw new ApiError(404, 'Listing not found.');

    // Check for existing chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, sellerId] },
      listing: listingId,
    }).populate('participants', 'name avatar');

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, sellerId],
        listing: listingId,
        messages: [],
      });
      chat = await chat.populate('participants', 'name avatar');
    }

    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

export const getMyChats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name avatar')
      .populate('listing', 'title images price')
      .sort('-lastMessageAt')
      .select('-messages'); // Don't send all messages in list view

    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'name avatar')
      .populate('listing', 'title images price');

    if (!chat) throw new ApiError(404, 'Chat not found.');
    if (!chat.participants.some((p: any) => p._id.toString() === userId)) {
      throw new ApiError(403, 'Not authorized.');
    }

    // Mark unread messages as read
    chat.messages.forEach((msg) => {
      if (msg.sender.toString() !== userId && !msg.read) {
        msg.read = true;
      }
    });
    await chat.save();

    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) throw new ApiError(400, 'Message text is required.');

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, 'Chat not found.');
    if (!chat.participants.some((p) => p.toString() === userId)) {
      throw new ApiError(403, 'Not authorized.');
    }

    chat.messages.push({ sender: userId as any, text: text.trim(), read: false, createdAt: new Date() });
    chat.lastMessage = text.trim();
    chat.lastMessageAt = new Date();
    await chat.save();

    const message = chat.messages[chat.messages.length - 1];
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};
