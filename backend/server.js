import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

import connectDB from './config/db.js';
import { errorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import managementRoutes from './routes/managementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Models (for socket handlers)
import Chat from './models/Chat.js';
import User from './models/User.js';

// ── App & Server Setup ──
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
});

app.set('io', io);

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use('/api', apiLimiter);

// ── Database ──
connectDB();

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/manage', managementRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Socket.io Real-Time ──
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', async (data) => {
    try {
      let validSenderId = data.senderId;
      if (validSenderId === 'admin') {
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) validSenderId = adminUser._id;
      }

      const chatMsg = await Chat.create({
        roomId: data.roomId,
        senderId: validSenderId,
        message: data.message
      });

      await chatMsg.populate('senderId', 'name');
      io.to(data.roomId).emit('receive_message', chatMsg);
    } catch (err) {
      console.error('Socket send_message error:', err.message);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', { userId: data.userId, name: data.name });
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.roomId).emit('user_stop_typing', { userId: data.userId });
  });

  socket.on('subscribe_notifications', (userId) => {
    socket.join(`notifications_${userId}`);
  });

  socket.on('disconnect', () => {});
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start Server ──
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
