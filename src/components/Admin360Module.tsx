import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  RotateCcw, Search, ArrowLeft, CheckCircle2, MapPin, Image as ImageIcon,
  Settings, Layers, Plus, PanelRightClose, PanelRightOpen, Trash2
} from 'lucide-react';
import { Car as CarType, Vehicle360, DamageMarker, DamageCategory } from '../types';
import { useVehicle360 } from '../hooks/useVehicle360';
import { vehicle360Service } from '../services/vehicle360.service';
import { Viewer360Stage } from './360/Viewer360Stage';
import { Timeline360 } from './360/Timeline360';
import { Toolbar360 } from './360/Toolbar360';
import { HotspotList } from './360/HotspotList';
import { HotspotInspector } from './360/HotspotInspector';
import { FramesManager } from './360/FramesManager';

interface Admin360ModuleProps {
  cars: CarType[];
}

export default function Admin360Module({ cars }: Admin360ModuleProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<CarType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Todos');

  // Load the 360 hook for the selected vehicle
  const {
    loading,
    project,
    markers,
    saveProject,
    saveMarker,
    deleteMarker,
    deleteProject,
    refresh
  } = useVehicle360(selectedVehicle ? selectedVehicle.id : null);

  const brands = useMemo(() => {
    const list = new Set(cars.map(c => c.brand));
    return ['Todos', ...Array.from(list)];
  }, [cars]);

  // Load vehicle 360 status mapping for list view
  const [statuses, setStatuses] = useState<Record<string, Vehicle360['status']>>({});

  useEffect(() => {
    const fetchStatuses = async () => {
      const statsMap: Record<string, Vehicle360['status']> = {};
      for (const car of cars) {
        try {
          const proj = await vehicle360Service.get360ByVehicleId(car.id);
          statsMap[car.id] = proj ? proj.status : 'draft';
        } catch {
          statsMap[car.id] = 'draft';
        }
      }
      setStatuses(statsMap);
    };
    if (cars.length > 0) {
      fetchStatuses();
    }
  }, [cars, project]);

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = 
        car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.version.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = selectedBrand === 'Todos' || car.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [cars, searchQuery, selectedBrand]);

  if (selectedVehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedVehicle(null);
            refresh();
          }}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all cursor-pointer shadow-sm hover:shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Veículos</span>
        </button>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Editor Profissional de Hotspots 360°</span>
              <h3 className="font-extrabold text-2xl text-slate-900 mt-1">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {selectedVehicle.version} • {selectedVehicle.year} • {selectedVehicle.color}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                project?.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : project?.status === 'processing'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : 'bg-slate-50 text-slate-600 border-slate-100'
              }`}>
                {project ? (project.status === 'completed' ? 'Concluído' : project.status === 'processing' ? 'Em andamento' : 'Não iniciado') : 'Não iniciado'}
              </span>
            </div>
          </div>

          <Editor360
            vehicle={selectedVehicle}
            project={project}
            markers={markers}
            saveProject={saveProject}
            saveMarker={saveMarker}
            deleteMarker={deleteMarker}
            deleteProject={deleteProject}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar veículo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Marca:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
            >
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map(car => {
            const status = statuses[car.id] || 'draft';

            return (
              <div 
                key={car.id} 
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img 
                    src={car.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'} 
                    alt={car.model} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border backdrop-blur-md ${
                      status === 'completed'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                        : status === 'processing'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                        : 'bg-slate-950/80 text-slate-300 border-slate-800/50'
                    }`}>
                      {status === 'completed' ? 'Concluído' : status === 'processing' ? 'Em andamento' : 'Não iniciado'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-lg text-slate-900 leading-tight">
                      {car.brand} <span className="text-red-600">{car.model}</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">{car.version}</p>
                    <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-500">
                      <span>Ano: {car.year}</span>
                      <span>•</span>
                      <span>KM: {car.km.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-slate-400 block font-medium">Visualizador 360°</span>
                      <span className={`font-bold block ${status !== 'draft' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {status !== 'draft' ? 'Configurado' : 'Não iniciado'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(car)}
                      className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Configurar 360°</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCars.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 font-bold">
              Nenhum veículo encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Wizard360 } from './360/Wizard360';

/* ==========================================
   EDITOR 360 MAIN WRAPPER
   ========================================== */
interface Editor360Props {
  vehicle: CarType;
  project: Vehicle360 | null;
  markers: DamageMarker[];
  saveProject: (framesCount: number, images: string[], status: Vehicle360['status']) => Promise<any>;
  saveMarker: (marker: Omit<DamageMarker, 'id' | 'vehicleId' | 'createdAt'> & { id?: string }) => Promise<any>;
  deleteMarker: (markerId: string) => Promise<any>;
  deleteProject: () => Promise<any>;
  loading: boolean;
}

function Editor360({
  vehicle,
  project,
  markers,
  saveProject,
  saveMarker,
  deleteMarker,
  deleteProject,
  loading
}: Editor360Props) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<DamageMarker | null>(null);

  // Edit Mode & Placement state
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  const [addMarkerMode, setAddMarkerMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Orientation Config Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [orientationConfig, setOrientationConfig] = useState<{ front?: number; right?: number; rear?: number; left?: number }>(() => {
    try {
      const saved = localStorage.getItem(`360_orientation_${vehicle.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSaveOrientation = (config: { front?: number; right?: number; rear?: number; left?: number }) => {
    setOrientationConfig(config);
    try {
      localStorage.setItem(`360_orientation_${vehicle.id}`, JSON.stringify(config));
    } catch (e) {
      console.error('Error storing orientation in localStorage:', e);
    }
  };

  // Layout Side Panel State (Collapsible)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState<'hotspots' | 'inspector' | 'frames' | 'config'>('hotspots');

  // Fullscreen Container Ref
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Show Toast Message
  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 2200);
  };

  const frames = useMemo(() => project?.images || [], [project]);
  const totalFramesConfig = project?.framesCount || 36;

  // Auto-rotation effect (Pause when editing)
  useEffect(() => {
    let interval: any;
    if (isPlaying && frames.length > 0 && !isEditModeActive) {
      interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % frames.length);
      }, 120);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames, isEditModeActive]);

  // Keyboard navigation (Arrow keys ← / →)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (frames.length === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentFrame(prev => (prev - 1 + frames.length) % frames.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentFrame(prev => (prev + 1) % frames.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames]);

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!editorContainerRef.current) return;

    if (!document.fullscreenElement) {
      editorContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Save specific frame position keyframe
  const handleSetFramePosition = async (x: number, y: number) => {
    if (addMarkerMode || !selectedMarker) {
      // Create new hotspot at clicked position
      const newTitle = `Avaria #${markers.length + 1}`;
      console.log('Hotspot criado:', { title: newTitle, frame: currentFrame, posX: x, posY: y });

      try {
        const saved = await saveMarker({
          title: newTitle,
          description: '',
          category: 'Arranhão',
          damageImages: [],
          frameIndex: currentFrame,
          posX: x,
          posY: y,
          framePositions: {
            [currentFrame]: { posX: x, posY: y, isConfirmed: true }
          }
        });

        setSelectedMarker(saved);
        setAddMarkerMode(false);
        setIsEditModeActive(true);
        setActiveSideTab('inspector');
        showToast('✓ Hotspot criado');
      } catch (err) {
        console.error('Error creating new marker:', err);
      }
      return;
    }

    // Updating existing marker position
    const existingPositions = selectedMarker.framePositions || {
      [selectedMarker.frameIndex]: { posX: selectedMarker.posX, posY: selectedMarker.posY }
    };

    const updatedPositions = {
      ...existingPositions,
      [currentFrame]: { posX: x, posY: y, isConfirmed: true }
    };

    try {
      const saved = await saveMarker({
        id: selectedMarker.id,
        title: selectedMarker.title,
        description: selectedMarker.description,
        category: selectedMarker.category,
        damageImages: selectedMarker.damageImages,
        frameIndex: selectedMarker.frameIndex,
        posX: x,
        posY: y,
        framePositions: updatedPositions
      });

      setSelectedMarker(saved);
      showToast(`✓ Hotspot salvo com sucesso`);
    } catch (err) {
      console.error('Error saving frame position:', err);
    }
  };

  // Remove keyframe
  const handleRemoveKeyframe = async (frameIdxToRemove: number) => {
    if (!selectedMarker) return;

    const existingPositions = { ...(selectedMarker.framePositions || {}) };
    delete existingPositions[frameIdxToRemove];

    try {
      const saved = await saveMarker({
        id: selectedMarker.id,
        title: selectedMarker.title,
        description: selectedMarker.description,
        category: selectedMarker.category,
        damageImages: selectedMarker.damageImages,
        frameIndex: selectedMarker.frameIndex,
        posX: selectedMarker.posX,
        posY: selectedMarker.posY,
        framePositions: existingPositions
      });
      setSelectedMarker(saved);
      showToast(`✓ Keyframe F${frameIdxToRemove + 1} removido`);
    } catch (err) {
      console.error('Error removing keyframe:', err);
    }
  };

  // Duplicate Marker
  const handleDuplicateMarker = async (markerToDup: DamageMarker) => {
    try {
      const newTitle = `${markerToDup.title} (Cópia)`;
      const saved = await saveMarker({
        title: newTitle,
        description: markerToDup.description,
        category: markerToDup.category,
        damageImages: markerToDup.damageImages || [],
        frameIndex: currentFrame,
        posX: markerToDup.posX,
        posY: markerToDup.posY,
        framePositions: markerToDup.framePositions
      });

      setSelectedMarker(saved);
      setActiveSideTab('inspector');
      showToast('✓ Hotspot duplicado com sucesso!');
    } catch (err) {
      console.error('Error duplicating marker:', err);
    }
  };

  // Delete Marker
  const handleDeleteMarker = async (markerId: string) => {
    try {
      await deleteMarker(markerId);
      setSelectedMarker(null);
      setActiveSideTab('hotspots');
      showToast('✓ Hotspot excluído!');
    } catch (err) {
      console.error('Error deleting marker:', err);
    }
  };

  // Exit edit mode smoothly resets zoom to 100%
  const handleExitEditMode = () => {
    setIsEditModeActive(false);
    setAddMarkerMode(false);
    setZoomLevel(1);
    showToast('✓ Edição concluída!');
  };

  return (
    <div 
      ref={editorContainerRef}
      className={`space-y-4 bg-slate-950 p-4 sm:p-6 rounded-3xl transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''}`}
    >
      {/* MAIN 75% / 25% GRID LAYOUT */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* VISUALIZER STAGE AREA (~75% Width when open, 100% when collapsed) */}
        <div className={`space-y-4 transition-all duration-300 ${isSidebarOpen ? 'col-span-12 lg:col-span-9' : 'col-span-12'}`}>
          
          {/* Main 360 Viewport Stage */}
          <Viewer360Stage
            frames={frames}
            currentFrame={currentFrame}
            totalFrames={frames.length}
            markers={markers}
            selectedMarker={selectedMarker}
            isEditModeActive={isEditModeActive}
            addMarkerMode={addMarkerMode}
            zoomLevel={zoomLevel}
            isFullscreen={isFullscreen}
            saveToast={saveToast}
            orientationConfig={orientationConfig}
            onSelectFrame={setCurrentFrame}
            onSelectMarker={(m) => {
              setSelectedMarker(m);
              setActiveSideTab('inspector');
            }}
            onSetFramePosition={handleSetFramePosition}
            onExitEditMode={handleExitEditMode}
            onChangeZoom={setZoomLevel}
          />

          {/* Timeline Strip */}
          <Timeline360
            totalFrames={frames.length}
            currentFrame={currentFrame}
            selectedMarker={selectedMarker}
            onSelectFrame={setCurrentFrame}
            onRemoveKeyframe={handleRemoveKeyframe}
          />

          {/* Bottom Toolbar */}
          <Toolbar360
            currentFrame={currentFrame}
            totalFrames={frames.length}
            isPlaying={isPlaying}
            zoomLevel={zoomLevel}
            isFullscreen={isFullscreen}
            isSidebarOpen={isSidebarOpen}
            isEditModeActive={isEditModeActive}
            saveToast={saveToast}
            onPrevFrame={() => setCurrentFrame(prev => (prev - 1 + frames.length) % frames.length)}
            onNextFrame={() => setCurrentFrame(prev => (prev + 1) % frames.length)}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onChangeZoom={setZoomLevel}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onNewHotspot={() => {
              console.log('Modo de edição iniciado');
              setAddMarkerMode(true);
              setIsEditModeActive(true);
              setSelectedMarker(null);
              showToast('🎯 Clique na imagem para posicionar o hotspot');
            }}
          />
        </div>

        {/* SIDE PANEL (~25% Width, Collapsible) */}
        {isSidebarOpen && (
          <div className="col-span-12 lg:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col min-h-[580px] max-h-[720px] transition-all">
            
            {/* Header Tabs */}
            <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500">
              <button
                type="button"
                onClick={() => setActiveSideTab('hotspots')}
                className={`py-3 text-center transition-colors cursor-pointer border-b-2 flex flex-col items-center gap-1 ${
                  activeSideTab === 'hotspots' ? 'text-red-600 border-red-600 bg-white font-extrabold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Hotspots</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSideTab('inspector')}
                disabled={!selectedMarker}
                className={`py-3 text-center transition-colors cursor-pointer border-b-2 flex flex-col items-center gap-1 disabled:opacity-40 ${
                  activeSideTab === 'inspector' ? 'text-red-600 border-red-600 bg-white font-extrabold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSideTab('frames')}
                className={`py-3 text-center transition-colors cursor-pointer border-b-2 flex flex-col items-center gap-1 ${
                  activeSideTab === 'frames' ? 'text-red-600 border-red-600 bg-white font-extrabold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Frames</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSideTab('config')}
                className={`py-3 text-center transition-colors cursor-pointer border-b-2 flex flex-col items-center gap-1 ${
                  activeSideTab === 'config' ? 'text-red-600 border-red-600 bg-white font-extrabold' : 'border-transparent hover:text-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 flex-1 overflow-y-auto">
              
              {/* TAB 1: HOTSPOTS LIST */}
              {activeSideTab === 'hotspots' && (
                <HotspotList
                  markers={markers}
                  selectedMarker={selectedMarker}
                  currentFrame={currentFrame}
                  totalFrames={frames.length}
                  onSelectMarker={(m) => {
                    setSelectedMarker(m);
                    setActiveSideTab('inspector');
                  }}
                  onNewHotspot={() => {
                    setAddMarkerMode(true);
                    setIsEditModeActive(true);
                    setSelectedMarker(null);
                    showToast('🎯 Clique na imagem para posicionar');
                  }}
                />
              )}

              {/* TAB 2: INSPECTOR */}
              {activeSideTab === 'inspector' && selectedMarker && (
                <HotspotInspector
                  marker={selectedMarker}
                  vehicleId={vehicle.id}
                  currentFrame={currentFrame}
                  totalFrames={frames.length}
                  onClose={() => setActiveSideTab('hotspots')}
                  onEditPosition={() => {
                    setIsEditModeActive(true);
                    showToast('🎯 Ajuste a posição do hotspot');
                  }}
                  onSaveMarker={async (updated) => {
                    const saved = await saveMarker(updated);
                    setSelectedMarker(saved);
                  }}
                  onDeleteMarker={handleDeleteMarker}
                  onDuplicateMarker={handleDuplicateMarker}
                  onShowToast={showToast}
                />
              )}

              {/* TAB 3: FRAMES MANAGER */}
              {activeSideTab === 'frames' && (
                <FramesManager
                  vehicleId={vehicle.id}
                  frames={frames}
                  totalFramesConfig={totalFramesConfig}
                  currentFrame={currentFrame}
                  onSelectFrame={setCurrentFrame}
                  onSaveFrames={async (newFrames) => {
                    await saveProject(totalFramesConfig, newFrames, project?.status || 'processing');
                  }}
                  onShowToast={showToast}
                />
              )}

              {/* TAB 4: ADJUSTMENTS & SETTINGS */}
              {activeSideTab === 'config' && (
                <div className="space-y-5 text-xs">
                  <h4 className="font-extrabold text-slate-900 text-sm">Configurações do Giro 360°</h4>
                  
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Assistente de Configuração</label>
                      <button
                        type="button"
                        onClick={() => setIsWizardOpen(true)}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold cursor-pointer transition-all shadow flex items-center justify-center gap-2"
                      >
                        <Compass className="w-4 h-4 text-red-500" />
                        <span>Abrir Assistente 360° (3 Etapas)</span>
                      </button>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Quantidade de Frames Esperados</label>
                      <select
                        value={totalFramesConfig}
                        onChange={async (e) => {
                          const val = Number(e.target.value);
                          await saveProject(val, frames, project?.status || 'draft');
                          showToast('✓ Configuração atualizada');
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value={24}>24 Frames</option>
                        <option value={36}>36 Frames (Padrão)</option>
                        <option value={48}>48 Frames (Alta precisão)</option>
                        <option value={72}>72 Frames (Ultra HD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Status do Giro 360°</label>
                      <select
                        value={project?.status || 'draft'}
                        onChange={async (e) => {
                          const val = e.target.value as Vehicle360['status'];
                          await saveProject(totalFramesConfig, frames, val);
                          showToast('✓ Status do projeto salvo');
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="draft">Rascunho (Não publicado)</option>
                        <option value="processing">Em Andamento</option>
                        <option value="completed">Concluído & Publicado</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Atenção: Deseja realmente excluir todo o projeto 360° e seus hotspots? Esta ação é irreversível.')) {
                          await deleteProject();
                          setSelectedMarker(null);
                          showToast('✓ Projeto 360° excluído');
                        }
                      }}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold border border-red-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Projeto 360° Inteiro</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 360 Orientation & Setup Wizard Modal */}
      <Wizard360
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        frames={frames}
        totalFramesConfig={totalFramesConfig}
        currentFrame={currentFrame}
        onSelectFrame={setCurrentFrame}
        orientationConfig={orientationConfig}
        onSaveOrientation={handleSaveOrientation}
        onFinish={() => {
          showToast('✓ Projeto 360° configurado!');
        }}
      />
    </div>
  );
}
