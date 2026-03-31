import React, { useEffect, useState } from 'react';
import { Users, Clock, Calendar, CheckCircle2, MoreVertical, AlertTriangle, ArrowRight, Loader2, XCircle, UserX, RefreshCw } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-toastify';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { io } from 'socket.io-client';
import { Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const COLORS = ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6', '#64748b'];

const Dashboard = () => {
  const { stats, appointments, trends, doctorPerformance, loading, fetchDashboardData, updateWaitTime, updateAppointmentStatus } = useDashboardStore();
  const { user } = useAuthStore();
  const [newWaitTime, setNewWaitTime] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    if (user?.hospitalId) socket.emit('join_room', user.hospitalId);
    socket.on('booking_update', () => fetchDashboardData());
    socket.on('appointment_status_update', () => fetchDashboardData());
    return () => socket.disconnect();
  }, [fetchDashboardData, user?.hospitalId]);

  const handleUpdateWaitTime = (e) => {
    e.preventDefault();
    if (newWaitTime) { updateWaitTime(newWaitTime); setNewWaitTime(''); }
  };

  const handleExportReport = () => {
    if (!appointments || appointments.length === 0) return toast.error('No data to export');
    const header = ['Patient', 'Email', 'Doctor', 'Slot', 'Status'];
    const rows = appointments.map(a => [a.patientId?.name||'N/A', a.patientId?.email||'N/A', a.doctorId?.name||'N/A', a.timeSlot, a.status]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `Report_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  if (loading && !stats) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-red-600" size={48} /></div>;
  }

  const allTime = stats?.allTime || {};
  const todayData = stats?.today || {};
  const pieData = [
    { name: 'Completed', value: allTime.completed || 0 },
    { name: 'Confirmed', value: allTime.confirmed || 0 },
    { name: 'Cancelled', value: allTime.cancelled || 0 },
    { name: 'No-Show', value: allTime.noShow || 0 },
    { name: 'Rescheduled', value: allTime.rescheduled || 0 },
    { name: 'Pending', value: allTime.pending || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-in fade-in duration-500 w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard Analytics</h2>
          <p className="text-gray-500 mt-1 text-sm">Real-time metrics from MongoDB aggregation pipelines</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchDashboardData()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      {/* Row 1: Today Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        <StatCard title="Today Total" value={todayData.total || 0} icon={Calendar} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Completed" value={todayData.completed || 0} icon={CheckCircle2} colorClass="bg-green-50 text-green-600" />
        <StatCard title="Pending" value={todayData.pending || 0} icon={Clock} colorClass="bg-yellow-50 text-yellow-600" />
        <StatCard title="Cancelled" value={todayData.cancelled || 0} icon={XCircle} colorClass="bg-red-50 text-red-600" />
        <StatCard title="No-Show" value={todayData.noShow || 0} icon={UserX} colorClass="bg-purple-50 text-purple-600" />
        <StatCard title="Wait Time" value={stats?.avgWaitingTime || '0m'} icon={AlertTriangle} colorClass="bg-orange-50 text-orange-600" />
      </div>

      {/* Row 2: Trends + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">7-Day Appointment Trends</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Completed" />
              <Area type="monotone" dataKey="cancelled" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Cancelled" />
              <Area type="monotone" dataKey="noShow" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="No-Show" />
              <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Pending" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center">
          <h3 className="text-base font-semibold text-gray-800 mb-2 w-full text-left">All-Time Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2 text-2xl font-bold text-gray-800">{allTime.total || 0} <span className="text-sm font-normal text-gray-500">total bookings</span></div>
        </div>
      </div>

      {/* Row 3: Doctor Performance + Wait Time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Doctor Performance</h3>
          {doctorPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={doctorPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="noShow" fill="#8b5cf6" name="No-Show" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
        </div>

        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-sm relative overflow-hidden flex flex-col">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-slate-400" /> Hospital Traffic
          </h3>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative z-10 flex-1">
            <span className="text-sm font-medium text-slate-400">Current Wait Time</span>
            <div className="flex items-end gap-2 my-2">
              <span className="text-4xl font-bold">{String(stats?.avgWaitingTime || '0').replace('m','')}</span>
              <span className="text-slate-400 mb-1">mins</span>
            </div>
            <form onSubmit={handleUpdateWaitTime} className="flex gap-2 mt-4">
              <input type="number" value={newWaitTime} onChange={(e) => setNewWaitTime(e.target.value)} placeholder="Limit..."
                className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-md px-3 py-2 outline-none focus:border-blue-500" />
              <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 rounded-md hover:bg-blue-700 transition-colors">Set</button>
            </form>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm relative z-10">
            <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700"><div className="font-bold text-lg">{allTime.completed||0}</div><div className="text-slate-400 text-xs mt-1">Completed</div></div>
            <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700"><div className="font-bold text-lg">{allTime.cancelled||0}</div><div className="text-slate-400 text-xs mt-1">Cancelled</div></div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-semibold text-gray-800">Recent Appointments</h3>
          <a href="/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pl-2">Patient</th><th className="pb-3">Doctor</th><th className="pb-3">Slot</th><th className="pb-3">Status</th><th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments && appointments.length > 0 ? appointments.map((appt) => (
                <tr key={appt._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">{appt.patientId?.name?.charAt(0)||'P'}</div>
                      <div><p className="text-sm font-medium text-gray-900">{appt.patientId?.name}</p><p className="text-xs text-gray-500">{appt.patientId?.email}</p></div>
                    </div>
                  </td>
                  <td className="py-3"><div className="text-sm font-medium text-gray-900">{appt.doctorId?.name}</div><div className="text-xs text-gray-500">{appt.doctorId?.specialization}</div></td>
                  <td className="py-3 text-sm text-gray-600">{appt.timeSlot}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      appt.status==='confirmed'?'bg-green-50 text-green-700 border-green-200':
                      appt.status==='completed'?'bg-blue-50 text-blue-700 border-blue-200':
                      appt.status==='pending'?'bg-yellow-50 text-yellow-700 border-yellow-200':
                      appt.status==='cancelled'?'bg-red-50 text-red-700 border-red-200':
                      appt.status==='no-show'?'bg-purple-50 text-purple-700 border-purple-200':
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>{appt.status}</span>
                  </td>
                  <td className="py-3 text-right relative">
                    <button onClick={() => setOpenDropdown(openDropdown===appt._id?null:appt._id)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                      <MoreVertical size={16} />
                    </button>
                    {openDropdown===appt._id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 shadow-md rounded-lg flex flex-col overflow-hidden z-20 py-1 text-xs">
                        {!['confirmed','completed'].includes(appt.status) && <button onClick={()=>{updateAppointmentStatus(appt._id,'confirmed');setOpenDropdown(null);}} className="px-3 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors">Accept Book</button>}
                        {!['completed','cancelled'].includes(appt.status) && <button onClick={()=>{updateAppointmentStatus(appt._id,'completed');setOpenDropdown(null);}} className="px-3 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors">Complete</button>}
                        {!['cancelled','completed'].includes(appt.status) && <button onClick={()=>{updateAppointmentStatus(appt._id,'cancelled');setOpenDropdown(null);}} className="px-3 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors">Cancel</button>}
                        {!['no-show','completed','cancelled'].includes(appt.status) && <button onClick={()=>{updateAppointmentStatus(appt._id,'no-show');setOpenDropdown(null);}} className="px-3 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors">Mark No-Show</button>}
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="py-8 text-center text-gray-400 text-sm">No appointments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
