import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardAnalytics);

export default router;
