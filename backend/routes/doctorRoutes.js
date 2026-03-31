import express from 'express';
import { getDoctors, addDoctor, updateDoctor, deleteDoctor, getAvailableSlots, setAvailability, markDoctorLate } from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, doctorSchema } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDoctors)
  .post(authorize('admin'), validate(doctorSchema), addDoctor);

router.route('/:id')
  .put(authorize('admin'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

router.get('/:id/slots', getAvailableSlots);
router.post('/:id/availability', authorize('staff', 'admin'), setAvailability);
router.post('/:id/late', authorize('staff', 'admin'), markDoctorLate);

export default router;
