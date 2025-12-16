import React, { useState } from 'react';
import { MarkerData, MarkerType } from '../types';
import { X, Clock, Calendar, Maximize2 } from 'lucide-react';

interface DetailPanelProps {
  marker: MarkerData;
  onBack: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ marker, onBack }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const imageUrl = marker.imageUrl || `https://picsum.photos/800/400?random=${marker.id}`;

  return (
    <>
      {/* Main Detail Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
        onClick={onBack}
      >
        <div 
          className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Image Area */}
          <div 
            className="relative w-full h-64 bg-slate-800 shrink-0 group cursor-zoom-in overflow-hidden"
            onClick={() => setIsLightboxOpen(true)}
            title="Click to view full image"
          >
            <img 
              src={imageUrl} 
              alt={marker.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90 pointer-events-none"></div>
            
            {/* Maximize Hint Icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/30 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20 pointer-events-none">
                <Maximize2 className="text-white" size={24} />
            </div>

            {/* Close Button (top right) - Stops propagation to prevent opening lightbox when closing */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-slate-800 text-white rounded-full backdrop-blur-md border border-white/10 transition-all z-10"
              title="Close details"
            >
              <X size={20} />
            </button>
            
            <div className="absolute bottom-4 left-6 right-6 pointer-events-none">
               <div className="flex items-center gap-2 mb-2">
                 <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm
                    ${marker.type === MarkerType.WARNING ? 'bg-amber-500 text-amber-950' : 
                      marker.type === MarkerType.SHOP ? 'bg-emerald-500 text-emerald-950' :
                      marker.type === MarkerType.PLACE ? 'bg-indigo-500 text-white' :
                      'bg-sky-500 text-sky-950'
                    }`}>
                   {marker.type}
                 </span>
               </div>
               <h1 className="text-3xl font-bold text-white shadow-black drop-shadow-md tracking-tight">{marker.title}</h1>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 border-b border-slate-800 pb-4">
               <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Created {new Date(marker.createdAt).toLocaleDateString()}</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>{new Date(marker.createdAt).toLocaleTimeString()}</span>
               </div>
            </div>

            <div className="prose prose-invert prose-sm md:prose-base max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {marker.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button for Lightbox */}
          <button 
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10 backdrop-blur-sm"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X size={24} />
          </button>
          
          <img 
            src={imageUrl} 
            alt={marker.title}
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
};