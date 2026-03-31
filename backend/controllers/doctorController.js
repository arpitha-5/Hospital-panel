import Doctor from '../models/Doctor.js';
import Availability from '../models/Availability.js';

// @desc    Get all doctors for a hospital
// @route   GET /api/doctors
// @access  Private
export const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { hospitalId: req.user.hospitalId };
    
    // Search functionality (Advanced feature requirement)
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.specialization) {
      query.specialization = req.query.specialization;
    }

    const doctors = await Doctor.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Doctor.countDocuments(query);

    res.json({
      success: true,
      count: doctors.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      },
      data: doctors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a newly recruited doctor
// @route   POST /api/doctors
// @access  Private (Admin)
export const addDoctor = async (req, res) => {
  try {
    req.body.hospitalId = req.user.hospitalId;
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a doctor
// @route   PUT /api/doctors/:id
// @access  Private (Admin)
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.user.hospitalId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate a doctor (soft delete)
// @route   DELETE /api/doctors/:id
// @access  Private (Admin)
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.user.hospitalId },
      { isActive: false },
      { new: true }
    );
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor, message: 'Doctor deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get auto-generated available slots for a doctor on a date
// @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
// @access  Private
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'date query param is required (YYYY-MM-DD)' });
    }

    const queryDate = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[queryDate.getDay()];

    // 1. Get the doctor's schedule for this day
    const schedule = await Availability.findOne({
      doctorId: req.params.id,
      dayOfWeek,
      isAvailable: true
    });

    if (!schedule) {
      return res.json({ success: true, data: [], message: 'Doctor has no schedule for this day' });
    }

    // 2. Auto-generate all possible slots
    const allSlots = [];
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = schedule.slotDurationMinutes || 30;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      allSlots.push(`${hh}:${mm}`);
    }

    // 3. Find already-booked slots
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const bookedAppointments = await (await import('../models/Appointment.js')).default.find({
      doctorId: req.params.id,
      date: { $gte: queryDate, $lt: nextDay },
      status: { $nin: ['cancelled', 'rescheduled'] }
    }).select('timeSlot');

    const bookedSlots = new Set(bookedAppointments.map(a => a.timeSlot));

    // 4. Return available = all minus booked
    const available = allSlots.map(slot => ({
      time: slot,
      available: !bookedSlots.has(slot)
    }));

    res.json({ success: true, data: available });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manage Availability (HUC04)
// @route   POST /api/doctors/:id/availability
// @access  Private
export const setAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDurationMinutes } = req.body;
    
    const availability = await Availability.findOneAndUpdate(
      { doctorId: req.params.id, dayOfWeek: dayOfWeek },
      { 
        hospitalId: req.user.hospitalId,
        startTime, 
        endTime, 
        slotDurationMinutes 
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Notify patients that a doctor is late
// @route   POST /api/doctors/:id/late
// @access  Private (Staff/Admin)
export const markDoctorLate = async (req, res) => {
  try {
    const { delayMinutes } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Find all today's pending/confirmed appointments for this doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await (await import('../models/Appointment.js')).default.find({
      doctorId: req.params.id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] }
    });

    const Notification = (await import('../models/Notification.js')).default;
    const io = req.app.get('io');

    for (const appt of appointments) {
      // 1. Save notification in DB
      await Notification.create({
        userId: appt.patientId,
        title: 'Doctor Delay Alert',
        message: `${doctor.name} is running late by approximately ${delayMinutes} minutes. You may reschedule if needed.`,
        type: 'alert'
      });

      // 2. Real-time push via Socket.io
      io.to(`notifications_${appt.patientId.toString()}`).emit('new_notification', {
        title: 'Doctor Delay Alert',
        message: `${doctor.name} is late by ${delayMinutes} mins. Option to reschedule is available.`,
        type: 'alert'
      });
    }

    res.json({ success: true, message: `Notified ${appointments.length} patients about ${delayMinutes} min delay.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
