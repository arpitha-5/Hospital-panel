import express from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus, rescheduleAppointment, getAppointmentHistory } from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, appointmentSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(authorize('staff', 'admin'), validate(appointmentSchema), createAppointment);

router.patch('/:id/status', authorize('staff', 'admin'), updateAppointmentStatus);
router.post('/:id/reschedule', authorize('staff', 'admin'), rescheduleAppointment);
router.get('/:id/history', getAppointmentHistory);

export default router;
