import React, { useEffect, useState } from 'react';
import { Loader2, Activity, CalendarDays, Users } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

const History = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/patient-visits?period=${period}`);
        setVisits(res.data || []);
      } catch (error) {
        toast.error('Failed to load patient visits');
      } finally {
        setLoading(false);
      }
    };
    fetchVisits();
  }, [period]);

  const totalVisits = visits.reduce((acc, v) => acc + v.totalVisits, 0);

  return (
    <div className="animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Activity className="text-red-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Visit History</h2>
            <p className="text-gray-500 mt-1 text-sm">Track patient visits and hospital traffic</p>
          </div>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${period === p ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center"><CalendarDays size={28} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Visits ({period})</p>
            <p className="text-3xl font-bold text-gray-800">{totalVisits}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={28} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Avg Visits per Period</p>
            <p className="text-3xl font-bold text-gray-800">
              {visits.length > 0 ? Math.round(totalVisits / visits.length) : 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Patient Traffic Trends</h3>
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-red-600" size={48} /></div>
        ) : visits.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={visits}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="totalVisits" fill="#dc2626" name="Total Visits" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uniquePatients" fill="#f87171" name="Unique Patients" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">No visit data available for this period.</div>
        )}
      </div>
    </div>
  );
};

export default History;
