import mongoose from 'mongoose';
import fs from 'fs';
import Hospital from './models/Hospital.js';
import User from './models/User.js';
import Doctor from './models/Doctor.js';
import Appointment from './models/Appointment.js';

const log = (msg) => {
  fs.appendFileSync('seed_debug.log', msg + '\n');
}

const run = async () => {
  log('Starting connectDB');
  try {
    await mongoose.connect('mongodb://localhost:27017/healthpass');
    log('Connected to local MongoDB');
  } catch (err) {
    log('Connection Error: ' + err.message);
    return;
  }

  try {
    await Hospital.deleteMany();
    await User.deleteMany();
    await Doctor.deleteMany();
    await Appointment.deleteMany();
    log('Cleared old data');

    const createdHospital = await Hospital.create({
      name: 'City Care Hospital Demo',
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
    log('Hospital created');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@citycare.com',
      password: 'password123',
      role: 'admin',
      hospitalId: createdHospital._id,
      status: 'active'
    });
    log('Admin User created: ' + adminUser.email);
    
    createdHospital.adminId = adminUser._id;
    await createdHospital.save();
    log('Hospital updated with real admin');

    const patient = await User.create({
      name: 'John Doe Patient',
      email: 'patient@example.com',
      password: 'password123',
      role: 'patient',
      status: 'active'
    });
    log('Patient created');

    const doc1 = await Doctor.create({
      hospitalId: createdHospital._id,
      name: 'Dr. Sarah Connor',
      specialization: 'Cardiologist',
      experience: 10,
      rating: 4.8,
      consultationFee: 150,
      isAvailable: true
    });
    log('Doc1 created: ' + !!doc1);

    const doc2 = await Doctor.create({
      hospitalId: createdHospital._id,
      name: 'Dr. Gregory House',
      specialization: 'Diagnostician',
      experience: 15,
      rating: 4.5,
      consultationFee: 200,
      isAvailable: true
    });
    log('Doc2 created');

    const today = new Date();
    await Appointment.create([
      {
        hospitalId: createdHospital._id,
        doctorId: doc1._id,
        patientId: patient._id,
        date: today,
        timeSlot: '09:00',
        status: 'pending'
      }
    ]);
    log('Appointments created. Success!');
  } catch (error) {
    log('Error during seeding: ' + error.stack);
  } finally {
    process.exit(0);
  }
};
run();
