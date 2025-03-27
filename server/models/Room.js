
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    owner: {
      type: String,
      ref: 'User',
      required: true
    },
    code: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: 'javascript',
      enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'php', 'ruby']
    },
    participants: [
      {
        user: {
          type: String,
          ref: 'User'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isPrivate: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      default: null
    },
    // New field for sharing private rooms with specific users
    sharedWith: [
      {
        user: {
          type: String,
          ref: 'User'
        },
        sharedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
