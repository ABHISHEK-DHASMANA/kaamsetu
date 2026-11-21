import express from 'express';
import { protect } from '../middleware/auth.js';
import { listChats, getMessages, sendMessage } from '../controllers/chatController.js';
const router = express.Router();
router.use(protect);
router.get('/', listChats);
router.get('/:applicationId/messages', getMessages);
router.post('/:applicationId/messages', sendMessage);
export default router;
