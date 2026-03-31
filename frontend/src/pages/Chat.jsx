import React, { useEffect, useState, useRef } from 'react';
import { Send, Loader2, MessageSquareText } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const Chat = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  const roomId = user?.hospitalId || 'live_hospital_updates'; 
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chats/${roomId}`);
        setMessages(res);
      } catch (error) {
        toast.error('Could not load chat history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join_room', roomId);

    newSocket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => newSocket.disconnect();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('send_message', {
      roomId,
      senderId: user?._id || 'admin',
      message: newMessage
    });
    setNewMessage('');
  };

  return (
    <div className="animate-in fade-in duration-500 w-full h-[80vh] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
          <MessageSquareText className="text-red-600" size={32} />
          Hospital Live Chat
        </h2>
        <p className="text-gray-500 mt-2">Real-time support logic</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {loading ? (
             <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-red-600" size={32} /></div>
          ) : messages.length === 0 ? (
             <div className="flex items-center justify-center h-full text-gray-400">No messages yet. Start chatting!</div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id || !msg.senderId;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${isMe ? 'bg-red-600 text-white shadow-md shadow-red-200 rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                     {!isMe && msg.senderId?.name && (
                       <p className="text-xs font-semibold text-gray-500 mb-1">{msg.senderId.name}</p>
                     )}
                     <p>{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-4">
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
            <button type="submit" disabled={!newMessage.trim()} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl px-6 flex items-center justify-center transition-all shadow-md shadow-red-200">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
