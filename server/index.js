const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const roomRoutes = require('./routes/room');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/email');
const { handleSocketConnection } = require('./socket');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// CORS Configuration with preflight handling
const corsOptions = {
  origin: ['https://chat-code-eta.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes - Note the /api prefix to match frontend configuration
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email', emailRoutes);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: ['https://chat-code-eta.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  handleSocketConnection(io, socket);
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
