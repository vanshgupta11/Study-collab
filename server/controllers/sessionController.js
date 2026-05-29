import { validationResult } from 'express-validator';
import Session from '../models/Session.js';
import Room from '../models/Room.js';

/**
 * @desc    Start a study session
 * @route   POST /api/sessions/start
 * @access  Private
 */
export const startSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { roomId } = req.body;

  try {
    // Verify room exists and user has access (is owner or member)
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const isOwner = room.owner.toString() === req.user.id;
    const isMember = room.members.includes(req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: must be a member of the room to start a session'
      });
    }

    // Check if there's already an active (un-ended) session for this user in this room
    const activeSession = await Session.findOne({
      roomId,
      userId: req.user.id,
      endTime: { $exists: false }
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active study session in this room',
        data: activeSession
      });
    }

    const session = await Session.create({
      roomId,
      userId: req.user.id,
      startTime: new Date()
    });

    return res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Start Session Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while starting session'
    });
  }
};

/**
 * @desc    End a study session
 * @route   POST /api/sessions/end/:id
 * @access  Private
 */
export const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Verify session belongs to the current user
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this session'
      });
    }

    if (session.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session has already been ended',
        data: session
      });
    }

    session.endTime = new Date();
    await session.save(); // Pre-save hook calculates duration automatically

    return res.json({
      success: true,
      message: 'Session ended successfully',
      data: session
    });
  } catch (error) {
    console.error('End Session Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID format'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while ending session'
    });
  }
};

/**
 * @desc    Get all sessions for current user with room details populated
 * @route   GET /api/sessions/my
 * @access  Private
 */
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .populate('roomId', 'name description inviteCode')
      .sort({ startTime: -1 });

    return res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get My Sessions Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving your sessions'
    });
  }
};

/**
 * @desc    Get session statistics for current user
 * @route   GET /api/sessions/stats
 * @access  Private
 */
export const getSessionStats = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).populate('roomId', 'name');

    let totalStudyTime = 0;
    const totalSessions = sessions.length;
    const breakdownMap = {};

    for (const session of sessions) {
      const duration = session.duration || 0;
      totalStudyTime += duration;

      const room = session.roomId;
      if (!room) continue; // Skip if room was deleted

      const roomIdStr = room._id.toString();
      if (!breakdownMap[roomIdStr]) {
        breakdownMap[roomIdStr] = {
          roomId: roomIdStr,
          roomName: room.name,
          studyTime: 0,
          sessionCount: 0
        };
      }

      breakdownMap[roomIdStr].studyTime += duration;
      breakdownMap[roomIdStr].sessionCount += 1;
    }

    const roomBreakdown = Object.values(breakdownMap);

    return res.json({
      success: true,
      data: {
        totalStudyTime,
        totalSessions,
        roomBreakdown
      }
    });
  } catch (error) {
    console.error('Get Session Stats Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating study statistics'
    });
  }
};
