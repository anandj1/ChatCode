const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

// Get rooms - fixed to properly include private rooms the user has access to
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const userId = req.user.id;
    console.log(`Fetching rooms for user: ${userId}`);
    
    // Get rooms that are either:
    // 1. Public rooms
    // 2. Private rooms owned by the user
    // 3. Private rooms shared with the user
    // 4. Rooms where user is a participant
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { owner: userId },
        { 'sharedWith.user': userId },
        { 'participants.user': userId }
      ]
    })
    .populate('owner', 'username avatar')
    .populate('participants.user', 'username avatar')
    .sort({ lastActivity: -1 });
    
    // Enhanced logging for debugging room visibility
    rooms.forEach(room => {
      const isOwner = room.owner._id.toString() === userId.toString();
      const isPrivate = room.isPrivate;
    });
    
    
    // Additional check to ensure private rooms owned by the user are included
    const privateOwnedRooms = await Room.find({
      owner: userId,
      isPrivate: true
    }).populate('owner', 'username avatar')
      .populate('participants.user', 'username avatar');
    
    // Combine and deduplicate rooms
    const allRooms = [...rooms];
    privateOwnedRooms.forEach(privateRoom => {
      if (!allRooms.some(room => room._id.toString() === privateRoom._id.toString())) {
        allRooms.push(privateRoom);
      }
    });
    
    // Sort by last activity
    allRooms.sort((a, b) => {
      return new Date(b.lastActivity || b.createdAt).getTime() - 
             new Date(a.lastActivity || a.createdAt).getTime();
    });
    
    res.json(allRooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a room - only by creator
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // First find the room to verify ownership
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    // Convert IDs to strings for comparison
    const roomOwnerId = room.owner.toString();
    const userId = req.user.id.toString();
    
    // Check if the user is the creator of the room
    if (roomOwnerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }
    
    // Delete the specific room
    await Room.findByIdAndDelete(req.params.id);
    
    // Remove room from user's createdRooms array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { createdRooms: req.params.id } }
    );
    
    // Delete all messages associated with the room
    await Message.deleteMany({ room: req.params.id });
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public rooms (for unauthenticated users)
router.get('/public', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('participants.user', 'username avatar')
      .populate('owner', 'username')
      .sort({ lastActivity: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new room
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, language, isPrivate, password } = req.body;
    
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    console.log("Creating room with user ID:", req.user.id);
    
    const room = new Room({
      name,
      owner: req.user.id,
      language: language || 'javascript',
      isPrivate: isPrivate || false,
      password: password || null,
      participants: [{ user: req.user.id }],
      lastActivity: new Date()
    });
    
    await room.save();
    
    // Update user's createdRooms array
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { createdRooms: room._id } }
    );
    
    // Populate the room data before sending response
    await room.populate('owner', 'username avatar');
    await room.populate('participants.user', 'username avatar');
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room: ' + error.message });
  }
});

// Get a single room - updated for private room access check with improved handling
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const userId = req.user.id.toString();
    
    
    const room = await Room.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('participants.user', 'username avatar')
      .populate('sharedWith.user', 'username avatar');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // If room is private, verify user has access
    if (room.isPrivate) {
      const isOwner = room.owner._id.toString() === userId;
      
      // Check if user is already a participant in this room
      const isParticipant = room.participants.some(p => 
        p.user && (
          (p.user._id && p.user._id.toString() === userId) || 
          (typeof p.user === 'string' && p.user === userId)
        )
      );
      
      const isSharedWith = room.sharedWith.some(share => 
        share.user && (
          (share.user._id && share.user._id.toString() === userId) || 
          (typeof share.user === 'string' && share.user === userId)
        )
      );
      
      
      if (!isOwner && !isSharedWith && !isParticipant) {
        // Check if room has a password
        if (room.password) {
          return res.status(403).json({ 
            message: 'This room requires a password to join',
            passwordRequired: true
          });
        }
        
        return res.status(403).json({ message: 'You do not have access to this room' });
      }
    }
    
    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room - completely rewritten to properly maintain user as participant
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const userId = req.user.id.toString();
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if room is private and password protected
    if ((room.isPrivate || room.password) && room.password) {
      const isOwner = room.owner.toString() === userId;
      const isSharedWith = room.sharedWith.some(share => 
        share.user && (
          (share.user._id && share.user._id.toString() === userId) || 
          (typeof share.user === 'string' && share.user === userId)
        )
      );
      
      // If not owner or shared with, check password
      if (!isOwner && !isSharedWith) {
        const { password } = req.body;
        
        if (!password) {
          return res.status(401).json({ message: 'Password is required' });
        }
        
        if (password !== room.password) {
          return res.status(401).json({ message: 'Invalid room password' });
        }
        
      }
    }
    
    // Check if user is already in the room
    const isParticipant = room.participants.some(
      p => p.user && (
        (p.user._id && p.user._id.toString() === userId) ||
        (typeof p.user === 'string' && p.user === userId)
      )
    );
    
    if (!isParticipant) {
      // Add user to participants
      console.log(`Adding user ${userId} to room ${req.params.id} participants`);
      room.participants.push({
        user: userId,
        joinedAt: new Date()
      });
      
      room.lastActivity = new Date();
      await room.save();
    } else {
      console.log(`User ${userId} is already a participant in room ${req.params.id}`);
    }
    
    // Return the updated room data
    const populatedRoom = await Room.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('participants.user', 'username avatar');
      
    res.json({ 
      message: 'Joined room successfully', 
      room: populatedRoom
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a private room with other users
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Please provide valid user IDs to share with' });
    }
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Verify the requesting user is the owner
    if (room.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the room owner can share this room' });
    }
    
    // Get existing shared user IDs to avoid duplicates
    const existingSharedUserIds = room.sharedWith.map(share => share.user.toString());
    
    // Filter out users that are already shared with
    const newUserIds = userIds.filter(id => !existingSharedUserIds.includes(id));
    
    // Add new users to sharedWith array
    for (const userId of newUserIds) {
      room.sharedWith.push({
        user: userId,
        sharedAt: new Date()
      });
    }
    
    await room.save();
    
    // Populate user data for response
    await room.populate('sharedWith.user', 'username avatar');
    
    res.json({ 
      message: `Room shared with ${newUserIds.length} new users`,
      sharedWith: room.sharedWith
    });
  } catch (error) {
    console.error('Share room error:', error);
    res.status(500).json({ message: 'Failed to share room: ' + error.message });
  }
});

// Get room messages
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room participants (real-time)
router.get('/:id/participants', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('participants.user', 'username avatar firstName displayName');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room.participants);
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
