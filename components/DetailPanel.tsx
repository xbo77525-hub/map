import React from 'react';
import { MarkerData, MarkerType } from '../types';
import { ArrowLeft, Clock } from 'lucide-react';

interface DetailPanelProps {
  marker: MarkerData;
  onBack: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ marker, onBack }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 animate-in slide-in-from-right duration-300 overflow-y-auto">
      {/* Hero Image */}
      <div className="relative w-full h-64 md:h-[50vh] bg-slate-800 shrink-0">
        <img 
          src={marker.imageUrl || `https://picsum.photos/800/400?random=${marker.id}`} 
          alt={marker.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 p-2 bg-slate-900/50 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-slate-700 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="absolute bottom-6 left-6 right-6">
           <div className="flex items-center gap-2 mb-2">
             <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider 
                ${marker.type === MarkerType.WARNING ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
                  marker.type === MarkerType.SHOP ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  marker.type === MarkerType.PLACE ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                  'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
               {marker.type}
             </span>
             <span className="text-slate-400 text-xs flex items-center">
                <Clock size={12} className="mr-1" /> 
                Updated {new Date(marker.createdAt).toLocaleDateString()}
             </span>
           </div>
           <h1 className="text-4xl font-bold text-white shadow-black drop-shadow-lg">{marker.title}</h1>
        </div>
      </div>

      {/* Content - Only Description (Introduction) */}
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-slate-300 leading-relaxed font-light">
            {marker.description}
          </p>
        </div>
      </div>
    </div>
  );
};