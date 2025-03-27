const jwt = require('jsonwebtoken');

// Cache to store authenticated requests
const authCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const authenticateToken = (req, res, next) => {
  try {
    // Create a cache key from the token and request path
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const cacheKey = `${token}-${req.method}-${req.path}`;
    
    // Check cache first
    const cachedAuth = authCache.get(cacheKey);
    if (cachedAuth) {
      console.log('✅ Using cached authentication for:', cachedAuth);
      req.user = cachedAuth;
      return next();
    }

    if (!token) {
      console.log('❌ Authentication failed: No token provided');
      return res.status(401).json({ 
        status: 'error',
        message: 'Authentication required. Please log in.',
        code: 'AUTH_NO_TOKEN'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('❌ Token verification failed:', err.message);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            status: 'error',
            message: 'Your session has expired. Please log in again.',
            code: 'AUTH_TOKEN_EXPIRED'
          });
        }
        
        return res.status(401).json({
          status: 'error',
          message: 'Invalid authentication token.',
          code: 'AUTH_INVALID_TOKEN'
        });
      }

      // Add user data to request and ensure ID is a string
      const userData = {
        id: decoded.id.toString(), // Ensure ID is string
        email: decoded.email,
        username: decoded.username,
        displayName: decoded.displayName,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        isCreator: decoded.isCreator,
        createdRooms: decoded.createdRooms,
        avatar: decoded.avatar,
        path: `${req.method}-${req.path}`
      };

      req.user = userData;

      // Cache the authentication result
      authCache.set(cacheKey, userData);
      
      // Set timeout to remove from cache
      setTimeout(() => {
        authCache.delete(cacheKey);
      }, CACHE_TTL);

      console.log('✅ Authentication successful:', {
        userId: decoded.id,
        username: decoded.username
      });

      next();
    });
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
}; 

const generateToken = (user) => {
  if (!user || !user._id) {
    console.error('❌ Invalid user object provided to generateToken');
    throw new Error('Invalid user data for token generation');
  }

  // Get the best available display name
  const firstName = user.firstName || 
                   (user.displayName ? user.displayName.split(' ')[0] : '') ||
                   (user.username ? user.username.split(' ')[0] : '');

  const lastName = user.lastName || 
                 (user.displayName && user.displayName.includes(' ') ? 
                    user.displayName.split(' ').slice(1).join(' ') : '');

  const tokenPayload = {
    id: user._id.toString(), // Ensure ID is string
    email: user.email,
    username: user.username,
    displayName: user.displayName || firstName,
    firstName: firstName,
    lastName: lastName,
    isCreator: Boolean(user.isCreator),
    createdRooms: user.createdRooms || [],
    avatar: user.avatar || null,
    githubId: user.githubId || null,
    googleId: user.googleId || null
  };

  return jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { authenticateToken, generateToken };