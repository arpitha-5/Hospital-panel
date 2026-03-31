import User from '../models/User.js';
import SupportTicket from '../models/SupportTicket.js';
import Insurance from '../models/Insurance.js';

// ── Staff CRUD ──
export const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ hospitalId: req.user.hospitalId, role: 'staff' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'password123',
      role: 'staff',
      hospitalId: req.user.hospitalId,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.user.hospitalId, role: 'staff' },
      { status },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Support Tickets ──
export const getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ hospitalId: req.user.hospitalId })
      .populate('creatorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupportTicket = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    const ticket = await SupportTicket.create({
      hospitalId: req.user.hospitalId,
      creatorId: req.user._id,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open'
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportTicket = async (req, res) => {
  try {
    const { status, response } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, hospitalId: req.user.hospitalId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (response?.message) {
      ticket.responses.push({
        senderId: req.user._id,
        senderRole: req.user.role,
        message: response.message
      });
    }

    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Insurance ──
export const getInsuranceNotes = async (req, res) => {
  try {
    const notes = await Insurance.find({ hospitalId: req.user.hospitalId }).populate('userId', 'name email');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Patients (Verification) ──
export const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ hospitalId: req.user.hospitalId, role: 'patient' });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPatient = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.user.hospitalId, role: 'patient' },
      { isVerified },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

