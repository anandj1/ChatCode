const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const { authenticateToken } = require('../middleware/auth');

// @route GET /api/users/by-email
// @desc  Get user by email
// @access Private (only authenticated users can find other users)

router.get('/by-email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }
    
    // Normalize the email to lower-case for consistent matching
    const normalizedEmail = email.toString().trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('_id username email avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Get user by email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's rooms
router.get('/me/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find({
      'participants.user': req.user.id
    })
      .populate('owner', 'username avatar')
      .sort({ lastActivity: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile


// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    
    // Check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }
    
    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar) updateData.avatar = avatar;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;