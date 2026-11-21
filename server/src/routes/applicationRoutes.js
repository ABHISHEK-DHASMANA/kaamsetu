import express from 'express';
import {
  applyJob,
  getWorkerApplications,
  getEmployerApplications,
  updateApplicationStatus
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/apply', protect, authorize('worker'), applyJob);
router.get('/worker', protect, authorize('worker'), getWorkerApplications);
router.get('/employer', protect, authorize('employer', 'admin'), getEmployerApplications);
router.put('/:id/status', protect, authorize('employer', 'admin'), updateApplicationStatus);

export default router;
