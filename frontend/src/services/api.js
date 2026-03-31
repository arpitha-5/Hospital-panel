import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend fully connected
});

// Interceptor for Auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handling Token Expirations Gracefully
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    // Only redirect to login for expired sessions, NOT for login/register failures
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.message || 'API Error');
  }
);

export default api;
