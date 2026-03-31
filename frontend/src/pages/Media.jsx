import React, { useEffect, useState, useRef } from 'react';
import { Image as ImageIcon, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const Media = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMedia = async () => {
    try {
      const res = await api.get('/media');
      setImages(res.data || []);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Only image files are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File size must be less than 5MB');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', file.name.split('.')[0]);

    setUploading(true);
    try {
      // Must not use default api interceptor headers since it's multipart
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      
      toast.success('Image uploaded successfully');
      setImages(prev => [data.data, ...prev]);
    } catch (error) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.delete(`/media/${id}`);
      setImages(prev => prev.filter(img => img._id !== id));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-red-600" size={32} />
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Media Gallery</h2>
            <p className="text-gray-500 mt-1 text-sm">Manage and maintain your hospital facility imagery</p>
          </div>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />} 
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(img => (
            <div key={img._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                <img 
                  src={img.url?.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${img.url}`} 
                  alt={img.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy"
                />
                <button 
                  onClick={() => handleDelete(img._id)}
                  className="absolute top-2 right-2 p-2 bg-white/90 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 truncate">{img.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(img.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100 border-dashed flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-3">
                <ImageIcon size={32} />
              </div>
              <p className="text-gray-500 font-medium">No media uploaded yet</p>
              <p className="text-gray-400 text-sm mt-1">Upload images to showcase your facility</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Media;
