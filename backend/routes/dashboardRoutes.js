import express from 'express';
import { getDashboardStats, getRecentAppointments, getTrends, getCalendarData, getDoctorPerformance, getPatientVisits } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/recent-appointments', getRecentAppointments);
router.get('/trends', getTrends);
router.get('/calendar', getCalendarData);
router.get('/doctor-performance', getDoctorPerformance);
router.get('/patient-visits', getPatientVisits);

export default router;
