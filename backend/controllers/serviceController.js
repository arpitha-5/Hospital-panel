import Service from '../models/Service.js';

export const getServices = async (req, res) => {
  try {
    const services = await Service.find({ hospitalId: req.user.hospitalId }).sort({ createdAt: -1 });
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, hospitalId: req.user.hospitalId });
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, hospitalId: req.user.hospitalId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, hospitalId: req.user.hospitalId });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
