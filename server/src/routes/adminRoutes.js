import express from 'express';
import {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  verifyUserIdentity,
  getAllReports,
  updateReportStatus
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/users/:id/verify-identity', verifyUserIdentity);
router.get('/reports', getAllReports);
router.put('/reports/:id', updateReportStatus);

export default router;
