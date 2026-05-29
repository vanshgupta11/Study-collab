import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

/**
 * Handles and initializes Socket.io connection authentication and events
 * @param {import('socket.io').Server} io - The Socket.io server instance
 */
export const initSocket = (io) => {
  // Authentication Middleware for all Socket connections
  io.use(async (socket, next) => {
    // Get token from auth handshake or authorization headers
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token) {
      return next(new Error('Authentication error: Token is required'));
    }

    try {
      // Clean "Bearer " prefix if present
      const jwtToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

      // Verify the JWT token
      const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);

      // Find user in DB to attach details to socket
      const user = await User.findById(decoded.id).select('name email');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user details to socket instance
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failure:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Authenticated socket connected: ${socket.id} (User: ${socket.user.name})`);

    // 1. "join-room" event
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} (${socket.user.name}) joined room: ${roomId}`);
      // Notify other room members
      socket.to(roomId).emit('user-joined', {
        userId: socket.user._id,
        name: socket.user.name,
        email: socket.user.email
      });
    });

    // 2. "leave-room" event
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} (${socket.user.name}) left room: ${roomId}`);
      // Notify other room members
      socket.to(roomId).emit('user-left', {
        userId: socket.user._id,
        name: socket.user.name
      });
    });

    // 3. "send-message" event
    socket.on('send-message', async (data) => {
      const { roomId, text } = data;

      if (!roomId || !text) {
        return socket.emit('error', { message: 'Room ID and message text are required' });
      }

      try {
        // Save the Message to MongoDB
        const message = await Message.create({
          roomId,
          sender: socket.user._id,
          text
        });

        // Construct response with populated sender details (avoiding separate DB query)
        const populatedMessage = {
          _id: message._id,
          roomId: message.roomId,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          },
          text: message.text,
          createdAt: message.createdAt
        };

        // Broadcast to the entire room (including sender)
        io.to(roomId).emit('receive-message', populatedMessage);
      } catch (error) {
        console.error('Socket Message DB Save Error:', error.message);
        socket.emit('error', { message: 'Server error while sending message' });
      }
    });

    // 4. "session-started" event
    socket.on('session-started', (data) => {
      const { roomId } = data;
      if (!roomId) return;

      io.to(roomId).emit('room-activity', {
        type: 'session_start',
        user: {
          id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email
        },
        timestamp: new Date()
      });
    });

    // 5. "session-ended" event
    socket.on('session-ended', (data) => {
      const { roomId, duration } = data;
      if (!roomId) return;

      io.to(roomId).emit('room-activity', {
        type: 'session_end',
        user: {
          id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email
        },
        duration: duration || 0,
        timestamp: new Date()
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (User: ${socket.user.name}, Reason: ${reason})`);
    });
  });
};

export default initSocket;
