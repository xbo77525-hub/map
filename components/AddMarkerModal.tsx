import React, { useState, useEffect } from 'react';
import { Coordinates, MarkerData, MarkerType } from '../types';
import { X, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from './ui/Button';

interface AddMarkerModalProps {
  coords: Coordinates | null;
  initialData?: MarkerData | null;
  onClose: () => void;
  onSave: (data: { title: string; description: string; type: MarkerType; imageUrl: string }) => void;
  onDelete?: () => void;
}

export const AddMarkerModal: React.FC<AddMarkerModalProps> = ({ 
  coords, 
  initialData, 
  onClose, 
  onSave,
  onDelete 
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<MarkerType>(initialData?.type || MarkerType.INFO);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

  // If the component stays mounted but initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setType(initialData.type);
      setImageUrl(initialData.imageUrl || '');
    }
  }, [initialData]);

  if (!coords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, type, imageUrl });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to Base64 for persistence
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {initialData ? 'Edit Point' : 'Add New Point'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
            <div className="text-xs font-mono bg-slate-800 py-2 px-3 rounded border border-slate-700 text-slate-300">
              X: {coords.x.toFixed(2)}% &nbsp;|&nbsp; Y: {coords.y.toFixed(2)}%
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Main Entrance"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(MarkerType).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`text-xs font-semibold py-2 px-3 rounded-lg border transition ${type === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Image</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="Paste URL or upload file ->"
                />
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              </div>
              <label className="cursor-pointer group">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-2 rounded-lg transition h-full flex items-center justify-center w-12" title="Upload Local Image">
                  <Upload size={18} />
                </div>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">Leave empty for a random image.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition h-24 resize-none"
              placeholder="Short description for this location..."
            />
          </div>

          <div className="pt-2 flex items-center gap-3 shrink-0">
            {onDelete && (
              <Button type="button" variant="danger" onClick={handleDelete} className="mr-auto" icon={<Trash2 size={16}/>}>
                Delete
              </Button>
            )}
            <div className={`flex gap-3 ${!onDelete ? 'ml-auto' : ''}`}>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit">{initialData ? 'Save Changes' : 'Add Marker'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};