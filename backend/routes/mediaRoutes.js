import express from 'express';
import { uploadMedia, getMedia, deleteMedia, uploadObject } from '../controllers/mediaController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMedia)
  .post(authorize('admin', 'staff'), uploadObject.single('image'), uploadMedia);

router.route('/:id')
  .delete(authorize('admin', 'staff'), deleteMedia);

export default router;
