import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Imports
import connectDB from './config/db.js';
import socketHandler from './socket/socketHandler.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

// Connect to Database
connectDB();

// Initialize Express App
const app = express();

// Resolve client origin dynamically for production deployments
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

// Apply Global Middleware
app.use(cors({
  origin: clientOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);

// Base Endpoint for Health Check
app.get('/', (req, res) => {
  res.json({ message: 'Collaborative Classroom API is running...' });
});

// Create HTTP Server
const server = http.createServer(app);

// Integrate Socket.io with Express HTTP Server
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Pass Socket.io instance to Handler
socketHandler(io);

// Start Listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
