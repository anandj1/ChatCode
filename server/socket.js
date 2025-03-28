const Message = require('./models/Message');
const Room = require('./models/Room');
const User = require('./models/User');

// Map of active users in rooms - key is roomId, value is array of user objects
const activeUsers = new Map();

// Helper to get unique active users (removes duplicates by userId)
const getUniqueActiveUsers = (roomId) => {
  if (!activeUsers.has(roomId)) return [];
  
  // Use a map to deduplicate by userId
  const uniqueUsers = new Map();
  
  for (const user of activeUsers.get(roomId)) {
    // Only keep the most recent socket connection for each user
    uniqueUsers.set(user.id, user);
  }
  
  return Array.from(uniqueUsers.values());
};

// Function to update participant count for a room and broadcast to all users
const updateParticipantCount = (io, roomId) => {
  if (!roomId) return;
  
  const uniqueUsers = getUniqueActiveUsers(roomId);
  const count = uniqueUsers.length;
  
  console.log(`Broadcasting updated participant count for room ${roomId}: ${count}`);
  io.to(roomId).emit('participantCountUpdate', { count });
  io.to(roomId).emit('activeUsers', uniqueUsers);
};

// Debounced function to save code to database - Silent, no notifications
let saveTimeouts = new Map();
const saveCodeToDatabase = (roomId, code, language) => {
  // Clear any existing timeout for this room
  if (saveTimeouts.has(roomId)) {
    clearTimeout(saveTimeouts.get(roomId));
  }
  
  // Create a new timeout to save code after 300ms of inactivity (reduced for lower latency)
  const timeoutId = setTimeout(async () => {
    try {
      console.log(`Saving code to database for room ${roomId}`);
      await Room.findByIdAndUpdate(roomId, {
        code,
        language,
        lastActivity: new Date()
      });
      
      saveTimeouts.delete(roomId);
      
    } catch (error) {
      console.error('Error saving code to database:', error);
    }
  }, 300);
  
  saveTimeouts.set(roomId, timeoutId);
};

