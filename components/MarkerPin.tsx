import React from 'react';
import { MarkerData, MarkerType } from '../types';
import { Info, AlertTriangle, MapPin, ShoppingBag } from 'lucide-react';

interface MarkerPinProps {
  marker: MarkerData;
  onClick: (marker: MarkerData) => void;
  active?: boolean;
}

export const MarkerPin: React.FC<MarkerPinProps> = ({ marker, onClick, active }) => {
  const { coords, type } = marker;

  const getIcon = () => {
    switch (type) {
      case MarkerType.WARNING: return <AlertTriangle size={14} />;
      case MarkerType.SHOP: return <ShoppingBag size={14} />;
      case MarkerType.PLACE: return <MapPin size={14} />;
      default: return <Info size={14} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case MarkerType.WARNING: return "bg-amber-500 text-amber-950 shadow-amber-500/50";
      case MarkerType.SHOP: return "bg-emerald-500 text-emerald-950 shadow-emerald-500/50";
      case MarkerType.PLACE: return "bg-indigo-500 text-white shadow-indigo-500/50";
      default: return "bg-sky-500 text-sky-950 shadow-sky-500/50";
    }
  };

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 hover:z-20 transition-all duration-300"
      style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(marker);
      }}
    >
      {/* Pulse Effect */}
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${getColor().split(' ')[0]}`}></span>
      
      {/* Pin Body */}
      <div 
        className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-slate-900 transition-transform duration-200 ${active ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'} ${getColor()}`}
      >
        {getIcon()}
      </div>

      {/* Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-700 z-50">
        {marker.title}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 border-t border-l border-slate-700"></div>
      </div>
    </div>
  );
};