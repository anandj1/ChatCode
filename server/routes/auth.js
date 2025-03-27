const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendEmail } = require('../utils/email');
const axios = require('axios');


// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ 
        message: 'An account with this email already exists',
        field: 'email'
      });
    }
    
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ 
        message: 'This username is already taken',
        field: 'username'
      });
    }
    
    // Generate a unique ID for the user
    const userId = crypto.randomUUID();
    
    // Create new user with temporary flag
    const newUser = new User({
      _id: userId,
      username,
      email,
      password,
      displayName: username,
      isVerified: false // Add this flag to mark user as not verified yet
    });
    
    // Save user to database as temporary
    await newUser.save();
    
    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
    
    // Save OTP to database
    const newOTP = new OTP({
      email,
      otp,
      expiresAt: otpExpiry
    });
    
    await newOTP.save();
    
    // Send verification email
    await sendVerificationEmail(email, otp);
    
    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification code.',
      email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate user account
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find the OTP record
    const otpRecord = await OTP.findOne({ 
      email, 
      otp,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user to verified status
    user.isVerified = true;
    await user.save();
    
    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        firstName: user.firstName,
        isCreator: user.isCreator,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to user email
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete any existing OTP
    await OTP.deleteMany({ email });
    
    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
    
    // Save OTP to database
    const newOTP = new OTP({
      email,
      otp,
      expiresAt: otpExpiry
    });
    
    await newOTP.save();
    
    // Send verification email
    await sendVerificationEmail(email, otp);
    
    res.json({ message: 'Verification code has been sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error while resending verification code' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        firstName: user.firstName,
        isCreator: user.isCreator,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        firstName: user.firstName,
        isCreator: user.isCreator,
        createdRooms: user.createdRooms
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   GET /api/auth/github
// @desc    Authenticate with GitHub
// @access  Public
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=user:email`;
  res.redirect(githubAuthUrl);
});

router.get('/github/callback', async (req, res) => {
  try {
    console.log('🔄 GitHub OAuth callback triggered');
    
    const code = req.query.code;
    if (!code) {
      console.error('❌ GitHub OAuth failed: No code received');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI
    }, {
      headers: { Accept: 'application/json' }
    });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('❌ Failed to get access token from GitHub');
    }

    // Get user data from GitHub
    const [userResponse, emailsResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    ]);

    const githubUser = userResponse.data;
    const primaryEmail = emailsResponse.data.find(email => email.primary)?.email || emailsResponse.data[0]?.email;

    if (!primaryEmail) {
      throw new Error('❌ No email found in GitHub account');
    }

    console.log('✅ GitHub user fetched:', githubUser);

    // Find or create user
    let user = await User.findOne({ email: primaryEmail });

    if (!user) {
      console.log('🆕 Creating new user from GitHub login');
      
      // Check if username exists and generate a unique one if needed
      let username = githubUser.login;
      let usernameExists = await User.findOne({ username });
      let counter = 1;
      
      // If username exists, append numbers until we find a unique one
      while (usernameExists) {
        username = `${githubUser.login}${counter}`;
        usernameExists = await User.findOne({ username });
        counter++;
      }
      
      user = new User({
        username: username, // Using the potentially modified username
        email: primaryEmail,
        displayName: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url,
        githubId: githubUser.id,
        password: crypto.randomBytes(32).toString('hex') // Random password for security
      });
      await user.save();
    } else {
      console.log('✅ Existing GitHub user found');
      await User.updateOne(
        { _id: user._id },
        {
          githubId: githubUser.id,
          avatar: user.avatar || githubUser.avatar_url,
          displayName: user.displayName || githubUser.name || githubUser.login
        }
      );
    }

    // Generate JWT
    const token = generateToken(user);
    console.log('✅ GitHub login successful, token generated');

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
  }
});

// @route   GET /api/auth/github/callback
// @desc    Handle GitHub OAuth callback
// @access  Public

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
  res.redirect(googleAuthUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    console.log('🔄 Google OAuth callback triggered');

    const code = req.query.code;
    if (!code) {
      console.error('❌ Google OAuth failed: No code received');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('❌ Failed to get access token from Google');
    }

    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const googleUser = userResponse.data;
    console.log('✅ Google user fetched:', googleUser);

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      console.log('🆕 Creating new user from Google login');
      
      // Generate username from email
      let username = googleUser.email.split('@')[0];
      let usernameExists = await User.findOne({ username });
      let counter = 1;
      
      // If username exists, append numbers until we find a unique one
      while (usernameExists) {
        username = `${googleUser.email.split('@')[0]}${counter}`;
        usernameExists = await User.findOne({ username });
        counter++;
      }
      
      user = new User({
        username: username, // Using the potentially modified username
        email: googleUser.email,
        displayName: googleUser.name,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        avatar: googleUser.picture,
        googleId: googleUser.id,
        password: crypto.randomBytes(32).toString('hex') // Random password for security
      });
      await user.save();
    } else {
      console.log('✅ Existing Google user found');
      await User.updateOne(
        { _id: user._id },
        {
          googleId: googleUser.id,
          avatar: user.avatar || googleUser.picture,
          displayName: user.displayName || googleUser.name,
          firstName: user.firstName || googleUser.given_name,
          lastName: user.lastName || googleUser.family_name
        }
      );
    }

    // Generate JWT
    const token = generateToken(user);
    console.log('✅ Google login successful, token generated');

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, displayName, firstName, lastName, bio, avatar } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if username is taken (if changing username)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      user.username = username;
    }
    
    // Update fields if provided
    if (displayName) user.displayName = displayName;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio) user.bio = bio;
    if (avatar) user.avatar = avatar;
    
    // Save updated user
    await user.save();
    
    // Generate new token with updated info
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        isCreator: user.isCreator
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    
    // Save updated user
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Forgot password request received for email:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      // To prevent user enumeration, we still return success
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    console.log('Generated reset token for user:', {
      userId: user._id,
      email: user.email,
      tokenLength: resetToken.length,
      expiry: resetTokenExpiry
    });
    
    // Save token to user using findOneAndUpdate for atomic operation
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { 
        $set: {
          resetToken: resetToken,
          resetTokenExpiry: resetTokenExpiry
        }
      },
      { new: true }
    );
    
    console.log('Reset token saved to user:', {
      userId: updatedUser._id,
      hasResetToken: !!updatedUser.resetToken,
      tokenExpiry: updatedUser.resetTokenExpiry
    });
    
    // Create reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    // Send email with reset link
    const emailSent = await sendEmail({
      to: email,
      subject: 'Password Reset',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>You requested a password reset for your ChatCode account.</p>
          <p>Click the button below to reset your password. This link will expire in 30 minutes.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #5469d4; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Best regards,<br>The ChatCode Team</p>
        </div>
      `
    });
    
    console.log('Reset password email sent:', {
      to: email,
      success: emailSent
    });
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send password reset email. Please try again.' 
      });
    }
    
    return res.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});


// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    
    console.log('Reset password request received:', { 
      email, 
      tokenLength: token?.length,
      requestBody: req.body 
    });
    
    if (!token || !email || !password) {
      console.log('Missing required fields:', { 
        hasToken: !!token, 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        details: {
          token: !token ? 'Token is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }
    
    // Find user with matching token and valid expiry
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    
    console.log('User lookup result:', {
      email,
      userFound: !!user,
      hasResetToken: !!user?.resetToken,
      tokenMatches: user?.resetToken === token,
      tokenExpiry: user?.resetTokenExpiry,
      isTokenExpired: user?.resetTokenExpiry ? new Date(user.resetTokenExpiry) < new Date() : null
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password and clear reset token fields
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      },
      { new: true }
    );
    
    console.log('Password reset completed:', {
      userId: user._id,
      email: user.email,
      resetTokenCleared: !updatedUser.resetToken,
      passwordUpdated: !!updatedUser.password
    });
    
    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Password Reset Successful',
      text: 'Your password has been reset successfully.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Successful</h2>
          <p>Your password for ChatCode has been reset successfully.</p>
          <p>If you did not request this change, please contact support immediately.</p>
          <p>Best regards,<br>The ChatCode Team</p>
        </div>
      `
    });
    
    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.',
      details: error.message
    });
  }
});

module.exports = router;
