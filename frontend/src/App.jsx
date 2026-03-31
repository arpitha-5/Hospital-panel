import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LayoutDashboard, Users, UserRound, LayoutList, CalendarCheck2, MessageSquareText, FileCheck, Search, Image as ImageIcon, HeadphonesIcon, Bell, Activity, Loader2, LogOut } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import api from './services/api';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Doctors from './pages/Doctors';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Staff from './pages/Staff';
import Support from './pages/Support';
import Insurance from './pages/Insurance';
import Placeholder from './pages/Placeholder';
import History from './pages/History';
import CalendarView from './pages/CalendarView';
import Media from './pages/Media';
import Services from './pages/Services';
import Verification from './pages/Verification';

const SidebarItem = ({ icon: Icon, text, to, active }) => (
  <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active ? 'bg-red-600 text-white shadow-lg shadow-red-200 cursor-default' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'} cursor-pointer mb-2`}>
    <Icon size={20} className={active ? 'text-white' : ''} />
    <span className="font-medium">{text}</span>
  </Link>
);

const DesktopSidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm z-10 transition-transform">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-red-600 p-2 rounded-xl">
          <Activity className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-800">
          HealthPass
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Overview</div>
        <SidebarItem icon={LayoutDashboard} text="Dashboard" to="/" active={path === '/'} />
        <SidebarItem icon={CalendarCheck2} text="Appointments" to="/appointments" active={path === '/appointments'} />
        <SidebarItem icon={ImageIcon} text="Calendar" to="/calendar" active={path === '/calendar'} />
        <SidebarItem icon={MessageSquareText} text="Live Chat" to="/chat" active={path === '/chat'} />
        
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-8 mb-4 px-4">Management</div>
        <SidebarItem icon={UserRound} text="Doctors" to="/doctors" active={path === '/doctors'} />
        <SidebarItem icon={Users} text="Staff Users" to="/staff" active={path === '/staff'} />
        <SidebarItem icon={LayoutList} text="Services" to="/services" active={path === '/services'} />
        <SidebarItem icon={ImageIcon} text="Media Gallery" to="/media" active={path === '/media'} />

        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-8 mb-4 px-4">Verification & Support</div>
        <SidebarItem icon={Search} text="Verify Patients" to="/verify" active={path === '/verify'} />
        <SidebarItem icon={FileCheck} text="Insurance Notes" to="/insurance" active={path === '/insurance'} />
        <SidebarItem icon={Activity} text="Visit History" to="/history" active={path === '/history'} />
        <SidebarItem icon={HeadphonesIcon} text="Support Center" to="/support" active={path === '/support'} />
      </div>

      <div className="p-4 border-t border-gray-100 pb-8 mt-auto space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center text-red-700 font-bold border-2 border-white shadow-sm">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

const NotificationBell = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data || []);
        setUnread(res.unreadCount || 0);
      } catch (_) {}
    };
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (_) {}
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors relative">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
            <span className="font-bold text-gray-800 text-sm">Notifications</span>
            {unread > 0 && <button onClick={markAllRead} className="text-xs text-red-600 hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No notifications</div>
            ) : notifications.slice(0, 10).map(n => (
              <div key={n._id} className={`px-4 py-3 text-sm ${n.isRead ? 'bg-white' : 'bg-red-50/40'}`}>
                <p className="font-medium text-gray-800">{n.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { user } = useAuthStore();
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm w-full">
      <div className="flex items-center gap-4">
        <span className="text-gray-400 font-medium text-sm">Welcome back, {user?.name || 'Admin'}!</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-medium border border-red-100 flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Hospital Active
        </div>
        <NotificationBell />
      </div>
    </header>
  );
};

const AppLayout = ({ children }) => (
  <div className="flex bg-gray-50 min-h-screen">
    <DesktopSidebar />
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full pb-10">
          {children}
        </div>
      </main>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, initializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/*" element={
          isAuthenticated ? (
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/staff" element={<Staff />} />
                <Route path="/support" element={<Support />} />
                <Route path="/insurance" element={<Insurance />} />
                <Route path="/history" element={<History />} />
                <Route path="/services" element={<Services />} />
                <Route path="/media" element={<Media />} />
                <Route path="/verify" element={<Verification />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
      <ToastContainer position="bottom-right" />
    </Router>
  );
}

export default App;
