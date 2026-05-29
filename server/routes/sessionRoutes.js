import express from 'express';
import { body } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import {
  startSession,
  endSession,
  getMySessions,
  getSessionStats
} from '../controllers/sessionController.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(protect);

// GET /api/sessions/my - Get all sessions for current user (populated room details)
router.get('/my', getMySessions);

// GET /api/sessions/stats - Get aggregated study session statistics
router.get('/stats', getSessionStats);

// POST /api/sessions/start - Start a study session (requires valid roomId)
router.post(
  '/start',
  [
    body('roomId')
      .isMongoId()
      .withMessage('A valid Room ID is required')
  ],
  startSession
);

// POST /api/sessions/end/:id - End a study session by session ID
router.post('/end/:id', endSession);

export default router;
