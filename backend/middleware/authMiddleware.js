/**
 * JWT Authentication Middleware
 *
 * Flow:
 * 1. Client sends: Authorization: Bearer <token>
 * 2. We extract token from header
 * 3. jwt.verify() checks signature and expiry
 * 4. If valid, req.user = decoded payload (user id)
 * 5. Next middleware/controller runs
 */
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // "Bearer eyJhbG..." -> get only the token part
      token = req.headers.authorization.split(' ')[1];

      // Verify token and attach user id to request
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };
