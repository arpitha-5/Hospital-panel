import Hospital from '../models/Hospital.js';

// @desc    Get hospital profile
// @route   GET /api/hospitals/profile
// @access  Private (Admin/Staff)
export const getHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.user.hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update hospital profile
// @route   PUT /api/hospitals/profile
// @access  Private (Admin)
export const updateHospitalProfile = async (req, res) => {
  try {
    let hospital = await Hospital.findById(req.user.hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    if (hospital.adminId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update' });
    }

    hospital = await Hospital.findByIdAndUpdate(req.user.hospitalId, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update wait times (HUC13)
// @route   PATCH /api/hospitals/wait-time
// @access  Private (Staff/Admin)
export const updateWaitTime = async (req, res) => {
  try {
    const { minutes } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      req.user.hospitalId,
      { waitingTimeMinutes: minutes },
      { new: true }
    );

    // Broadcast wait-time update to all connected clients
    const io = req.app.get('io');
    io.to(req.user.hospitalId.toString()).emit('wait_time_update', { minutes });

    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle hospital status (HUC20)
// @route   PATCH /api/hospitals/toggle-status
// @access  Private (Admin)
export const toggleHospitalStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'active', 'paused'
    const hospital = await Hospital.findByIdAndUpdate(
      req.user.hospitalId,
      { status },
      { new: true }
    );
    res.json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
