import jwt from 'jsonwebtoken';
import { findOne } from '../services/storage.js';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. Please login.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'kaamsetu_super_secure_jwt_secret_key_2026_hackathon';
    const decoded = jwt.verify(token, secret);

    // Check user in storage/Mongoose
    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch {
      // Fallback
    }

    if (!user) {
      user = findOne('users', u => u._id === decoded.id || u.id === decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to token no longer exists.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by administration.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication token invalid or expired.' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is unauthorized to perform this action.`
      });
    }
    next();
  };
};
