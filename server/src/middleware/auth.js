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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(503).json({ success: false, message: 'Authentication is not configured on this server.' });
    }
    const decoded = jwt.verify(token, secret);

    // Shared hackathon demo sessions are strictly read-only. This protects
    // seeded worker/employer data from being changed by public demo visitors.
    if (decoded.demo === true && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({
        success: false,
        code: 'DEMO_READ_ONLY',
        message: 'Demo accounts are read-only. Register an account to make changes.'
      });
    }

    let user = null;
    try {
      user = await User.findById(decoded.id).select('-password');
    } catch {
      // Fallback to the application's storage layer.
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
  } catch {
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
