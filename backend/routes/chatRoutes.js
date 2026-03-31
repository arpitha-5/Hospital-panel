import express from 'express';
import { getHistory } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:roomId', getHistory);

export default router;
