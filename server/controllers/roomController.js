import { validationResult } from 'express-validator';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';

/**
 * @desc    Create a new study room
 * @route   POST /api/rooms
 * @access  Private
 */
export const createRoom = async (req, res) => {
  // Validate input parameters
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, description } = req.body;

  try {
    const room = await Room.create({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id] // Owner is automatically a member
    });

    return res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Create Room Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating room'
    });
  }
};

/**
 * @desc    Get all active rooms + rooms user is a member of
 * @route   GET /api/rooms
 * @access  Private
 */
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isActive: true },
        { owner: req.user.id },
        { members: req.user.id }
      ]
    })
      .populate('owner', 'name email')
      .populate('members', 'name email');

    return res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Get Rooms Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms'
    });
  }
};

/**
 * @desc    Get single room with populated members and recent 50 messages
 * @route   GET /api/rooms/:id
 * @access  Private
 */
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user has permission to view this room (owner or member)
    const isOwner = room.owner._id.toString() === req.user.id;
    const isMember = room.members.some((m) => m._id.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this room'
      });
    }

    // Retrieve recent 50 messages, sorted descending by time (newest first)
    const messages = await Message.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name email');

    // Reverse messages to display in correct chronological order (oldest first)
    messages.reverse();

    return res.json({
      success: true,
      data: {
        room,
        messages
      }
    });
  } catch (error) {
    console.error('Get Room By ID Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching room details'
    });
  }
};

/**
 * @desc    Join room by inviteCode
 * @route   POST /api/rooms/join
 * @access  Private
 */
export const joinRoom = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { inviteCode } = req.body;

  try {
    const room = await Room.findOne({ inviteCode, isActive: true });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or is inactive'
      });
    }

    // Check if user is already owner or member
    const isOwner = room.owner.toString() === req.user.id;
    const isMember = room.members.includes(req.user.id);

    if (!isOwner && !isMember) {
      room.members.push(req.user.id);
      await room.save();
    }

    // Populate and return updated room
    const updatedRoom = await Room.findById(room._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    return res.json({
      success: true,
      message: 'Successfully joined room',
      data: updatedRoom
    });
  } catch (error) {
    console.error('Join Room Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while joining room'
    });
  }
};

/**
 * @desc    Delete room (Owner only)
 * @route   DELETE /api/rooms/:id
 * @access  Private
 */
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify ownership
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: only the owner can delete this room'
      });
    }

    // Cascading delete for messages and sessions related to this room
    await Message.deleteMany({ roomId: room._id });
    await Session.deleteMany({ roomId: room._id });

    // Delete the room
    await Room.findByIdAndDelete(room._id);

    return res.json({
      success: true,
      message: 'Room and all associated chat logs and sessions deleted successfully'
    });
  } catch (error) {
    console.error('Delete Room Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting room'
    });
  }
};

/**
 * @desc    Get all sessions for a room
 * @route   GET /api/rooms/:id/sessions
 * @access  Private
 */
export const getRoomSessions = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Verify authorization (only owner or members can view sessions)
    const isOwner = room.owner.toString() === req.user.id;
    const isMember = room.members.includes(req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view sessions for this room'
      });
    }

    const sessions = await Session.find({ roomId: room._id })
      .populate('userId', 'name email')
      .sort({ startTime: -1 });

    return res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get Room Sessions Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching room sessions'
    });
  }
};
