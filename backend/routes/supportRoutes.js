import express from 'express';
import { createSupportTicket, getSupportTickets, updateSupportTicket } from '../controllers/managementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createSupportTicket);
router.get('/', getSupportTickets);
router.patch('/:id', updateSupportTicket);

export default router;
