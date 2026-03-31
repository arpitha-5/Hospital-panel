import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const CreateAppointmentModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ doctorId: '', patientId: '', date: '', timeSlot: '' });
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/doctors?limit=50');
        setDoctors(res.data || []);
      } catch (_) {}
    };
    load();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (form.doctorId && form.date) {
        setLoadingSlots(true);
        try {
          const res = await api.get(`/doctors/${form.doctorId}/slots?date=${form.date}`);
          // "If doctor unavailable: do NOT show slots" -> Filter out unavailable
          const availableSlots = (res.data || []).filter(s => s.available).map(s => s.time);
          setSlots(availableSlots);
          if (!availableSlots.includes(form.timeSlot)) setForm(prev => ({ ...prev, timeSlot: '' }));
        } catch (_) {
          toast.error('Failed to load slots');
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setSlots([]);
      }
    };
    loadSlots();
  }, [form.doctorId, form.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/appointments', form);
      toast.success('Appointment created');
      onSuccess(res.data);
      onClose();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">New Appointment</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Doctor</label>
            <select required value={form.doctorId} onChange={e => setForm({...form, doctorId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none">
              <option value="">Select Doctor</option>
              {doctors.map(d => <option key={d._id} value={d._id}>{d.name} — {d.specialization}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Patient ID</label>
            <input required placeholder="Paste Patient ID" value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
              <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Time Slot</label>
              <select required value={form.timeSlot} onChange={e => setForm({...form, timeSlot: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" disabled={loadingSlots || slots.length === 0}>
                <option value="">{loadingSlots ? 'Loading...' : 'Select Slot'}</option>
                {slots.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {form.doctorId && form.date && !loadingSlots && slots.length === 0 && (
            <p className="text-sm text-red-500 font-medium">Doctor is unavailable on this date. No slots.</p>
          )}
          <button type="submit" disabled={submitting || slots.length === 0} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-sm rounded-xl transition-all shadow-md mt-2 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ... Appointments component remains mostly similar, adding Mark Delay button
const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let query = '';
      if (dateFilter) query += `?date=${dateFilter}`;
      const res = await api.get(`/appointments${query}`);
      setAppointments(res.data || []);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  
  const notifyDelay = async (doctorId) => {
    try {
      await api.post(`/doctors/${doctorId}/late`, { delayMinutes: 30 });
      toast.success('Successfully notified patients about 30 min delay');
    } catch (error) {
      toast.error('Could not notify delay: ' + (error || 'Unknown error'));
    }
  };

  const filtered = appointments.filter(a => statusFilter === 'all' || a.status === statusFilter);

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {showCreate && <CreateAppointmentModal onClose={() => setShowCreate(false)} onSuccess={(appt) => setAppointments(prev => [appt, ...prev])} />}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Appointments</h2>
          <p className="text-gray-500 mt-2">Manage interactive DB appointments live.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200">
            <Plus size={18} /> New Appointment
          </button>
          <input 
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
          />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(appt => (
                  <tr key={appt._id} className="hover:bg-red-50/10 transition-colors border-b border-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                          {appt.patientId?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{appt.patientId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{appt.patientId?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-gray-800">{appt.doctorId?.name || 'Unassigned'}</p>
                          <p className="text-xs text-gray-500">{appt.doctorId?.specialization || 'N/A'}</p>
                        </div>
                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button onClick={() => notifyDelay(appt.doctorId._id)} className="ml-2 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded" title="Notify 30m Delay">Mark Late</button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{new Date(appt.date).toLocaleDateString()}</p>
                      <p className="text-xs font-mono text-gray-500 mt-1">{appt.timeSlot}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        appt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                        appt.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        appt.status === 'rescheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {appt.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {appt.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => updateStatus(appt._id, 'confirmed')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100" title="Confirm">
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => updateStatus(appt._id, 'cancelled')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100" title="Cancel">
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
