import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  RotateCcw, Upload, Plus, Trash2, Settings, Image as ImageIcon,
  ChevronLeft, ChevronRight, X, Play, Pause, Loader2, CheckCircle2, 
  AlertCircle, MapPin, Eye, Search, Layers, Grid, List, ArrowLeft, Move
} from 'lucide-react';
import { Car as CarType, Vehicle360, DamageMarker, DamageCategory } from '../types';
import { useVehicle360 } from '../hooks/useVehicle360';
import { vehicle360Service } from '../services/vehicle360.service';

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
            const frameCount = status !== 'draft' ? 'Disponível' : 'Nenhum';

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

  // Handle dragging rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (addMarkerMode || frames.length === 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startFrame.current = currentFrame;
    setIsPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || frames.length === 0) return;
    const deltaX = e.clientX - startX.current;
    // Every 15px is a frame rotation
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

  // Handle clicking canvas for marker placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addMarkerMode || frames.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewMarkerPos({ x, y });
    setAddMarkerMode(false);
    setSelectedMarker(null);
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

    // Filter only images
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setIsUploading(false);
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Sort files by name to maintain order
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    try {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const url = await vehicle360Service.upload360Frame(vehicle.id, file);
        uploadedUrls.push(url);
        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      // Combine with existing images or create new project
      const currentImages = [...frames, ...uploadedUrls];
      
      // Auto-update or create project
      await saveProject(framesCount, currentImages, 'processing');
      setCurrentFrame(0);
    } catch (err) {
      console.error('Error uploading 360 files:', err);
      alert('Erro ao enviar as imagens. Usando fallbacks locais se offline.');
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
        posY: newMarkerPos.y
      });

      // Reset
      setNewMarkerPos(null);
      setMarkerTitle('');
      setMarkerDescription('');
      setMarkerCategory('Arranhão');
      setDamageImages([]);
    } catch (err) {
      console.error('Error creating marker:', err);
    }
  };

  // Delete project trigger
  const handleDeleteFull360 = async () => {
    if (confirm('Deseja realmente excluir todo o projeto 360° deste veículo? Isso removerá permanentemente todos os frames e marcadores do Supabase.')) {
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

    // Swap
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

  // Filter markers applicable to the current frame index
  const activeMarkers = useMemo(() => {
    return markers.filter(m => m.frameIndex === currentFrame);
  }, [markers, currentFrame]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT SIDE: 360 INTERACTIVE VIEWPORT */}
      <div className="lg:col-span-7 space-y-4">
        <div 
          ref={viewerRef}
          className={`relative aspect-video rounded-3xl border border-slate-200 bg-slate-950 overflow-hidden select-none ${
            addMarkerMode ? 'cursor-crosshair' : frames.length > 0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {frames.length > 0 && frames[currentFrame] ? (
            <div className="w-full h-full relative">
              <img 
                src={frames[currentFrame]} 
                alt={`Frame ${currentFrame + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Marker Circles overlays */}
              {activeMarkers.map(marker => (
                <button
                  key={marker.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                    setNewMarkerPos(null);
                    setActiveTab('marcadores');
                  }}
                  className={`absolute w-7 h-7 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full border-2 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-30 ${
                    selectedMarker?.id === marker.id ? 'ring-4 ring-red-300 ring-offset-1 scale-110' : ''
                  }`}
                  style={{ left: `${marker.posX}%`, top: `${marker.posY}%` }}
                  title={`${marker.category}: ${marker.title}`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                </button>
              ))}

              {/* Temporary Placement Marker overlay */}
              {newMarkerPos && (
                <div 
                  className="absolute w-7 h-7 bg-blue-500 text-white font-bold rounded-full border-2 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-30 animate-pulse"
                  style={{ left: `${newMarkerPos.x}%`, top: `${newMarkerPos.y}%` }}
                >
                  <Plus className="w-4 h-4" />
                </div>
              )}

              {/* Bottom indicators */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Frame {currentFrame + 1} de {frames.length}</span>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 shadow">
                  Arrastar para girar
                </div>
              </div>
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

          {loading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-40">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                <span className="text-xs font-bold text-white">Processando alterações...</span>
              </div>
            </div>
          )}
        </div>

        {/* Viewport Control Buttons */}
        {frames.length > 0 && (
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentFrame(prev => (prev - 1 + frames.length) % frames.length)}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Quadro anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pausar' : 'Girar Automático'}</span>
              </button>
              <button
                onClick={() => setCurrentFrame(prev => (prev + 1) % frames.length)}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Próximo quadro"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-bold text-slate-500">
              {markers.length} marcadores totais
            </div>
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
            <span>Marcadores</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('configuracoes');
              setSelectedMarker(null);
              setNewMarkerPos(null);
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
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Selecione ou Arraste os Frames</p>
                    <p className="text-[11px] text-slate-400 mt-1">Carregue imagens ordenadas de preferência (ex: 001, 002...)</p>
                  </div>
                </label>

                {isUploading && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-4 rounded-2xl space-y-3">
                    <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                    <div className="w-full max-w-[200px]">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                        <span>Enviando para o Storage</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status information */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <span>Total de Frames: {frames.length} / {framesCount}</span>
                <span className="text-red-600">{frames.length > 0 ? `${frames.length} imagens` : 'Sem imagens'}</span>
              </div>

              {/* Reordering Preview Grid */}
              {frames.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Listagem de Frames</span>
                    <button 
                      onClick={() => {
                        if (confirm('Deseja limpar todos os frames deste projeto?')) {
                          saveProject(framesCount, [], 'draft');
                        }
                      }}
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer bg-red-50 px-2 py-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar Tudo
                    </button>
                  </div>

                  {/* Virtualized/Scrollable layout for frames */}
                  <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto p-1.5 border border-slate-100 rounded-xl">
                    {frames.map((img, idx) => {
                      const isActive = idx === currentFrame;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setCurrentFrame(idx)}
                          className={`relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all ${
                            isActive ? 'ring-2 ring-red-600 border-transparent shadow' : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img src={img} alt={`F-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute top-1 left-1 bg-slate-900/80 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 rounded">
                            {idx + 1}
                          </div>

                          {/* Reordering Controls */}
                          <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity bg-slate-900/90 rounded p-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveFrame(idx, 'left'); }}
                              disabled={idx === 0}
                              className="text-white hover:text-red-500 disabled:opacity-30"
                              title="Mover para esquerda"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveFrame(idx, 'right'); }}
                              disabled={idx === frames.length - 1}
                              className="text-white hover:text-red-500 disabled:opacity-30"
                              title="Mover para direita"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeFrame(idx); }}
                              className="text-red-400 hover:text-red-600 ml-0.5"
                              title="Remover frame"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MARKERS */}
          {activeTab === 'marcadores' && (
            <div className="space-y-6">
              
              {/* Add Marker Trigger Button */}
              {!newMarkerPos && !selectedMarker && (
                <div className="space-y-3">
                  <button
                    disabled={frames.length === 0}
                    onClick={() => {
                      setAddMarkerMode(true);
                      setSelectedMarker(null);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border shadow-sm ${
                      addMarkerMode 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 ring-2 ring-blue-100'
                        : frames.length === 0
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 border-transparent shadow hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{addMarkerMode ? 'Clique no Veículo (Esquerda)' : 'Adicionar Marcador de Avaria'}</span>
                  </button>
                  {addMarkerMode && (
                    <p className="text-[11px] text-blue-600 font-bold text-center animate-pulse">
                      Selecione o frame de rotação desejado, depois dê um clique sobre o ponto exato da avaria no veículo à esquerda.
                    </p>
                  )}
                </div>
              )}

              {/* Form: Place New Marker */}
              {newMarkerPos && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700">Nova Avaria (Frame {currentFrame + 1})</span>
                    <button 
                      onClick={() => setNewMarkerPos(null)}
                      className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Título</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Riscado na porta esquerda"
                        value={markerTitle}
                        onChange={(e) => setMarkerTitle(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Categoria da Avaria</label>
                      <select
                        value={markerCategory}
                        onChange={(e) => setMarkerCategory(e.target.value as DamageCategory)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 bg-white font-medium"
                      >
                        {['Arranhão', 'Amassado', 'Parachoque', 'Farol', 'Lanterna', 'Pneu', 'Roda', 'Retrovisor', 'Capô', 'Teto', 'Vidro', 'Outro'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição Detalhada</label>
                      <textarea
                        rows={2}
                        placeholder="Escreva detalhes como gravidade, se necessita reparo rápido etc..."
                        value={markerDescription}
                        onChange={(e) => setMarkerDescription(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-red-600 bg-white font-medium resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Imagens Comprobatórias (Storage)</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input 
                          type="file" 
                          id="damage-images-uploader"
                          multiple 
                          accept="image/*"
                          onChange={handleDamageImageUpload}
                          className="hidden"
                        />
                        <label 
                          htmlFor="damage-images-uploader" 
                          className="w-12 h-12 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {damageUploading ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Plus className="w-4 h-4" />}
                        </label>
                        {damageImages.map((url, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden">
                            <img src={url} alt={`D-${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setDamageImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 hover:bg-red-700"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={handleSaveNewMarker}
                        disabled={!markerTitle}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Salvar Marcador
                      </button>
                      <button
                        onClick={() => setNewMarkerPos(null)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* View/Edit existing marker details */}
              {selectedMarker && (
                <div className="bg-red-50/50 border border-red-200 rounded-2xl p-4 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-red-200 pb-2">
                    <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 fill-red-600 text-white" />
                      <span>{selectedMarker.category} (Frame {selectedMarker.frameIndex + 1})</span>
                    </span>
                    <button 
                      onClick={() => setSelectedMarker(null)}
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
                        onClick={async () => {
                          if (confirm('Deseja realmente excluir este marcador?')) {
                            await deleteMarker(selectedMarker.id);
                            setSelectedMarker(null);
                          }
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover Marcador
                      </button>
                      <span className="text-[10px] text-slate-400">Coordenadas: {Math.round(selectedMarker.posX)}%, {Math.round(selectedMarker.posY)}%</span>
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