// Handle WebSocket connections
const handleSocketConnection = (io, socket) => {
  console.log('New client connected:', socket.id);
  
  // Keep socket alive with ping/pong
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  // Join a room
  socket.on('joinRoom', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) {
        console.error('Invalid joinRoom data. roomId and userId are required');
        socket.emit('error', { message: 'Invalid room or user data' });
        return;
      }

      // Add user to the room
      socket.join(roomId);
      console.log(`User ${userId} (socket ${socket.id}) joined room ${roomId}`);
      
      // Store user info in the activeUsers map
      const user = await User.findById(userId).select('username avatar firstName displayName createdRooms');
      
      if (user) {
        // Find the room in the database
        const room = await Room.findById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        // Check if room requires password and user is not authorized
        if (room.password && room.isPrivate) {
          const isOwner = room.owner.toString() === userId.toString();
          const isSharedWith = room.sharedWith && room.sharedWith.some(share => 
            share.user && (
              (share.user._id && share.user._id.toString() === userId.toString()) ||
              (typeof share.user === 'string' && share.user === userId.toString())
            )
          );
          const isParticipant = room.participants && room.participants.some(p => 
            p.user && (
              (p.user._id && p.user._id.toString() === userId.toString()) ||
              (typeof p.user === 'string' && p.user === userId.toString())
            )
          );
          
          console.log(`Access check - User: ${userId}, IsOwner: ${isOwner}, IsParticipant: ${isParticipant}, IsSharedWith: ${isSharedWith}`);
          
          if (!isOwner && !isSharedWith && !isParticipant) {
            // If user is not authorized, send error and don't add to active users
            socket.emit('error', { message: 'This room requires a password to join' });
            return;
          }
        }
        
        // Check if user already exists as a participant in the room database
        const isExistingParticipant = room.participants.some(
          p => p.user && (
            (p.user._id && p.user._id.toString() === userId.toString()) ||
            (typeof p.user === 'string' && p.user === userId.toString())
          )
        );
        
        // If not an existing participant, add them now
        if (!isExistingParticipant) {
          console.log(`Adding user ${userId} to room ${roomId} participants database`);
          room.participants.push({
            user: userId,
            joinedAt: new Date()
          });
          await room.save();
        }
        
        const isCreator = room && room.owner.toString() === userId.toString();
        
        const userData = {
          id: user._id,
          socketId: socket.id,
          username: user.username,
          avatar: user.avatar,
          displayName: user.displayName || '',
          firstName: user.firstName || '',
          isCreator: isCreator
        };
        
        console.log(`Adding user ${userData.username} to active users in room ${roomId}`);
        
        // If this is the first user for this room, create a new array
        if (!activeUsers.has(roomId)) {
          activeUsers.set(roomId, []);
        } else {
          // Remove any existing entries for this user (in case they reconnected)
          const existingUsers = activeUsers.get(roomId);
          const filteredUsers = existingUsers.filter(u => u.id.toString() !== userId.toString());
          activeUsers.set(roomId, filteredUsers);
        }
        
        // Add user to the active users for this room
        activeUsers.get(roomId).push(userData);
        
        // Get unique active users
        const uniqueActiveUsers = getUniqueActiveUsers(roomId);
        
        // Notify all clients in the room about the new user
        io.to(roomId).emit('userJoined', {
          user: userData,
          users: uniqueActiveUsers
        });
        
        // Update room activity timestamp
        await Room.findByIdAndUpdate(roomId, {
          lastActivity: new Date()
        });
        
        // Update and broadcast participant count
        updateParticipantCount(io, roomId);
        
        // Broadcast to all clients that a new peer is available for connection
        socket.to(roomId).emit('newPeer', {
          peerId: socket.id,
          userId: userId
        });
      }
      
      // Get room data
      const room = await Room.findById(roomId)
        .populate('owner', 'username avatar')
        .populate('participants.user', 'username avatar firstName displayName');
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Send room data to the client
      socket.emit('roomData', room);
      
      // Send the last 50 messages to the client
      const messages = await Message.find({ room: roomId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);
      
      socket.emit('previousMessages', messages.reverse());
      
      // Send active users to the client
      socket.emit('activeUsers', uniqueActiveUsers);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room: ' + error.message });
    }
  });
  
  // Handle code updates 
  socket.on('codeChange', ({ roomId, code, language }) => {
    // Broadcast code changes to all other clients in the room
    socket.to(roomId).emit('codeUpdate', { code, language });
    
    // Periodically save code to database (rate-limited) - silently
    if (roomId && code) {
      saveCodeToDatabase(roomId, code, language);
    }
  });
  
  // Handle cursor position updates
  socket.on('cursorChange', ({ roomId, position, userId, name }) => {
    if (roomId && position && userId) {
      // Broadcast cursor position to all other clients in the room
      socket.to(roomId).emit('cursorUpdate', { position, userId, name });
    }
  });
  
  // Handle new messages
  socket.on('sendMessage', async ({ roomId, userId, content, type = 'text' }) => {
    try {
      if (!roomId || !userId || !content) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      console.log(`User ${userId} sent a message in room ${roomId}: ${content.substring(0, 30)}...`);
      
      // Create and save the message
      const message = new Message({
        room: roomId,
        sender: userId,
        content,
        type
      });
      
      await message.save();
      
      // Populate the sender details
      await message.populate('sender', 'username avatar');
      
      // Broadcast the message to all clients in the room
      io.to(roomId).emit('newMessage', message);
      
      // Update room activity timestamp
      await Room.findByIdAndUpdate(roomId, { lastActivity: new Date() });
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message: ' + error.message });
    }
  });
  
  // Handle room leaving
  socket.on('leaveRoom', async ({ roomId, userId }) => {
    try {
      socket.leave(roomId);
      console.log(`User ${userId} (socket ${socket.id}) left room ${roomId}`);
      
      if (roomId && userId && activeUsers.has(roomId)) {
        // Remove user from active users
        const roomUsers = activeUsers.get(roomId);
        const updatedUsers = roomUsers.filter(user => 
          !(user.id.toString() === userId.toString() && user.socketId === socket.id)
        );
        
        if (updatedUsers.length) {
          activeUsers.set(roomId, updatedUsers);
        } else {
          activeUsers.delete(roomId);
        }
        
        // Get unique active users
        const uniqueActiveUsers = getUniqueActiveUsers(roomId);
        
        // Notify all clients in the room about the user leaving
        io.to(roomId).emit('userLeft', {
          user: { id: userId },
          users: uniqueActiveUsers
        });
        
        // Update and broadcast participant count
        updateParticipantCount(io, roomId);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
  
  // Improved WebRTC signaling for video/audio
  socket.on('offer', (data) => {
    if (data.roomId && data.target) {
      console.log(`Forwarding offer from ${socket.id} to ${data.target} in room ${data.roomId}`);
      // Send directly to specific target rather than broadcasting to room
      io.to(data.target).emit('offer', {
        ...data,
        sender: socket.id
      });
    } else {
      console.error('Invalid offer data:', data);
    }
  });
  
  socket.on('answer', (data) => {
    if (data.roomId && data.target) {
      console.log(`Forwarding answer from ${socket.id} to ${data.target} in room ${data.roomId}`);
      // Send directly to specific target rather than broadcasting to room
      io.to(data.target).emit('answer', {
        ...data,
        sender: socket.id
      });
    } else {
      console.error('Invalid answer data:', data);
    }
  });
  
  socket.on('iceCandidate', (data) => {
    if (data.roomId && data.target) {
      console.log(`Forwarding ICE candidate from ${socket.id} to ${data.target} in room ${data.roomId}`);
      io.to(data.target).emit('iceCandidate', {
        ...data,
        sender: socket.id
      });
    } else {
      console.error('Invalid ICE candidate data:', data);
    }
  });
  
  // Add a retry mechanism for failed connections
  socket.on('retryConnection', ({targetId, roomId}) => {
    if (targetId && roomId) {
      console.log(`Connection retry requested from ${socket.id} to ${targetId} in room ${roomId}`);
      io.to(targetId).emit('connectionRetry', {
        sender: socket.id,
        roomId
      });
    }
  });
  
  // Handle disconnections with improved cleanup
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove disconnected user from all rooms
    for (const [roomId, users] of activeUsers.entries()) {
      const disconnectedUser = users.find(user => user.socketId === socket.id);
      
      if (disconnectedUser) {
        console.log(`User ${disconnectedUser.id} disconnected from room ${roomId}`);
        
        // Remove just this socket instance
        const updatedUsers = users.filter(user => user.socketId !== socket.id);
        
        if (updatedUsers.length) {
          activeUsers.set(roomId, updatedUsers);
          
          // Get unique active users after removing the disconnected socket
          const uniqueActiveUsers = getUniqueActiveUsers(roomId);
          
          // Check if this user completely disconnected (no other sockets)
          const userStillActive = uniqueActiveUsers.some(u => u.id.toString() === disconnectedUser.id.toString());
          
          if (!userStillActive) {
            // Notify all clients in the room that this user disconnected
            io.to(roomId).emit('userLeft', {
              user: { id: disconnectedUser.id },
              users: uniqueActiveUsers
            });
          }
          
          // Update and broadcast participant count
          updateParticipantCount(io, roomId);
        } else {
          activeUsers.delete(roomId);
        }
      }
    }
  });
};

module.exports = { handleSocketConnection };
