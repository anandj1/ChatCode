const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    
      _id: {
        type: String,
        default: () => crypto.randomUUID()
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    avatar: {
      type: String,
      default: ''
    },
    firstName: {
      type: String,
      set: function(v) {
        return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '';
      }
    },
    lastName: {
      type: String,
      set: function(v) {
        return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : '';
      }
    },
    displayName: {
      type: String,
      default: ''
    },
    githubId: {
      type: String,
      default: null
    },
    googleId: {
      type: String,
      default: null
    },
    createdRooms: [{
      type: String,
      ref: 'Room'
    }],
    isCreator: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    resetToken: {
      type: String,
      default: null
    },
    resetTokenExpiry: {
      type: Date,
      default: null
    }
  },
  { 
    timestamps: true,
    _id: false // Disable auto-generation of ObjectId
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get display name
userSchema.methods.getDisplayName = function() {
  if (this.firstName) return this.firstName;
  if (this.displayName) return this.displayName.split(' ')[0];
  return this.username;
};

// Method to check if user is room creator
userSchema.methods.isRoomCreator = function(roomId) {
  return this.createdRooms.some(id => id.toString() === roomId.toString());
};

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ githubId: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);

module.exports = User;