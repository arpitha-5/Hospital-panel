import { create } from 'zustand';
import api from '../services/api';
import { toast } from 'react-toastify';

export const useDashboardStore = create((set, get) => ({
  stats: null,
  appointments: [],
  trends: [],
  doctorPerformance: [],
  loading: false,

  fetchDashboardData: async () => {
    set({ loading: true });
    try {
      const [statsRes, appointmentsRes, trendsRes, perfRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-appointments'),
        api.get('/dashboard/trends?days=7'),
        api.get('/dashboard/doctor-performance')
      ]);

      set({
        stats: statsRes,
        appointments: appointmentsRes,
        trends: trendsRes.data || [],
        doctorPerformance: perfRes.data || [],
        loading: false
      });
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
      set({ loading: false });
    }
  },

  updateWaitTime: async (minutes) => {
    try {
      await api.patch('/hospitals/wait-time', { minutes: Number(minutes) });
      toast.success(`Wait time updated to ${minutes}m`);
      set((state) => ({ stats: { ...state.stats, avgWaitingTime: `${minutes}m` } }));
    } catch (error) {
      toast.error('Could not update wait time');
    }
  },

  updateAppointmentStatus: async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment marked as ${status}`);
      set((state) => ({
        appointments: state.appointments.map(appt =>
          appt._id === id ? { ...appt, status } : appt
        )
      }));
    } catch (error) {
      toast.error(error.message || 'Could not update appointment status');
    }
  }
}));
