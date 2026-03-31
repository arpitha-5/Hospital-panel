import express from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getServices)
  .post(authorize('admin', 'staff'), createService);

router.route('/:id')
  .put(authorize('admin', 'staff'), updateService)
  .delete(authorize('admin'), deleteService);

export default router;
