import React, { useState, useRef, useEffect } from 'react';
import { Coordinates, MarkerData } from '../types';
import { MarkerPin } from './MarkerPin';

interface MapViewerProps {
  mapUrl: string | null;
  markers: MarkerData[];
  onMapClick: (coords: Coordinates) => void;
  onMarkerClick: (marker: MarkerData) => void;
  isEditing: boolean;
  scale: number;
}

export const MapViewer: React.FC<MapViewerProps> = ({ 
  mapUrl, 
  markers, 
  onMapClick, 
  onMarkerClick,
  isEditing,
  scale
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Handle map click to get percentage coordinates
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to 0-100
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    onMapClick({ x: constrainedX, y: constrainedY });
  };

  return (
    <div className="relative w-full h-full overflow-auto bg-slate-900/50 flex items-center justify-center p-8 cursor-grab active:cursor-grabbing">
      <div 
        className="relative shadow-2xl transition-transform duration-300 ease-out origin-center"
        style={{ 
          transform: `scale(${scale})`,
          minWidth: mapUrl ? 'auto' : '800px', 
          minHeight: mapUrl ? 'auto' : '600px'
        }}
        ref={containerRef}
        onClick={isEditing ? handleClick : undefined}
      >
        {mapUrl ? (
          <img 
            src={mapUrl} 
            alt="Interactive Map" 
            className={`max-w-none rounded-lg shadow-2xl border border-slate-700 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ display: 'block' }}
            onLoad={() => setLoaded(true)}
            draggable={false}
          />
        ) : (
          /* Default SVG Map Placeholder */
          <div className="w-[800px] h-[600px] bg-slate-800 rounded-lg border border-slate-700 map-grid-pattern relative overflow-hidden">
             {/* Decorative Elements imitating a blueprint */}
             <div className="absolute top-10 left-10 w-40 h-40 border-2 border-slate-600 rounded-lg opacity-30"></div>
             <div className="absolute bottom-20 right-20 w-60 h-40 border-2 border-slate-600 rounded-full opacity-30"></div>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-500 font-mono text-lg tracking-widest uppercase">
                NO MAP LOADED
                <div className="text-xs text-center opacity-50 mt-2">Upload an image to begin</div>
             </div>
             
             {/* Random Paths */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
               <path d="M100 100 Q 200 50 300 100 T 500 200 T 700 100" stroke="currentColor" fill="none" strokeWidth="2" className="text-slate-400" />
               <path d="M50 500 Q 150 400 250 500 T 450 450" stroke="currentColor" fill="none" strokeWidth="2" className="text-slate-400" />
               <circle cx="400" cy="300" r="50" stroke="currentColor" fill="none" strokeWidth="2" className="text-slate-400" />
             </svg>
          </div>
        )}

        {/* Markers Layer */}
        {markers.map(marker => (
          <MarkerPin 
            key={marker.id} 
            marker={marker} 
            onClick={onMarkerClick}
          />
        ))}

        {/* Edit Mode Overlay Hint */}
        {isEditing && (
          <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none border-2 border-indigo-500/50 rounded-lg animate-pulse z-0">
             <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                Editing Mode Active
             </div>
          </div>
        )}
        
        {/* Cursor Follower for Adding (Optional visual flair) */}
        {isEditing && (
           <div className="absolute inset-0 pointer-events-none z-0 hover:cursor-crosshair"></div>
        )}
      </div>
    </div>
  );
};