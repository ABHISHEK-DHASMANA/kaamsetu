import express from 'express';
import {
  getEmployerProfile,
  updateEmployerProfile,
  getCandidatesForJob
} from '../controllers/employerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, authorize('employer', 'admin'), getEmployerProfile);
router.get('/profile/:userId', getEmployerProfile);
router.put('/profile', protect, authorize('employer', 'admin'), updateEmployerProfile);
router.get('/jobs/:jobId/candidates', protect, authorize('employer', 'admin'), getCandidatesForJob);

export default router;
