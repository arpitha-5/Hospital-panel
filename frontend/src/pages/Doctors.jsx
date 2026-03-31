import React, { useEffect, useState } from 'react';
import { UserRound, Plus, Star, Loader2, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddDoctorModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', specialization: '', experienceYears: '', consultationFee: '', rating: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, experienceYears: Number(form.experienceYears), consultationFee: Number(form.consultationFee), rating: Number(form.rating) || 0 };
      const res = await api.post('/doctors', payload);
      toast.success('Doctor added successfully');
      onSuccess(res.data);
      onClose();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to add doctor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Add New Doctor</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
          <input required placeholder="Specialization" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} className="input-field" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" placeholder="Experience (years)" value={form.experienceYears} onChange={e => setForm({...form, experienceYears: e.target.value})} className="input-field" />
            <input required type="number" placeholder="Fee (₹)" value={form.consultationFee} onChange={e => setForm({...form, consultationFee: e.target.value})} className="input-field" />
          </div>
          <input type="number" step="0.1" min="0" max="5" placeholder="Rating (0-5)" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} className="input-field" />
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">{submitting ? 'Adding...' : 'Add Doctor'}</button>
        </form>
      </div>
    </div>
  );
};

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data || []);
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {showModal && <AddDoctorModal onClose={() => setShowModal(false)} onSuccess={(doc) => setDoctors(prev => [doc, ...prev])} />}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Doctors Roster</h2>
          <p className="text-gray-500 mt-2">Manage live hospital staff</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200">
          <Plus size={18} />
          Add Doctor
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doc => (
            <div key={doc._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full z-0 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 flex items-center justify-center shadow-inner">
                   <UserRound size={28} />
                </div>
                <div>
                   <h3 className="font-bold text-gray-800 text-lg">{doc.name}</h3>
                   <p className="text-sm font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block mt-1">{doc.specialization}</p>
                </div>
              </div>
              <div className="space-y-3 relative z-10 mt-6">
                 <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                   <span className="text-gray-500">Experience</span>
                   <span className="font-semibold text-gray-800">{doc.experienceYears || 0} Years</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                   <span className="text-gray-500">Rating</span>
                   <span className="font-semibold text-gray-800 flex items-center gap-1">
                     {doc.rating || '4.8'} <Star size={14} className="text-yellow-400 fill-current" />
                   </span>
                 </div>
                 <div className="flex justify-between items-center text-sm pt-1">
                   <span className="text-gray-500">Consultation Fee</span>
                   <span className="font-semibold text-gray-800">₹{doc.consultationFee || '500'}</span>
                 </div>
              </div>
            </div>
          ))}
          {doctors.length === 0 && (
             <div className="col-span-full text-center p-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
               No doctors found.
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Doctors;
