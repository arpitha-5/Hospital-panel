import Joi from 'joi';

// ── Auth ──
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('admin', 'staff', 'patient').default('staff'),
  hospitalId: Joi.string().hex().length(24)
});

// ── Doctor ──
export const doctorSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  specialization: Joi.string().trim().required(),
  experienceYears: Joi.number().min(0).max(60).required(),
  consultationFee: Joi.number().min(0).required(),
  rating: Joi.number().min(0).max(5).default(0),
  image: Joi.string().uri().allow('', null)
});

// ── Appointment ──
export const appointmentSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  patientId: Joi.string().hex().length(24).required(),
  date: Joi.date().iso().required(),
  timeSlot: Joi.string().pattern(/^\d{2}:\d{2}$/).required().messages({
    'string.pattern.base': 'Time slot must be in HH:mm format'
  })
});

// ── Staff ──
export const staffSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).default('password123'),
  role: Joi.string().valid('staff').default('staff')
});

// ── Support Ticket ──
export const ticketUpdateSchema = Joi.object({
  status: Joi.string().valid('open', 'in-progress', 'resolved', 'closed'),
  response: Joi.object({
    message: Joi.string().required()
  })
}).min(1);

// ── Generic validation middleware factory ──
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  next();
};
