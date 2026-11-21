import express from 'express';
import { extractJobPreferences } from '../controllers/voiceController.js';

const router = express.Router();

router.post('/extract-preferences', extractJobPreferences);

export default router;
