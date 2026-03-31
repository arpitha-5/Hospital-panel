import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Search } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Verification = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, verified

  const fetchPatients = async () => {
    try {
      const res = await api.get('/manage/patients');
      setPatients(res.data || []);
    } catch (error) {
      toast.error('Failed to load patients for verification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleVerifyToggle = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/manage/patients/${id}/verify`, { isVerified: !currentStatus });
      setPatients(prev => prev.map(p => p._id === id ? { ...p, isVerified: !currentStatus } : p));
      toast.success(!currentStatus ? 'Patient verified successfully' : 'Patient verification revoked');
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true : filter === 'verified' ? p.isVerified : !p.isVerified;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-in fade-in duration-500 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-red-600" size={32} /> Patient Verification
          </h2>
          <p className="text-gray-500 mt-1">Authenticate patient identities to enable complete platform access.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['all', 'pending', 'verified'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors ${filter === f ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f} ({f === 'all' ? patients.length : patients.filter(p => f === 'verified' ? p.isVerified : !p.isVerified).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600" size={40} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/30">
                  <th className="py-4 pl-6">Patient Details</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.length > 0 ? filteredPatients.map(patient => (
                  <tr key={patient._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center font-bold text-sm rounded-full border ${patient.isVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {patient.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{patient.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{patient.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      {patient.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wide">
                          <CheckCircle2 size={14} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wide">
                          <Loader2 size={14} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      {patient.isVerified ? (
                         <button onClick={() => handleVerifyToggle(patient._id, patient.isVerified)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent">
                           Revoke
                         </button>
                      ) : (
                         <button onClick={() => handleVerifyToggle(patient._id, patient.isVerified)} className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-black rounded-xl shadow-md transition-all active:scale-95 border border-transparent">
                           Verify Access
                         </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-12 text-center text-gray-500">
                      No matching patients found.
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

export default Verification;
