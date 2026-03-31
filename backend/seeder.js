import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from './models/Hospital.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Appointment from './models/Appointment.js';
import SupportTicket from './models/SupportTicket.js';
import Insurance from './models/Insurance.js';
import Availability from './models/Availability.js';
import VisitLog from './models/VisitLog.js';
import AppointmentHistory from './models/AppointmentHistory.js';

dotenv.config();

const connectDB = async () => {
  try {
    const monoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthpass';
    await mongoose.connect(monoURI);
    console.log('MongoDB connected for seeding ✅');
  } catch (error) {
    console.error('MongoDB connection error ❌:', error);
    process.exit(1);
  }
};

export const importData = async () => {
  await connectDB();
  try {
    // Clear out existing data and collections (dropping db ensures no old indexes break seeding)
    await mongoose.connection.db.dropDatabase();

    console.log('Database dropped.');

    // 1. Create Hospital
    const createdHospital = await Hospital.create({
      name: 'City Care Hospital',
      email: 'contact@citycare.com',
      phone: '123-456-7890',
      address: {
        street: '123 Health Ave',
        city: 'Metropolis',
        state: 'NY',
        zipCode: '10001'
      },
      status: 'active',
      waitingTimeMinutes: 15,
      adminId: new mongoose.Types.ObjectId()
    });

    const hospitalId = createdHospital._id;

    // 2. Create Admin
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@citycare.com',
      password: 'password123',
      role: 'admin',
      hospitalId,
      status: 'active'
    });

    createdHospital.adminId = adminUser._id;
    await createdHospital.save();

    // 3. Create Staff Users
    const staff1 = await User.create({
      name: 'Emily Parker',
      email: 'emily@citycare.com',
      password: 'password123',
      role: 'staff',
      hospitalId,
      status: 'active'
    });

    const staff2 = await User.create({
      name: 'James Wilson',
      email: 'james@citycare.com',
      password: 'password123',
      role: 'staff',
      hospitalId,
      status: 'active'
    });

    const staff3 = await User.create({
      name: 'Maria Santos',
      email: 'maria@citycare.com',
      password: 'password123',
      role: 'staff',
      hospitalId,
      status: 'inactive'
    });

    // 4. Create Patients
    const patient1 = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      role: 'patient',
      hospitalId,
      status: 'active'
    });

    const patient2 = await User.create({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
      role: 'patient',
      hospitalId,
      status: 'active'
    });

    const patient3 = await User.create({
      name: 'Robert Brown',
      email: 'robert.b@example.com',
      password: 'password123',
      role: 'patient',
      hospitalId,
      status: 'active'
    });

    // 5. Create Doctors
    const doc1 = await Doctor.create({
      hospitalId,
      name: 'Dr. Sarah Connor',
      specialization: 'Cardiologist',
      experienceYears: 10,
      rating: 4.8,
      consultationFee: 150,
      isActive: true
    });

    const doc2 = await Doctor.create({
      hospitalId,
      name: 'Dr. Gregory House',
      specialization: 'Diagnostician',
      experienceYears: 15,
      rating: 4.5,
      consultationFee: 200,
      isActive: true
    });

    const doc3 = await Doctor.create({
      hospitalId,
      name: 'Dr. Meredith Grey',
      specialization: 'General Surgeon',
      experienceYears: 8,
      rating: 4.9,
      consultationFee: 180,
      isActive: true
    });

    const doc4 = await Doctor.create({
      hospitalId,
      name: 'Dr. Derek Shepherd',
      specialization: 'Neurologist',
      experienceYears: 12,
      rating: 4.7,
      consultationFee: 250,
      isActive: true
    });

    // 6. Create Doctor Availability Schedules
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const allDocs = [doc1, doc2, doc3, doc4];
    for (const doc of allDocs) {
      for (const day of weekdays) {
        await Availability.create({
          doctorId: doc._id,
          hospitalId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: 30,
          isAvailable: true
        });
      }
    }
    console.log('Availability schedules created.');

    // 7. Generate 30 days of appointments with varied statuses
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled'];
    const timeSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'];
    const patients = [patient1, patient2, patient3];
    const appointmentDocs = [];
    const visitLogDocs = [];

    for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);

      // 3-8 appointments per day
      const count = 3 + Math.floor(Math.random() * 6);
      const usedSlots = new Map(); // key: doctorId+slot

      for (let j = 0; j < count; j++) {
        const doc = allDocs[j % allDocs.length];
        const pat = patients[j % patients.length];
        const slot = timeSlots[j % timeSlots.length];
        const slotKey = `${doc._id}_${slot}`;

        if (usedSlots.has(slotKey)) continue;
        usedSlots.set(slotKey, true);

        // Past dates get final statuses; today/future get pending/confirmed
        let status;
        if (daysAgo > 0) {
          const rand = Math.random();
          if (rand < 0.45) status = 'completed';
          else if (rand < 0.60) status = 'confirmed';
          else if (rand < 0.75) status = 'cancelled';
          else if (rand < 0.85) status = 'no-show';
          else if (rand < 0.95) status = 'rescheduled';
          else status = 'pending';
        } else {
          status = Math.random() < 0.6 ? 'pending' : 'confirmed';
        }

        appointmentDocs.push({
          hospitalId, doctorId: doc._id, patientId: pat._id,
          date, timeSlot: slot, status
        });

        // Create visit logs for completed appointments
        if (status === 'completed') {
          visitLogDocs.push({
            hospitalId, patientId: pat._id, doctorId: doc._id,
            visitDate: date, checkInTime: slot,
            checkOutTime: timeSlots[Math.min(timeSlots.indexOf(slot) + 1, timeSlots.length - 1)]
          });
        }
      }
    }

    await Appointment.insertMany(appointmentDocs);
    if (visitLogDocs.length > 0) await VisitLog.insertMany(visitLogDocs);
    console.log(`${appointmentDocs.length} appointments seeded across 30 days.`);
    console.log(`${visitLogDocs.length} visit logs seeded.`);

    // 7. Create Support Tickets
    await SupportTicket.create([
      {
        hospitalId,
        creatorId: patient1._id,
        subject: 'Cannot reschedule appointment',
        description: 'I tried to reschedule my appointment with Dr. Connor but the system does not allow me to pick a new date.',
        status: 'open',
        priority: 'high'
      },
      {
        hospitalId,
        creatorId: patient2._id,
        subject: 'Billing inquiry',
        description: 'I was charged twice for my consultation on March 15th. Please look into this and process a refund.',
        status: 'in-progress',
        priority: 'medium'
      },
      {
        hospitalId,
        creatorId: patient3._id,
        subject: 'Request for medical records',
        description: 'I need a copy of my medical records from the last 6 months for insurance purposes.',
        status: 'open',
        priority: 'low'
      },
      {
        hospitalId,
        creatorId: patient1._id,
        subject: 'App login issues',
        description: 'I am unable to log into my patient portal. Password reset is not working either.',
        status: 'resolved',
        priority: 'critical'
      }
    ]);

    // 8. Create Insurance Notes
    await Insurance.create([
      {
        hospitalId,
        userId: patient1._id,
        providerName: 'Blue Cross Blue Shield',
        policyNumber: 'BCBS-2024-78901',
        coverageType: 'Full Coverage',
        coverageLimit: 500000,
        status: 'verified'
      },
      {
        hospitalId,
        userId: patient2._id,
        providerName: 'Aetna Health',
        policyNumber: 'AET-2024-45632',
        coverageType: 'Partial Coverage',
        coverageLimit: 250000,
        status: 'pending'
      },
      {
        hospitalId,
        userId: patient3._id,
        providerName: 'UnitedHealth Group',
        policyNumber: 'UHG-2024-33210',
        coverageType: 'Emergency Only',
        coverageLimit: 100000,
        status: 'verified'
      }
    ]);

    console.log('Data Imported successfully! 🟢');
    console.log('Login: admin@citycare.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data: 🔴', error);
    process.exit(1);
  }
};

importData();
