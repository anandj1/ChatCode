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
      console.log(`Room: ${room.name}, ID: ${room._id}, Owner: ${room.owner._id}, IsOwner: ${isOwner}, IsPrivate: ${isPrivate}, CreatedBy: ${room.owner.username}`);
    });
    
    console.log(`Found ${rooms.length} rooms for user ${userId}`);
    
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

// Get a single room - updated for private room access check with improved handling
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const userId = req.user.id.toString();
    console.log(`User ${userId} requesting access to room ${req.params.id}`);
    
    const room = await Room.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('participants.user', 'username avatar')
      .populate('sharedWith.user', 'username avatar');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // If room has a password, indicate that password is required
    if (room.password) {
      return res.status(403).json({ 
        message: 'This room requires a password to join',
        passwordRequired: true
      });
    }
    
    // If room is private, verify user has access
    if (room.isPrivate) {
      const isOwner = room.owner._id.toString() === userId;
      const isParticipant = room.participants.some(p => 
        p.user && p.user._id.toString() === userId
      );
      const isSharedWith = room.sharedWith.some(share => 
        share.user && share.user._id.toString() === userId
      );
      
      if (!isOwner && !isSharedWith && !isParticipant) {
        return res.status(403).json({ message: 'You do not have access to this room' });
      }
    }
    
    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room - updated to handle password verification
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    // Ensure req.user exists and has an id property
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const userId = req.user.id.toString();
    console.log(`User ${userId} attempting to join room ${req.params.id}`);
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if room has a password
    if (room.password) {
      const { password } = req.body;
      
      if (!password) {
        return res.status(401).json({ message: 'Password is required' });
      }
      
      if (password !== room.password) {
        console.log(`Invalid password attempt for room ${req.params.id}`);
        return res.status(401).json({ message: 'Invalid room password' });
      }
      
      console.log(`Password verified for room ${req.params.id}`);
    }
    
    // Add user as participant if not already
    const isParticipant = room.participants.some(p => 
      p.user && p.user.toString() === userId
    );
    
    if (!isParticipant) {
      room.participants.push({
        user: userId,
        joinedAt: new Date()
      });
      
      room.lastActivity = new Date();
      await room.save();
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

// Other routes remain the same...
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    const roomOwnerId = room.owner.toString();
    const userId = req.user.id.toString();
    
    if (roomOwnerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this room' });
    }
    
    await Room.findByIdAndDelete(req.params.id);
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { createdRooms: req.params.id } }
    );
    
    await Message.deleteMany({ room: req.params.id });
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, language, isPrivate, password } = req.body;
    
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
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { createdRooms: room._id } }
    );
    
    await room.populate('owner', 'username avatar');
    await room.populate('participants.user', 'username avatar');
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room: ' + error.message });
  }
});

router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
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
    
    if (room.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Only the room owner can share this room' });
    }
    
    const existingSharedUserIds = room.sharedWith.map(share => share.user.toString());
    const newUserIds = userIds.filter(id => !existingSharedUserIds.includes(id));
    
    for (const userId of newUserIds) {
      room.sharedWith.push({
        user: userId,
        sharedAt: new Date()
      });
    }
    
    await room.save();
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
