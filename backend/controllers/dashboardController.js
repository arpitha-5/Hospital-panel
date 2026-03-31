import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Hospital from '../models/Hospital.js';
import VisitLog from '../models/VisitLog.js';
import Doctor from '../models/Doctor.js';

// Helper: convert hospitalId string to ObjectId for aggregate
const toOid = (id) => new mongoose.Types.ObjectId(id);

// ────────────────────────────────────────────────────────
// GET /api/dashboard/stats  — Main stat cards
// ────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const hid = toOid(req.user.hospitalId);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // All-time status breakdown for this hospital
    const [statusBreakdown, todayStats] = await Promise.all([
      Appointment.aggregate([
        { $match: { hospitalId: hid } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { hospitalId: hid, date: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const allTime = {};
    statusBreakdown.forEach(s => { allTime[s._id] = s.count; });

    let todayTotal = 0;
    const today = {};
    todayStats.forEach(s => { today[s._id] = s.count; todayTotal += s.count; });

    const hospital = await Hospital.findById(req.user.hospitalId).select('waitingTimeMinutes');

    res.json({
      todayAppointmentsCount: todayTotal,
      pendingBookings: today.pending || 0,
      completionRate: todayTotal > 0
        ? `${(((today.completed || 0) / todayTotal) * 100).toFixed(1)}%`
        : '0%',
      avgWaitingTime: `${hospital?.waitingTimeMinutes || 0}m`,
      // Full breakdown
      allTime: {
        total: Object.values(allTime).reduce((a, b) => a + b, 0),
        completed: allTime.completed || 0,
        cancelled: allTime.cancelled || 0,
        noShow: allTime['no-show'] || 0,
        rescheduled: allTime.rescheduled || 0,
        pending: allTime.pending || 0,
        confirmed: allTime.confirmed || 0
      },
      today: {
        total: todayTotal,
        completed: today.completed || 0,
        cancelled: today.cancelled || 0,
        noShow: today['no-show'] || 0,
        rescheduled: today.rescheduled || 0,
        pending: today.pending || 0,
        confirmed: today.confirmed || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────
// GET /api/dashboard/recent-appointments
// ────────────────────────────────────────────────────────
export const getRecentAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ hospitalId: req.user.hospitalId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────
// GET /api/dashboard/trends?days=7  — Daily appointment counts
// ────────────────────────────────────────────────────────
export const getTrends = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const hid  = toOid(req.user.hospitalId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trends = await Appointment.aggregate([
      { $match: { hospitalId: hid, date: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Pivot into { date, total, completed, cancelled, noShow, rescheduled, pending, confirmed }
    const byDate = {};
    trends.forEach(t => {
      const d = t._id.date;
      if (!byDate[d]) byDate[d] = { date: d, total: 0, completed: 0, cancelled: 0, noShow: 0, rescheduled: 0, pending: 0, confirmed: 0 };
      const key = t._id.status === 'no-show' ? 'noShow' : t._id.status;
      if (byDate[d][key] !== undefined) byDate[d][key] += t.count;
      byDate[d].total += t.count;
    });

    // Fill missing dates with zeros
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      result.push(byDate[key] || { date: key, total: 0, completed: 0, cancelled: 0, noShow: 0, rescheduled: 0, pending: 0, confirmed: 0 });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────
// GET /api/dashboard/calendar?month=2026-03  — Calendar data
// ────────────────────────────────────────────────────────
export const getCalendarData = async (req, res) => {
  try {
    const hid = toOid(req.user.hospitalId);
    const month = req.query.month; // YYYY-MM
    let startDate, endDate;

    if (month) {
      startDate = new Date(`${month}-01T00:00:00.000Z`);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      startDate = new Date();
      startDate.setDate(1); startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const data = await Appointment.aggregate([
      { $match: { hospitalId: hid, date: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const calendar = {};
    data.forEach(d => {
      const dt = d._id.date;
      if (!calendar[dt]) calendar[dt] = { date: dt, total: 0, booked: 0, cancelled: 0, rescheduled: 0 };
      calendar[dt].total += d.count;
      if (['pending', 'confirmed', 'completed'].includes(d._id.status)) calendar[dt].booked += d.count;
      if (d._id.status === 'cancelled') calendar[dt].cancelled += d.count;
      if (d._id.status === 'rescheduled') calendar[dt].rescheduled += d.count;
    });

    res.json({ success: true, data: Object.values(calendar) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────
// GET /api/dashboard/doctor-performance  — Per-doctor stats
// ────────────────────────────────────────────────────────
export const getDoctorPerformance = async (req, res) => {
  try {
    const hid = toOid(req.user.hospitalId);

    const perf = await Appointment.aggregate([
      { $match: { hospitalId: hid } },
      {
        $group: {
          _id: { doctorId: '$doctorId', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Pivot per doctor
    const byDoc = {};
    perf.forEach(p => {
      const did = p._id.doctorId.toString();
      if (!byDoc[did]) byDoc[did] = { doctorId: did, total: 0, completed: 0, cancelled: 0, noShow: 0 };
      byDoc[did].total += p.count;
      if (p._id.status === 'completed') byDoc[did].completed += p.count;
      if (p._id.status === 'cancelled') byDoc[did].cancelled += p.count;
      if (p._id.status === 'no-show') byDoc[did].noShow += p.count;
    });

    // Attach doctor names
    const doctorIds = Object.keys(byDoc).map(id => toOid(id));
    const doctors = await Doctor.find({ _id: { $in: doctorIds } }).select('name specialization');
    const docMap = {};
    doctors.forEach(d => { docMap[d._id.toString()] = { name: d.name, specialization: d.specialization }; });

    const result = Object.values(byDoc).map(d => ({
      ...d,
      name: docMap[d.doctorId]?.name || 'Unknown',
      specialization: docMap[d.doctorId]?.specialization || '',
      completionRate: d.total > 0 ? ((d.completed / d.total) * 100).toFixed(1) : '0'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ────────────────────────────────────────────────────────
// GET /api/dashboard/patient-visits?period=weekly
// ────────────────────────────────────────────────────────
export const getPatientVisits = async (req, res) => {
  try {
    const hid = toOid(req.user.hospitalId);
    const period = req.query.period || 'daily'; // daily | weekly | monthly
    const days = period === 'monthly' ? 365 : period === 'weekly' ? 56 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    let dateFormat;
    if (period === 'monthly') dateFormat = '%Y-%m';
    else if (period === 'weekly') dateFormat = '%Y-W%V';
    else dateFormat = '%Y-%m-%d';

    const visits = await VisitLog.aggregate([
      { $match: { hospitalId: hid, visitDate: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$visitDate' } },
          uniquePatients: { $addToSet: '$patientId' },
          totalVisits: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          uniquePatients: { $size: '$uniquePatients' },
          totalVisits: 1
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.json({ success: true, data: visits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
