import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      try {
        const res = await api.get(`/dashboard/calendar?month=${year}-${month}`);
        setData(res.data || []);
      } catch (error) {
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 md:p-4 border-b border-r border-gray-100 bg-gray-50/50"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = data.find(d => d.date === dateStr);
      
      const hasBooked = dayData && dayData.booked > 0;
      const hasCancelled = dayData && dayData.cancelled > 0;
      const hasRescheduled = dayData && dayData.rescheduled > 0;

      days.push(
        <div key={i} className="min-h-[100px] p-2 md:p-3 border-b border-r border-gray-100 hover:bg-red-50/10 transition-colors bg-white relative group">
          <span className="text-sm font-semibold text-gray-500 mb-2 inline-block">{i}</span>
          
          {dayData && (
            <div className="space-y-1">
              {hasBooked && <div className="text-[10px] md:text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 truncate">Booked: {dayData.booked}</div>}
              {hasCancelled && <div className="text-[10px] md:text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 truncate">Cancelled: {dayData.cancelled}</div>}
              {hasRescheduled && <div className="text-[10px] md:text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 truncate">Rescheduled: {dayData.rescheduled}</div>}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <CalendarIcon className="text-red-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Calendar</h2>
            <p className="text-gray-500 mt-1 text-sm">Monthly overview of appointments</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={20} /></button>
          <span className="font-bold text-gray-700 w-32 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col items-center justify-center p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96 w-full"><Loader2 className="animate-spin text-red-600" size={48} /></div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-7 text-center border-b border-gray-100 bg-gray-50/80">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-t border-gray-100">
              {renderDays()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
