import { create } from 'zustand';
import api from '../services/api';
import { toast } from 'react-toastify';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  initializing: true,

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ initializing: false, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, initializing: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, initializing: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ loading: true });
      const res = await api.post('/auth/login', { email, password });
      // res = { success, data: { ...user, token } }
      localStorage.setItem('token', res.data.token);
      set({ user: res.data, token: res.data.token, isAuthenticated: true, loading: false });
      toast.success('Logged in successfully!');
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error);
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
