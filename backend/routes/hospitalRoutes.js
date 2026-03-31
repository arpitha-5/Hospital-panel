import express from 'express';
import { getHospitalProfile, updateHospitalProfile, updateWaitTime, toggleHospitalStatus } from '../controllers/hospitalController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes below are protected

router.route('/profile')
  .get(getHospitalProfile)
  .put(authorize('admin'), updateHospitalProfile);

router.patch('/wait-time', authorize('staff', 'admin'), updateWaitTime);
router.patch('/toggle-status', authorize('admin'), toggleHospitalStatus);

export default router;
