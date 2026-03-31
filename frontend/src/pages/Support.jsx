import React, { useEffect, useState } from 'react';
import { HeadphonesIcon, Loader2, MessageCircle, Plus, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const CreateTicketModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/support', form);
      toast.success('Ticket created successfully');
      onSuccess(res.data);
      onClose();
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">New Support Ticket</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
            <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
            <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-sm rounded-xl transition-all shadow-md mt-2 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/support');
        setTickets(Array.isArray(res) ? res : res.data || []);
      } catch (error) {
        toast.error('Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleUpdate = async (id, payload) => {
    try {
      const res = await api.patch(`/support/${id}`, payload);
      const updated = res.data;
      setTickets(prev => prev.map(t => t._id === id ? updated : t));
      toast.success('Ticket updated');
      setReplyText(prev => ({ ...prev, [id]: '' }));
    } catch (_) {
      toast.error('Failed to update ticket');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onSuccess={(t) => setTickets([t, ...tickets])} />}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <HeadphonesIcon className="text-red-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Support Center</h2>
            <p className="text-gray-500 mt-2">Manage tickets, reply to issues, and resolve queries.</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200">
          <Plus size={18} /> New Ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <div key={ticket._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative flex flex-col">
              <span className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase rounded-full ${
                ticket.status === 'open' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                ticket.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {ticket.status}
              </span>
              <h3 className="text-lg font-bold text-gray-800 mb-2 truncate pr-24">{ticket.subject}</h3>
              <p className="text-sm text-gray-600 mb-4 flex-1">{ticket.description}</p>
              
              {ticket.responses && ticket.responses.length > 0 && (
                <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 max-h-32 overflow-y-auto w-full">
                  {ticket.responses.map((r, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-bold text-gray-700 text-xs uppercase">{r.senderRole}: </span>
                      <span className="text-gray-600">{r.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-50 pt-4 mb-3">
                <span>Priority: <span className="font-bold uppercase text-red-500">{ticket.priority}</span></span>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <div className="flex gap-2 items-center w-full mt-auto">
                  <div className="flex-1 relative">
                    <input 
                      value={replyText[ticket._id] || ''}
                      onChange={e => setReplyText({...replyText, [ticket._id]: e.target.value})}
                      placeholder="Type a reply..."
                      className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none pr-10 focus:ring-2 focus:ring-red-500"
                    />
                    <button onClick={() => {
                        if(replyText[ticket._id]) handleUpdate(ticket._id, { response: { message: replyText[ticket._id] }});
                      }} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800">
                      <MessageCircle size={16} />
                    </button>
                  </div>
                  {ticket.status === 'open' && (
                    <button onClick={() => handleUpdate(ticket._id, { status: 'in-progress' })} className="text-xs px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-medium hover:bg-blue-100">Progress</button>
                  )}
                  <button onClick={() => handleUpdate(ticket._id, { status: 'resolved' })} className="text-xs px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100">Resolve</button>
                </div>
              )}
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="col-span-full text-center p-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
              No support tickets found in DB.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Support;
