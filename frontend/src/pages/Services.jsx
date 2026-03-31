import React, { useEffect, useState } from 'react';
import { LayoutList, Plus, Search, CheckCircle2, XCircle, Loader2, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AddServiceModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', description: '', category: 'Consultation', price: '', duration: 30, isActive: true });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price), duration: Number(form.duration) };
      const res = await api.post('/services', payload);
      toast.success('Service added successfully');
      onSuccess(res.data.data);
      onClose();
    } catch (error) {
      toast.error('Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-lg">Add New Service</h3>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Service Name</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition-all" placeholder="e.g. General Checkup" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 outline-none transition-all">
              <option>Consultation</option><option>Diagnostic</option><option>Surgery</option><option>Emergency</option><option>Therapy</option><option>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Price (₹)</label>
              <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white outline-none" placeholder="500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Duration (mins)</label>
              <input required type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white outline-none" placeholder="30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white outline-none" placeholder="Details about this service..." rows="3"></textarea>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl shadow-md shadow-red-200 flex justify-center">{loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Service'}</button>
        </form>
      </div>
    </div>
  );
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      toast.success('Service deleted');
    } catch(err) {
      toast.error('Error deleting service');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {showModal && <AddServiceModal onClose={() => setShowModal(false)} onSuccess={(s) => setServices([s, ...services])} />}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Hospital Services</h2>
          <p className="text-gray-500 mt-1">Manage offered medical services and packges</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200">
          <Plus size={18} /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <LayoutList size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{service.name}</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md mt-1 inline-block">{service.category}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(service._id)} className="text-gray-300 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{service.description || 'No description provided.'}</p>
              
              <div className="border-t border-gray-50 pt-4 flex justify-between items-center text-sm font-medium">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Price</span>
                  <span className="text-gray-800 text-base font-bold">₹{service.price}</span>
                </div>
                <div className="flex flex-col text-right">
                   <span className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Duration</span>
                   <span className="text-gray-700">{service.duration} mins</span>
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && (
             <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
               <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                 <LayoutList size={32} />
               </div>
               <p className="text-gray-500 font-medium text-lg">No services defined</p>
               <p className="text-gray-400 text-sm mt-1">Add your first medical service to get started</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Services;
