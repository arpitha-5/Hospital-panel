import express from 'express';
import { getStaff, createStaff, updateStaffStatus, getSupportTickets, updateSupportTicket, getInsuranceNotes, getPatients, verifyPatient } from '../controllers/managementController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, staffSchema, ticketUpdateSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'staff'));

// Staff
router.route('/staff')
  .get(getStaff)
  .post(authorize('admin'), validate(staffSchema), createStaff);
router.patch('/staff/:id', authorize('admin'), updateStaffStatus);

// Support
router.get('/support', getSupportTickets);
router.patch('/support/:id', validate(ticketUpdateSchema), updateSupportTicket);

// Insurance
router.get('/insurance', getInsuranceNotes);

// Patients (Verification)
router.get('/patients', getPatients);
router.patch('/patients/:id/verify', verifyPatient);

export default router;
