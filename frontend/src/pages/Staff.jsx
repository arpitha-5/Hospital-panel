import React, { useEffect, useState } from 'react';
import { Users, Loader2, Plus, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddStaffModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/manage/staff', form);
      toast.success('Staff member added');
      onSuccess(res.data);
      onClose();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Add Staff Member</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
          <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
          <p className="text-xs text-gray-500">Default password: password123</p>
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">{submitting ? 'Adding...' : 'Add Staff'}</button>
        </form>
      </div>
    </div>
  );
};

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/manage/staff');
      setStaff(res);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/manage/staff/${id}`, { status: newStatus });
      setStaff(prev => prev.map(s => s._id === id ? { ...s, status: newStatus } : s));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {showModal && <AddStaffModal onClose={() => setShowModal(false)} onSuccess={(u) => setStaff(prev => [...prev, u])} />}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Staff Management</h2>
          <p className="text-gray-500 mt-2">Manage live hospital administrative and support staff</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200">
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50/50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map(user => (
                <tr key={user._id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium uppercase">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(user._id, user.status)} className={`px-2 py-1 rounded-md text-xs font-medium uppercase cursor-pointer hover:opacity-80 transition-opacity ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.status}
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No staff found in DB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Staff;
