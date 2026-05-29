import express from 'express';
import { body } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  deleteRoom,
  getRoomSessions
} from '../controllers/roomController.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(protect);

// Validation for creating a room
const createRoomValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Room name is required')
    .trim(),
  body('description')
    .optional()
    .trim()
];

// Validation for joining a room
const joinRoomValidationRules = [
  body('inviteCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Invite code must be exactly 6 characters long')
    .trim()
];

// POST /api/rooms - Create a room
router.post('/', createRoomValidationRules, createRoom);

// GET /api/rooms - Get all active rooms + rooms user is a member of
router.get('/', getRooms);

// POST /api/rooms/join - Join a room by invite code
router.post('/join', joinRoomValidationRules, joinRoom);

// GET /api/rooms/:id - Get room by ID (includes populated details and recent 50 messages)
router.get('/:id', getRoomById);

// DELETE /api/rooms/:id - Delete a room (Owner only)
router.delete('/:id', deleteRoom);

// GET /api/rooms/:id/sessions - Get all sessions for a room
router.get('/:id/sessions', getRoomSessions);

export default router;
