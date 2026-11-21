import express from 'express';
import {
  getWorkerProfile,
  updateWorkerProfile,
  getSkillPassport,
  getAllWorkers
} from '../controllers/workerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/all', getAllWorkers);
router.get('/profile', protect, authorize('worker'), getWorkerProfile);
router.get('/profile/:userId', getWorkerProfile);
router.put('/profile', protect, authorize('worker'), updateWorkerProfile);
router.get('/passport', protect, authorize('worker'), getSkillPassport);
router.get('/passport/:passportId', getSkillPassport);

export default router;
