import React, { useState, useEffect, useRef } from 'react';
import { Coordinates, MarkerData, MarkerType } from './types';
import { MapViewer } from './components/MapViewer';
import { AddMarkerModal } from './components/AddMarkerModal';
import { DetailPanel } from './components/DetailPanel';
import { Button } from './components/ui/Button';
import { Upload, ZoomIn, ZoomOut, Map as MapIcon, Edit3, Eye, Undo2, FileUp, Download, FolderOpen, Cloud, CheckCircle2, Trash2 } from 'lucide-react';

// --- IndexedDB Helpers ---
const DB_NAME = 'MapAnnotatorDB';
const STORE_NAME = 'appState';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveToDB = async (key: string, value: any) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getFromDB = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

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
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>(INITIAL_MARKERS);
  const [history, setHistory] = useState<MarkerData[][]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  const mapInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  
  // Selection & Navigation
  const [tempCoords, setTempCoords] = useState<Coordinates | null>(null);
  const [editingMarker, setEditingMarker] = useState<MarkerData | null>(null);
  const [activeMarker, setActiveMarker] = useState<MarkerData | null>(null);

  // --- Auto-Load Logic ---
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedMarkers = await getFromDB('markers');
        if (savedMarkers) setMarkers(savedMarkers);

        const savedMap = await getFromDB('mapUrl');
        if (savedMap) setMapUrl(savedMap);
      } catch (err) {
        console.error("Failed to load state from DB", err);
      }
    };
    loadState();
  }, []);

  // --- Auto-Save Logic ---
  useEffect(() => {
    const saveState = async () => {
      setSaveStatus('saving');
      try {
        await saveToDB('markers', markers);
        setTimeout(() => setSaveStatus('saved'), 500);
      } catch (err) {
        console.error("Auto-save markers failed", err);
      }
    };
    // Debounce slightly or just save on every change
    const timer = setTimeout(saveState, 500);
    return () => clearTimeout(timer);
  }, [markers]);

  useEffect(() => {
    if (mapUrl) {
      saveToDB('mapUrl', mapUrl).catch(err => console.error("Auto-save map failed", err));
    }
  }, [mapUrl]);


  // Keyboard shortcut for Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !tempCoords && !editingMarker) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, tempCoords, editingMarker]);

  // Handlers
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleMapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setMapUrl(base64);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
      } catch (e) {
        console.error("Map upload failed", e);
      }
    }
  };

  const handleDeleteMap = async () => {
    if (window.confirm("Are you sure you want to delete the map background? Markers will remain.")) {
      setMapUrl(null);
      await saveToDB('mapUrl', null);
      // Reset the file input reference so "New Map" is fresh
      if (mapInputRef.current) {
        mapInputRef.current.value = '';
      }
    }
  };

  const handleProjectLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        
        if (data.mapUrl) {
          setMapUrl(data.mapUrl);
          await saveToDB('mapUrl', data.mapUrl);
        }
        if (Array.isArray(data.markers)) {
          setMarkers(data.markers);
          await saveToDB('markers', data.markers);
        }
        
        setHistory([]);
        alert("Project loaded and saved to local storage!");
      } catch (err) {
        console.error(err);
        alert("Failed to load project. Invalid file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportProject = () => {
    try {
      const projectData = {
        version: "1.0",
        timestamp: Date.now(),
        mapUrl: mapUrl,
        markers: markers
      };

      const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `map-project-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export project.");
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
         const reader = new FileReader();
         reader.onload = async (event) => {
           try {
             const data = JSON.parse(event.target?.result as string);
             if (data.mapUrl) {
               setMapUrl(data.mapUrl);
               await saveToDB('mapUrl', data.mapUrl);
             }
             if (Array.isArray(data.markers)) {
               setMarkers(data.markers);
               await saveToDB('markers', data.markers);
             }
             setHistory([]);
           } catch (err) { alert("Invalid JSON"); }
         };
         reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        setMapUrl(base64);
      }
    }
  };

  const handleMapClick = (coords: Coordinates) => {
    if (isEditing) {
      setTempCoords(coords);
      setEditingMarker(null);
    }
  };

  const handleMarkerSave = (data: { title: string; description: string; type: MarkerType; imageUrl: string }) => {
    if (!tempCoords && !editingMarker) return;
    
    setHistory(prev => [...prev, markers]);

    const finalImageUrl = data.imageUrl.trim() || (editingMarker?.imageUrl || `https://picsum.photos/800/400?random=${Date.now()}`);

    if (editingMarker) {
      setMarkers(prev => prev.map(m => 
        m.id === editingMarker.id 
          ? { ...m, ...data, imageUrl: finalImageUrl } 
          : m
      ));
      setEditingMarker(null);
    } else if (tempCoords) {
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
      setTempCoords(null);
    } else {
      setActiveMarker(marker);
    }
  };

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
            <h2 className="text-2xl font-bold text-white">Drop Map or Project Here</h2>
          </div>
        </div>
      )}

      {/* Header / Toolbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MapIcon size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight hidden md:block">Map Annotator <span className="text-indigo-500 text-xs uppercase ml-1 px-1.5 py-0.5 border border-indigo-500/30 rounded bg-indigo-500/10">Demo</span></h1>
          
          {/* Auto-Save Status Indicator */}
          <div className="flex items-center gap-1.5 ml-2 md:ml-4 px-2 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
             {saveStatus === 'saving' ? (
                <>
                  <Cloud size={14} className="text-slate-400 animate-pulse" />
                  <span className="text-xs text-slate-400">Saving...</span>
                </>
             ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs text-emerald-500 font-medium">Auto-saved</span>
                </>
             ) : (
                <>
                  <Cloud size={14} className="text-slate-500" />
                  <span className="text-xs text-slate-500">Ready</span>
                </>
             )}
          </div>
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
            onChange={handleMapUpload} 
            className="hidden" 
            ref={mapInputRef}
          />

          <input 
            type="file" 
            accept=".json,application/json" 
            onChange={handleProjectLoad} 
            className="hidden" 
            ref={projectInputRef}
          />
          
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mr-2">
            <Button 
               variant="ghost" 
               size="sm" 
               icon={<FolderOpen size={16}/>} 
               onClick={() => projectInputRef.current?.click()}
               className="rounded-none border-r border-slate-700 hover:bg-slate-700"
               title="Load Project (.json)"
            >
              Import
            </Button>
            <Button 
               variant="ghost" 
               size="sm" 
               icon={<Download size={16}/>} 
               onClick={handleExportProject}
               className="rounded-none hover:bg-slate-700"
               title="Export Project Backup (.json)"
            >
              Export
            </Button>
          </div>

          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Upload size={16}/>} 
            onClick={() => mapInputRef.current?.click()}
          >
            New Map
          </Button>
          
          {mapUrl && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={16}/>}
              onClick={handleDeleteMap}
              title="Delete current map background"
            >
              Delete
            </Button>
          )}

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