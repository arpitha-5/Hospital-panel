import React, { useEffect, useState } from 'react';
import { FileCheck, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Insurance = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await api.get('/manage/insurance');
        setNotes(res);
      } catch (error) {
        toast.error('Failed to load insurance notes');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 w-full">
      <div className="flex items-center gap-3 mb-8">
        <FileCheck className="text-red-600" size={32} />
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Insurance Notes</h2>
          <p className="text-gray-500 mt-2">Manage live patient coverage validations.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Provider</th>
                <th className="px-6 py-4">Policy Number</th>
                <th className="px-6 py-4">Coverage</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notes.map(note => (
                <tr key={note._id} className="hover:bg-red-50/10 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800">{note.providerName}</td>
                  <td className="px-6 py-4 font-mono text-gray-600 text-sm">{note.policyNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{note.coverageType}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${note.status === 'verified' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {note.status}
                    </span>
                  </td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No insurance notes found in DB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Insurance;
