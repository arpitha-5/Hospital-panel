import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('admin@citycare.com');
  const [password, setPassword] = useState('password123');
  const login = useAuthStore(state => state.login);
  const loading = useAuthStore(state => state.loading);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-8">
           <div className="bg-red-600 p-3 rounded-2xl mb-4 shadow-lg shadow-red-200">
             <Activity className="text-white" size={32} />
           </div>
           <h1 className="text-2xl font-bold text-gray-800">HealthPass Portal</h1>
           <p className="text-gray-500 text-sm mt-1">Sign in to manage operations</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-red-200 disabled:opacity-70 mt-4 flex justify-center"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
