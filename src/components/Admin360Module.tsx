import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  RotateCcw, Upload, Plus, Trash2, Settings, Image as ImageIcon,
  ChevronLeft, ChevronRight, X, Play, Pause, Loader2, CheckCircle2, 
  AlertCircle, MapPin, Eye, Search, Layers, Grid, List, ArrowLeft, Move,
  Check, Sparkles
} from 'lucide-react';
import { Car as CarType, Vehicle360, DamageMarker, DamageCategory } from '../types';
import { useVehicle360 } from '../hooks/useVehicle360';
import { vehicle360Service } from '../services/vehicle360.service';
import { 
  getMarkerPositionForFrame, 
  getMarkerTimelineStatus, 
  propagateMarkerPositions 
} from '../utils/markerUtils';

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
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Módulo Inspetor 360°</span>
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
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 transition-all"
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
                      <span className="text-slate-400 block font-medium">Visualização 360°</span>
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

/* ==========================================
   EDITOR 360 SUB-COMPONENT
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
  const [activeTab, setActiveTab] = useState<'imagens' | 'marcadores' | 'configuracoes'>('imagens');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [addMarkerMode, setAddMarkerMode] = useState(false);

  // Precision Edit Mode & Zoom state
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isDraggingMarkerOnCanvas, setIsDraggingMarkerOnCanvas] = useState(false);

  // Images state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Selected marker state for details view/edit
  const [selectedMarker, setSelectedMarker] = useState<DamageMarker | null>(null);

  // Hotspot Marker placement state
  const [newMarkerPos, setNewMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [markerTitle, setMarkerTitle] = useState('');
  const [markerDescription, setMarkerDescription] = useState('');
  const [markerCategory, setMarkerCategory] = useState<DamageCategory>('Arranhão');
  const [damageImages, setDamageImages] = useState<string[]>([]);
  const [damageUploading, setDamageUploading] = useState(false);

  // Settings state
  const [framesCount, setFramesCount] = useState<number>(36);
  const [projectStatus, setProjectStatus] = useState<Vehicle360['status']>('processing');

  // Drag interaction refs for 360 viewer rotation
  const viewerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startFrame = useRef(0);

  // Show Toast feedback
  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 2200);
  };

  // Keyboard navigation for precision frame stepping (← / → keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!project?.images || project.images.length === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentFrame(prev => (prev - 1 + project.images.length) % project.images.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentFrame(prev => (prev + 1) % project.images.length);
      } else if (e.key === 'Escape') {
        if (isEditModeActive) {
          setIsEditModeActive(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, isEditModeActive]);

  // Auto-play effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && project?.images && project.images.length > 0) {
      interval = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % project.images.length);
      }, 120);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project]);

  // Pause auto-rotation when entering edit mode
  useEffect(() => {
    if (isEditModeActive) {
      setIsPlaying(false);
    }
  }, [isEditModeActive]);

  // Handle syncing settings fields on load
  useEffect(() => {
    if (project) {
      setFramesCount(project.framesCount);
      setProjectStatus(project.status);
    }
  }, [project]);

  const frames = useMemo(() => {
    return project?.images || [];
  }, [project]);

  // Handle dragging rotation (Strictly disabled during Edit Mode or Marker Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (addMarkerMode || isEditModeActive || isDraggingMarkerOnCanvas || frames.length === 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startFrame.current = currentFrame;
    setIsPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMarkerOnCanvas) return;
    if (!isDragging.current || frames.length === 0) return;
    const deltaX = e.clientX - startX.current;
    const framesDiff = Math.floor(deltaX / 15);
    let targetFrame = (startFrame.current - framesDiff) % frames.length;
    if (targetFrame < 0) {
      targetFrame += frames.length;
    }
    setCurrentFrame(targetFrame);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Handle clicking canvas for marker placement or re-positioning in Edit Mode
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (frames.length === 0 || isDraggingMarkerOnCanvas) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    if (addMarkerMode) {
      setNewMarkerPos({ x, y });
      setAddMarkerMode(false);
      setSelectedMarker(null);
      setIsEditModeActive(true);
      showToast(`🎯 Ponto selecionado para o Frame ${currentFrame + 1}`);
      return;
    }

    if (isEditModeActive && selectedMarker) {
      await handleSetFramePosition(x, y);
      showToast(`✓ Frame ${currentFrame + 1} gravado com sucesso!`);
    }
  };

  // Save specific frame position keyframe
  const handleSetFramePosition = async (x: number, y: number) => {
    if (!selectedMarker) return;

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
        vehicleId: selectedMarker.vehicleId,
        title: selectedMarker.title,
        description: selectedMarker.description,
        category: selectedMarker.category,
        damageImages: selectedMarker.damageImages,
        frameIndex: selectedMarker.frameIndex,
        posX: selectedMarker.posX,
        posY: selectedMarker.posY,
        framePositions: updatedPositions
      });
      setSelectedMarker(saved);
    } catch (err) {
      console.error('Error saving frame position:', err);
    }
  };

  // Remove keyframe position
  const handleRemoveFramePosition = async (frameIdxToRemove: number) => {
    if (!selectedMarker) return;

    const existingPositions = { ...(selectedMarker.framePositions || {}) };
    delete existingPositions[frameIdxToRemove];

    try {
      const saved = await saveMarker({
        id: selectedMarker.id,
        vehicleId: selectedMarker.vehicleId,
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
      showToast(`✓ Keyframe do Frame ${frameIdxToRemove + 1} removido`);
    } catch (err) {
      console.error('Error removing frame position:', err);
    }
  };

  // Handle Propagating position forward
  const handlePropagateForward = async (count: number | 'end') => {
    if (!selectedMarker) return;
    const updatedPositions = propagateMarkerPositions(selectedMarker, currentFrame, count, frames.length);
    try {
      const saved = await saveMarker({
        id: selectedMarker.id,
        vehicleId: selectedMarker.vehicleId,
        title: selectedMarker.title,
        description: selectedMarker.description,
        category: selectedMarker.category,
        damageImages: selectedMarker.damageImages,
        frameIndex: selectedMarker.frameIndex,
        posX: selectedMarker.posX,
        posY: selectedMarker.posY,
        framePositions: updatedPositions
      });
      setSelectedMarker(saved);
      showToast(count === 'end' ? '✓ Posição propagada até o final!' : `✓ Posição propagada por +${count} frames!`);
    } catch (err) {
      console.error('Error propagating positions:', err);
    }
  };

  // File Upload drag/drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []) as File[];
    if (files.length > 0) {
      await processUploads(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      await processUploads(files);
    }
  };

  const processUploads = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(1);
    const uploadedUrls: string[] = [];

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setIsUploading(false);
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const url = await vehicle360Service.upload360Frame(vehicle.id, file);
        uploadedUrls.push(url);
        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      const currentImages = [...frames, ...uploadedUrls];
      await saveProject(framesCount, currentImages, 'processing');
      setCurrentFrame(0);
    } catch (err) {
      console.error('Error uploading 360 files:', err);
      alert('Erro ao enviar as imagens.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handle damage images upload
  const handleDamageImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setDamageUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await vehicle360Service.uploadDamageImage(vehicle.id, file);
        urls.push(url);
      }
      setDamageImages(prev => [...prev, ...urls]);
    } catch (err) {
      console.error('Error uploading damage image:', err);
    } finally {
      setDamageUploading(false);
    }
  };

  // Save new marker handler
  const handleSaveNewMarker = async () => {
    if (!markerTitle || !newMarkerPos) return;

    try {
      await saveMarker({
        title: markerTitle,
        description: markerDescription,
        category: markerCategory,
        damageImages: damageImages,
        frameIndex: currentFrame,
        posX: newMarkerPos.x,
        posY: newMarkerPos.y,
        framePositions: {
          [currentFrame]: { posX: newMarkerPos.x, posY: newMarkerPos.y, isConfirmed: true }
        }
      });

      // Reset
      setNewMarkerPos(null);
      setMarkerTitle('');
      setMarkerDescription('');
      setMarkerCategory('Arranhão');
      setDamageImages([]);
      setIsEditModeActive(false);
      showToast('✓ Hotspot criado e salvo com sucesso!');
    } catch (err) {
      console.error('Error creating marker:', err);
    }
  };

  // Delete project trigger
  const handleDeleteFull360 = async () => {
    if (confirm('Deseja realmente excluir todo o projeto 360° deste veículo? Isso removerá permanentemente todos os frames e marcadores.')) {
      await deleteProject();
      setCurrentFrame(0);
      setActiveTab('imagens');
    }
  };

  // Reorder frames helper
  const moveFrame = (index: number, direction: 'left' | 'right') => {
    if (!project) return;
    const newImages = [...frames];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    saveProject(framesCount, newImages, projectStatus);
    setCurrentFrame(targetIndex);
  };

  const removeFrame = (index: number) => {
    if (!project) return;
    if (!confirm('Deseja remover este frame do projeto?')) return;

    const newImages = frames.filter((_, i) => i !== index);
    saveProject(framesCount, newImages, projectStatus);
    if (currentFrame >= newImages.length && newImages.length > 0) {
      setCurrentFrame(newImages.length - 1);
    }
  };

  const activeMarkers = useMemo(() => {
    if (!frames.length) return [];
    return markers
      .map(m => ({
        marker: m,
        posInfo: getMarkerPositionForFrame(m, currentFrame)
      }))
      .filter(item => item.posInfo.isVisible);
  }, [markers, currentFrame, frames.length]);

  // Currently selected marker's position info for the currentFrame
  const currentMarkerPosInfo = useMemo(() => {
    if (!selectedMarker) return null;
    return getMarkerPositionForFrame(selectedMarker, currentFrame);
  }, [selectedMarker, currentFrame]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT SIDE: 360 INTERACTIVE VIEWPORT */}
      <div className="lg:col-span-7 space-y-4">
        <div 
          ref={viewerRef}
          className={`relative aspect-video rounded-3xl border border-slate-200 bg-slate-950 overflow-hidden select-none transition-all ${
            isEditModeActive || addMarkerMode
              ? 'cursor-crosshair ring-2 ring-red-500/80 shadow-2xl' 
              : frames.length > 0 
              ? 'cursor-grab active:cursor-grabbing' 
              : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {frames.length > 0 && frames[currentFrame] ? (
            <div 
              className="w-full h-full relative transition-transform duration-200 origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img 
                src={frames[currentFrame]} 
                alt={`Frame ${currentFrame + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Marker Circles Overlays */}
              {activeMarkers.map(({ marker, posInfo }) => {
                const isSelected = selectedMarker?.id === marker.id;
                return (
                  <div
                    key={marker.id}
                    style={{ left: `${posInfo.posX}%`, top: `${posInfo.posY}%` }}
                    className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMarker(marker);
                        setNewMarkerPos(null);
                        setActiveTab('marcadores');
                      }}
                      onMouseDown={(e) => {
                        if (isEditModeActive && isSelected) {
                          e.stopPropagation();
                          setIsDraggingMarkerOnCanvas(true);
                        }
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-bold text-white transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-red-600 ring-4 ring-red-400 ring-offset-2 ring-offset-slate-950 scale-125 z-40' 
                          : 'bg-red-600/90 hover:bg-red-600 hover:scale-110'
                      }`}
                      title={`${marker.category}: ${marker.title}`}
                    >
                      <MapPin className="w-4 h-4 fill-current" />
                    </button>
                    {/* Status Badge Tag */}
                    {isSelected && (
                      <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap shadow-lg border backdrop-blur-md pointer-events-none ${
                        posInfo.status === 'confirmed'
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                          : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                      }`}>
                        {posInfo.status === 'confirmed' ? '🟢 Confirmada' : '🟡 Interpolada'}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Temporary Placement Marker overlay */}
              {newMarkerPos && (
                <div 
                  className="absolute w-8 h-8 bg-blue-600 text-white font-bold rounded-full border-2 border-white shadow-2xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-30 animate-bounce"
                  style={{ left: `${newMarkerPos.x}%`, top: `${newMarkerPos.y}%` }}
                >
                  <Plus className="w-5 h-5" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-slate-900">
              <RotateCcw className="w-12 h-12 text-slate-700 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
              <p className="font-extrabold text-white text-lg">Sem frames cadastrados</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Selecione ou arraste imagens do carro na aba "Imagens" do lado direito para inicializar o visualizador 360°.
              </p>
            </div>
          )}

          {/* EDIT MODE OVERLAY BAR */}
          {isEditModeActive && (
            <div className="absolute top-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-red-500/50 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2 z-40">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div>
                  <span className="text-xs font-extrabold text-white block">🎯 Modo de Edição Ativo</span>
                  <span className="text-[10px] text-slate-300 font-medium">
                    Frame {currentFrame + 1} de {frames.length} • Clique para gravar a posição exata
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => prev === 1 ? 2 : prev === 2 ? 3 : 1)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                  title="Ativar zoom de precisão"
                >
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Zoom {zoomLevel}x</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditModeActive(false);
                    showToast('✓ Edição concluída com sucesso!');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-lg"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditModeActive(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Toast Notification Banner */}
          {saveToast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce border border-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveToast}</span>
            </div>
          )}

          {/* Bottom indicators */}
          {!isEditModeActive && frames.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
              <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>Frame {currentFrame + 1} de {frames.length}</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 shadow">
                Arrastar para girar
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-40">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                <span className="text-xs font-bold text-white">Processando alterações...</span>
              </div>
            </div>
          )}
        </div>

        {/* Viewport Controls: Frame Stepper & Auto rotation */}
        {frames.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentFrame(prev => (prev - 1 + frames.length) % frames.length)}
                  className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer font-bold text-xs flex items-center gap-1"
                  title="Atalho: Tecla ←"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isEditModeActive}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    isEditModeActive 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pausar' : 'Girar Automático'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentFrame(prev => (prev + 1) % frames.length)}
                  className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer font-bold text-xs flex items-center gap-1"
                  title="Atalho: Tecla →"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedMarker && !isEditModeActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModeActive(true);
                      setActiveTab('marcadores');
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>Modo de Edição</span>
                  </button>
                )}
              </div>
            </div>

            {/* HORIZONTAL INTERACTIVE FRAME TIMELINE (EDITOR VISUAL DA LINHA DO TEMPO) */}
            {selectedMarker && frames.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                  <span className="flex items-center gap-1.5 text-slate-100">
                    <Layers className="w-4 h-4 text-red-500" />
                    Editor Visual da Linha do Tempo (Hotspot Tracking)
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    Clique em um frame para inspecionar/ajustar
                  </span>
                </div>

                {/* Timeline Strip */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 custom-scrollbar">
                  {getMarkerTimelineStatus(selectedMarker, frames.length).map(({ frameIndex, status }) => {
                    const isCurrent = frameIndex === currentFrame;
                    return (
                      <button
                        key={frameIndex}
                        type="button"
                        onClick={() => setCurrentFrame(frameIndex)}
                        className={`shrink-0 flex flex-col items-center justify-center min-w-[42px] px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer ${
                          isCurrent
                            ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 border-white bg-slate-800 text-white scale-105 z-10'
                            : status === 'confirmed'
                            ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900'
                            : status === 'interpolated'
                            ? 'bg-amber-950/80 border-amber-600/60 text-amber-300 hover:bg-amber-900'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <span>F{frameIndex + 1}</span>
                        <span className={`w-2 h-2 rounded-full mt-1 ${
                          status === 'confirmed'
                            ? 'bg-emerald-400 ring-2 ring-emerald-400/40'
                            : status === 'interpolated'
                            ? 'bg-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-700'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-400 pt-1.5 border-t border-slate-800/80 px-1 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> 🟢 Confirmado (Keyframe)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400" /> 🟡 Interpolado (Auto Tracking)
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-700" /> ⚪ Fora do alcance
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: MANAGEMENT TABS PANEL */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
        {/* Tab Headers */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('imagens');
              setSelectedMarker(null);
              setNewMarkerPos(null);
              setIsEditModeActive(false);
            }}
            className={`py-4 text-center text-xs font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1.5 border-b-2 ${
              activeTab === 'imagens'
                ? 'text-red-600 border-red-600 bg-white'
                : 'text-slate-400 border-transparent hover:bg-slate-100/50 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagens ({frames.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('marcadores');
              setNewMarkerPos(null);
            }}
            className={`py-4 text-center text-xs font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1.5 border-b-2 ${
              activeTab === 'marcadores'
                ? 'text-red-600 border-red-600 bg-white'
                : 'text-slate-400 border-transparent hover:bg-slate-100/50 hover:text-slate-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Marcadores ({markers.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('configuracoes');
              setSelectedMarker(null);
              setNewMarkerPos(null);
              setIsEditModeActive(false);
            }}
            className={`py-4 text-center text-xs font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1.5 border-b-2 ${
              activeTab === 'configuracoes'
                ? 'text-red-600 border-red-600 bg-white'
                : 'text-slate-400 border-transparent hover:bg-slate-100/50 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes</span>
          </button>
        </div>

        {/* Tab Viewport */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* TAB: IMAGES */}
          {activeTab === 'imagens' && (
            <div className="space-y-6">
              {/* Upload Zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 hover:border-red-600 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 relative cursor-pointer"
              >
                <input 
                  type="file" 
                  id="360-files-uploader"
                  multiple 
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="360-files-uploader" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">
                      Arraste ou selecione fotos do giro 360°
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Recomendado: {framesCount} imagens numeradas em sequência (ex: 01.jpg, 02.jpg)
                    </span>
                  </div>
                </label>
              </div>

              {isUploading && uploadProgress !== null && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Enviando frames para o Supabase...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Frames Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Sequência do Giro ({frames.length} de {framesCount})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {frames.map((url, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setCurrentFrame(idx)}
                      className={`relative aspect-video rounded-xl border-2 overflow-hidden cursor-pointer group transition-all ${
                        currentFrame === idx ? 'border-red-600 ring-2 ring-red-200 shadow-md scale-95' : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={url} alt={`F-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      
                      {/* Frame actions overlay */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveFrame(idx, 'left');
                          }}
                          disabled={idx === 0}
                          className="p-1 bg-white text-slate-800 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFrame(idx);
                          }}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveFrame(idx, 'right');
                          }}
                          disabled={idx === frames.length - 1}
                          className="p-1 bg-white text-slate-800 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MARKERS & PRECISION HOTSPOT TRACKER */}
          {activeTab === 'marcadores' && (
            <div className="space-y-6">
              
              {/* Button to toggle New Marker Placement */}
              {!newMarkerPos && !selectedMarker && (
                <button
                  type="button"
                  onClick={() => {
                    setAddMarkerMode(true);
                    setSelectedMarker(null);
                    showToast('🎯 Clique no veículo para posicionar');
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                    addMarkerMode 
                      ? 'bg-blue-600 text-white animate-pulse' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{addMarkerMode ? 'Clique no Veículo (À esquerda)...' : 'Novo Hotspot / Marcador 360°'}</span>
                </button>
              )}

              {/* Form to create new marker */}
              {newMarkerPos && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-600" />
                      <span>Cadastrar Novo Hotspot (Frame {currentFrame + 1})</span>
                    </span>
                    <button 
                      onClick={() => setNewMarkerPos(null)}
                      className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Título da Avaria ou Destaque *</label>
                      <input
                        type="text"
                        placeholder="Ex: Arranhão porta esquerda, Roda esportiva..."
                        value={markerTitle}
                        onChange={(e) => setMarkerTitle(e.target.value)}
                        className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoria</label>
                      <select
                        value={markerCategory}
                        onChange={(e) => setMarkerCategory(e.target.value as DamageCategory)}
                        className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 bg-white"
                      >
                        {['Arranhão', 'Amassado', 'Pintura', 'Vidro', 'Roda/Pneu', 'Acessórios', 'Outros'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição Detalhada</label>
                      <textarea
                        rows={2}
                        placeholder="Detalhes adicionais para o comprador..."
                        value={markerDescription}
                        onChange={(e) => setMarkerDescription(e.target.value)}
                        className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-red-600 bg-white"
                      />
                    </div>

                    {/* Upload Evidences */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fotos em Altas Resolução / Evidências</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id="damage-img-upload"
                          multiple
                          accept="image/*"
                          onChange={handleDamageImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="damage-img-upload"
                          className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-red-600" />
                          <span>Adicionar Fotos ({damageImages.length})</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveNewMarker}
                      disabled={!markerTitle}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase cursor-pointer"
                    >
                      Salvar Hotspot 360°
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Marker Detail Card */}
              {selectedMarker && !newMarkerPos && (
                <div className="bg-red-50/60 border border-red-200 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-red-200 pb-3">
                    <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 fill-red-600 text-white" />
                      <span>{selectedMarker.category}</span>
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedMarker(null);
                        setIsEditModeActive(false);
                      }}
                      className="p-1 hover:bg-red-100 text-red-400 hover:text-red-700 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{selectedMarker.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{selectedMarker.description || 'Sem descrição detalhada cadastrada.'}</p>
                    </div>

                    {/* Current Frame Tracking Status Panel */}
                    {currentMarkerPosInfo && (
                      <div className="bg-white p-3.5 rounded-xl border border-red-100 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Posição no Frame {currentFrame + 1}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              X: {Math.round(currentMarkerPosInfo.posX * 10) / 10}% | Y: {Math.round(currentMarkerPosInfo.posY * 10) / 10}%
                            </span>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                            currentMarkerPosInfo.status === 'confirmed'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}>
                            {currentMarkerPosInfo.status === 'confirmed' ? '🟢 Confirmado' : '🟡 Interpolado'}
                          </span>
                        </div>

                        {/* Toggle Precision Edit Mode button */}
                        <button
                          type="button"
                          onClick={() => setIsEditModeActive(!isEditModeActive)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isEditModeActive
                              ? 'bg-red-600 text-white animate-pulse shadow-md ring-2 ring-red-300'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <Move className="w-3.5 h-3.5" />
                          <span>{isEditModeActive ? '🎯 Modo de Edição Ativo (Clique na Imagem)' : `Ajustar Posição no Frame ${currentFrame + 1}`}</span>
                        </button>

                        {/* PROPAGATION TOOLBOX */}
                        <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> Propagar Posição para Próximos Frames:
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePropagateForward(2)}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              +2 Frames
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePropagateForward(5)}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              +5 Frames
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePropagateForward(10)}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              +10 Frames
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePropagateForward('end')}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Até o Final
                            </button>
                          </div>
                        </div>

                        {/* Keyframes list */}
                        {selectedMarker.framePositions && Object.keys(selectedMarker.framePositions).length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Keyframes Gravados Manualmente:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(selectedMarker.framePositions)
                                .map(([fStr, pos]) => ({ frameNum: Number(fStr), pos }))
                                .sort((a, b) => a.frameNum - b.frameNum)
                                .map(({ frameNum, pos }) => (
                                  <div 
                                    key={frameNum} 
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border ${
                                      frameNum === currentFrame ? 'bg-red-50 text-red-700 border-red-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setCurrentFrame(frameNum)}
                                      className="hover:underline cursor-pointer"
                                    >
                                      F{frameNum + 1}: {Math.round(pos.posX)}%, {Math.round(pos.posY)}%
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFramePosition(frameNum)}
                                      className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer"
                                      title="Remover posição deste frame"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedMarker.damageImages && selectedMarker.damageImages.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Evidências da Inspeção:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedMarker.damageImages.map((img, idx) => (
                            <a 
                              key={idx} 
                              href={img} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:opacity-90 cursor-pointer block"
                            >
                              <img src={img} alt={`Img-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-red-100">
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Deseja realmente excluir este marcador?')) {
                            await deleteMarker(selectedMarker.id);
                            setSelectedMarker(null);
                            setIsEditModeActive(false);
                          }
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover Marcador
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* List of existing markers */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Marcadores Cadastrados ({markers.length})</span>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {markers.map(m => {
                    const isSelected = selectedMarker?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMarker(m);
                          setCurrentFrame(m.frameIndex);
                          setNewMarkerPos(null);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected 
                            ? 'bg-red-50 border-red-300 ring-1 ring-red-200' 
                            : 'bg-white border-slate-150 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 bg-red-600 rounded-full shrink-0" />
                          <div>
                            <p className="font-bold text-xs text-slate-900">{m.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Categoria: <span className="font-bold text-slate-600">{m.category}</span> • Frame: {m.frameIndex + 1}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    );
                  })}

                  {markers.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                      Nenhum marcador criado para este veículo ainda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONFIGURATIONS */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-slate-800 tracking-wider border-b border-slate-100 pb-2">
                  Especificações do Projeto 360°
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status de Publicação</label>
                    <select
                      value={projectStatus}
                      onChange={(e) => {
                        const status = e.target.value as Vehicle360['status'];
                        setProjectStatus(status);
                        if (project) {
                          saveProject(framesCount, frames, status);
                        }
                      }}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600 bg-white text-slate-700"
                    >
                      {[
                        { value: 'draft', label: 'Não iniciado' },
                        { value: 'processing', label: 'Em andamento' },
                        { value: 'completed', label: 'Concluído' }
                      ].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Quantidade Estimada de Frames</label>
                    <select
                      value={framesCount}
                      onChange={(e) => {
                        const cnt = Number(e.target.value);
                        setFramesCount(cnt);
                        if (project) {
                          saveProject(cnt, frames, projectStatus);
                        }
                      }}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-600 bg-white text-slate-700"
                    >
                      {[24, 36, 48, 72, 96].map(num => (
                        <option key={num} value={num}>{num} frames (Giro completo)</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Garante que a rotação no showroom seja otimizada e o frame-rate ideal.</p>
                  </div>
                </div>
              </div>

              {/* Informational Panel */}
              <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 space-y-2.5">
                <span className="text-[10px] uppercase font-extrabold text-slate-500 block">Metadados do Inspetor</span>
                <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-600">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[9px] font-medium uppercase">Carregado:</span>
                    <span>{frames.length} imagens</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[9px] font-medium uppercase">Tamanho Estimado:</span>
                    <span>{(frames.length * 0.15).toFixed(2)} MB</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100 col-span-2">
                    <span className="text-slate-400 block text-[9px] font-medium uppercase">Atualizado em:</span>
                    <span>{project ? new Date(project.updatedAt).toLocaleString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Destructive Deletion Panel */}
              {project && (
                <div className="pt-6 border-t border-slate-100">
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <div>
                      <h4 className="font-extrabold text-xs text-red-900 uppercase">Zona de Exclusão</h4>
                      <p className="text-[10px] text-red-600 mt-1 font-medium leading-relaxed">
                        Ao excluir este projeto 360°, todos os dados do banco e as imagens enviadas ao Supabase Storage serão removidos permanentemente.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteFull360}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer"
                    >
                      Excluir Projeto 360°
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
