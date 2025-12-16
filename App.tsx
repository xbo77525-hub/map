import React, { useState, useEffect, useRef } from 'react';
import { Coordinates, MarkerData, MarkerType } from './types';
import { MapViewer } from './components/MapViewer';
import { AddMarkerModal } from './components/AddMarkerModal';
import { DetailPanel } from './components/DetailPanel';
import { Button } from './components/ui/Button';
import { Upload, ZoomIn, ZoomOut, Map as MapIcon, Edit3, Eye, Undo2, FileUp } from 'lucide-react';

// Default initial data
const INITIAL_MARKERS: MarkerData[] = [
  {
    id: '1',
    coords: { x: 45, y: 40 },
    title: 'Central Hub',
    description: 'The main gathering point of the facility. Access to all major wings.',
    type: MarkerType.PLACE,
    createdAt: Date.now()
  },
  {
    id: '2',
    coords: { x: 70, y: 65 },
    title: 'Danger Zone',
    description: 'Restricted area. Authorized personnel only.',
    type: MarkerType.WARNING,
    createdAt: Date.now()
  }
];

export default function App() {
  // State
  const [mapUrl, setMapUrl] = useState<string | null>(null); // Use null to show default SVG first
  const [markers, setMarkers] = useState<MarkerData[]>(INITIAL_MARKERS);
  const [history, setHistory] = useState<MarkerData[][]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Selection & Navigation
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [editingMarker, setEditingMarker] = useState<MarkerData | null>(null);
  const [activeMarker, setActiveMarker] = useState<MarkerData | null>(null);

  // Keyboard shortcut for Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z or Cmd+Z, and ensure we aren't in the middle of adding a marker (modal open)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !tempCoords && !editingMarker) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, tempCoords, editingMarker]);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMapUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setMapUrl(url);
    }
  };

  const handleMapClick = (coords: Coordinates) => {
    if (isEditing) {
      setTempCoords(coords);
      setEditingMarker(null); // Ensure we aren't editing another one
    } else {
      // Maybe deselect active marker if needed, or just zoom?
      // For now, doing nothing on empty click in view mode
    }
  };

  const handleMarkerSave = (data: { title: string; description: string; type: MarkerType; imageUrl: string }) => {
    if (!tempCoords && !editingMarker) return;
    
    // Save current state to history
    setHistory(prev => [...prev, markers]);

    // Use provided image, or existing if editing and not changing, or fallback to random
    const finalImageUrl = data.imageUrl.trim() || (editingMarker?.imageUrl || `https://picsum.photos/800/400?random=${Date.now()}`);

    if (editingMarker) {
      // Update existing
      setMarkers(prev => prev.map(m => 
        m.id === editingMarker.id 
          ? { ...m, ...data, imageUrl: finalImageUrl } 
          : m
      ));
      setEditingMarker(null);
    } else if (tempCoords) {
      // Create new
      const newMarker: MarkerData = {
        id: Date.now().toString(),
        coords: tempCoords,
        ...data,
        imageUrl: finalImageUrl,
        createdAt: Date.now()
      };
      setMarkers(prev => [...prev, newMarker]);
      setTempCoords(null);
    }
  };

  const handleMarkerDelete = () => {
    if (!editingMarker) return;
    
    setHistory(prev => [...prev, markers]);
    setMarkers(prev => prev.filter(m => m.id !== editingMarker.id));
    setEditingMarker(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    
    const previousMarkers = history[history.length - 1];
    setMarkers(previousMarkers);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleMarkerClick = (marker: MarkerData) => {
    if (isEditing) {
      setEditingMarker(marker);
      setTempCoords(null); // Ensure we aren't adding new
    } else {
      setActiveMarker(marker);
    }
  };

  // Render view logic
  if (activeMarker) {
    return (
      <DetailPanel 
        marker={activeMarker} 
        onBack={() => setActiveMarker(null)} 
      />
    );
  }

  return (
    <div 
      className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm border-4 border-indigo-500 border-dashed m-4 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900 p-6 rounded-xl shadow-2xl flex flex-col items-center animate-bounce">
            <FileUp size={48} className="text-indigo-400 mb-2" />
            <h2 className="text-2xl font-bold text-white">Drop Map Image Here</h2>
          </div>
        </div>
      )}

      {/* Header / Toolbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MapIcon size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Map Annotator <span className="text-indigo-500 text-xs uppercase ml-1 px-1.5 py-0.5 border border-indigo-500/30 rounded bg-indigo-500/10">Demo</span></h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 mr-4">
            <button 
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="w-12 text-center text-xs font-mono text-slate-400">{(scale * 100).toFixed(0)}%</span>
            <button 
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="hidden" 
            ref={fileInputRef}
          />
          
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Upload size={16}/>} 
            onClick={() => fileInputRef.current?.click()}
          >
            Import Map
          </Button>

          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo}
            disabled={history.length === 0}
            icon={<Undo2 size={16}/>}
            title="Undo last marker (Ctrl+Z)"
            className={history.length === 0 ? "opacity-30" : ""}
          >
            Undo
          </Button>

          <Button 
            variant={isEditing ? 'primary' : 'secondary'} 
            size="sm" 
            onClick={() => setIsEditing(!isEditing)}
            icon={isEditing ? <Eye size={16}/> : <Edit3 size={16}/>}
            className={isEditing ? "animate-pulse" : ""}
          >
            {isEditing ? 'Done Editing' : 'Edit Markers'}
          </Button>
        </div>
      </header>

      {/* Main Map Area */}
      <main className="flex-1 relative overflow-hidden bg-slate-950">
        <MapViewer 
          mapUrl={mapUrl}
          markers={markers}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          isEditing={isEditing}
          scale={scale}
        />
      </main>

      {/* Modals */}
      {(tempCoords || editingMarker) && (
        <AddMarkerModal 
          // Pass coords if adding, or existing coords if editing
          coords={tempCoords || (editingMarker ? editingMarker.coords : null)}
          initialData={editingMarker}
          onClose={() => {
            setTempCoords(null);
            setEditingMarker(null);
          }} 
          onSave={handleMarkerSave}
          onDelete={editingMarker ? handleMarkerDelete : undefined}
        />
      )}
    </div>
  );
}