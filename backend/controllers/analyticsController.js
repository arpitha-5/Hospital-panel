import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';

// @desc    Get dashboard metrics (Live database calculation)
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Dynamic Database aggregations (NO HARDCODE)
    const pipeline = [
      { $match: { hospitalId, date: { $gte: todayStart, $lte: todayEnd } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const stats = await Appointment.aggregate(pipeline);

    let totalAppointments = 0;
    let pendingBookings = 0;
    let completedAppointments = 0;

    stats.forEach(stat => {
      totalAppointments += stat.count;
      if (stat._id === 'pending') pendingBookings += stat.count;
      if (stat._id === 'completed') completedAppointments += stat.count;
    });

    const completionRate = totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0;

    const hospital = await Hospital.findById(hospitalId).select('waitingTimeMinutes status');

    res.json({
      success: true,
      data: {
        totalAppointments,
        pendingBookings,
        completionRate: `${completionRate}%`,
        avgWaitingTime: `${hospital.waitingTimeMinutes}m`,
        hospitalStatus: hospital.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
