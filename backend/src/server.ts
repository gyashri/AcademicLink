import dotenv from 'dotenv';
dotenv.config();

// Fix DNS resolution for MongoDB Atlas on some networks
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import aiRoutes from './routes/aiRoutes';
import chatRoutes from './routes/chatRoutes';
import reviewRoutes from './routes/reviewRoutes';
import universityRoutes from './routes/universityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve local uploads in development
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Socket.io - Real-time chat
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their userId
  socket.on('user:online', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    io.emit('user:status', { userId, online: true });
  });

  // Join a chat room
  socket.on('chat:join', (chatId: string) => {
    socket.join(`chat:${chatId}`);
  });

  // Leave a chat room
  socket.on('chat:leave', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  // Send message via socket (real-time)
  socket.on('chat:message', (data: { chatId: string; message: any }) => {
    socket.to(`chat:${data.chatId}`).emit('chat:message', data.message);
  });

  // Typing indicator
  socket.on('chat:typing', (data: { chatId: string; userId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('chat:typing', { userId: data.userId });
  });

  // Notification push
  socket.on('notification:send', (data: { userId: string; notification: any }) => {
    const targetSocket = onlineUsers.get(data.userId);
    if (targetSocket) {
      io.to(targetSocket).emit('notification:new', data.notification);
    }
  });

  socket.on('disconnect', () => {
    // Remove user from online list
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user:status', { userId, online: false });
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`AcademicLink API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch(console.error);

export { app, io };
