import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Hospital from '../models/Hospital.js';
import AppointmentHistory from '../models/AppointmentHistory.js';
import VisitLog from '../models/VisitLog.js';

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Staff/Admin)
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, date, timeSlot } = req.body;
    const hospitalId = req.user.hospitalId;

    // Check hospital not paused
    const hospital = await Hospital.findById(hospitalId);
    if (hospital.status === 'paused') {
      return res.status(403).json({ success: false, message: 'Cannot create appointments while hospital is paused' });
    }

    // Double-booking is prevented by the unique compound index (doctorId + date + timeSlot)
    const appointment = await Appointment.create({
      hospitalId, doctorId, patientId, date, timeSlot
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');

    // Notification for patient
    await Notification.create({
      userId: patientId,
      title: 'New Appointment Booked',
      message: `Appointment booked for ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
      type: 'booking'
    });

    // Broadcast via socket
    const io = req.app.get('io');
    io.to(hospitalId.toString()).emit('booking_update', {
      patientName: populated.patientId?.name,
      appointment: populated
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked for this doctor. Please choose another.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = { hospitalId: req.user.hospitalId };
    
    // Filtering for dashboard "today" logic
    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = { $gte: queryDate, $lt: nextDay };
    }
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status (Accept, Cancel, No-Show)
// @route   PATCH /api/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Edge Case: Check hospital status before processing booking
    const hospital = await Hospital.findById(req.user.hospitalId);
    if (hospital.status === 'paused' && status === 'confirmed') {
      return res.status(403).json({ success: false, message: 'Cannot accept bookings while hospital is paused' });
    }

    const previousStatus = appointment.status;
    appointment.status = status;
    if (reason && status === 'cancelled') appointment.cancellationReason = reason;

    await appointment.save();

    // Audit log
    await AppointmentHistory.create({
      appointmentId: appointment._id,
      hospitalId: req.user.hospitalId,
      previousStatus,
      newStatus: status,
      changedBy: req.user._id,
      reason: reason || undefined
    });

    // Auto-create VisitLog when appointment is completed
    if (status === 'completed') {
      await VisitLog.create({
        hospitalId: appointment.hospitalId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        visitDate: appointment.date,
        checkInTime: appointment.timeSlot
      });
    }

    await Notification.create({
      userId: appointment.patientId,
      title: `Appointment ${status}`,
      message: `Your appointment status was updated to ${status}.`,
      type: status === 'cancelled' ? 'cancellation' : 'booking'
    });

    // Broadcast status change via socket
    const io = req.app.get('io');
    io.to(req.user.hospitalId.toString()).emit('appointment_status_update', {
      appointmentId: appointment._id,
      status
    });

    // Push real-time notification to patient
    io.to(`notifications_${appointment.patientId.toString()}`).emit('new_notification', {
      title: `Appointment ${status}`,
      message: `Your appointment status was updated to ${status}.`
    });

    res.json({ success: true, data: appointment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slot overlapping error. Double booking prevented by database rules.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule an appointment
// @route   POST /api/appointments/:id/reschedule
// @access  Private (Staff/Admin)
export const rescheduleAppointment = async (req, res) => {
  try {
    const { newDate, newTimeSlot, reason } = req.body;
    const original = await Appointment.findById(req.params.id);

    if (!original) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Mark original as rescheduled
    const previousStatus = original.status;
    original.status = 'rescheduled';
    await original.save();

    // Log the reschedule
    await AppointmentHistory.create({
      appointmentId: original._id,
      hospitalId: original.hospitalId,
      previousStatus,
      newStatus: 'rescheduled',
      changedBy: req.user._id,
      reason,
      metadata: { newDate, newTimeSlot }
    });

    // Create new appointment at new slot
    const newAppointment = await Appointment.create({
      hospitalId: original.hospitalId,
      doctorId: original.doctorId,
      patientId: original.patientId,
      date: new Date(newDate),
      timeSlot: newTimeSlot
    });

    const populated = await Appointment.findById(newAppointment._id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');

    // Notify patient
    await Notification.create({
      userId: original.patientId,
      title: 'Appointment Rescheduled',
      message: `Your appointment has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTimeSlot}.`,
      type: 'booking'
    });

    const io = req.app.get('io');
    io.to(`notifications_${original.patientId.toString()}`).emit('new_notification', {
      title: 'Appointment Rescheduled',
      message: `Rescheduled to ${new Date(newDate).toLocaleDateString()} at ${newTimeSlot}.`
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'New time slot is already booked. Choose another.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit history for an appointment
// @route   GET /api/appointments/:id/history
// @access  Private
export const getAppointmentHistory = async (req, res) => {
  try {
    const history = await AppointmentHistory.find({ appointmentId: req.params.id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
