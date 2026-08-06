import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  RotateCcw, Upload, Plus, Trash2, Settings, Image as ImageIcon,
  ChevronLeft, ChevronRight, X, Play, Pause, Loader2, CheckCircle2, 
  AlertCircle, MapPin, Eye, Search, Layers, Grid, List, ArrowLeft, Move,
  Camera, Check, Sparkles, Maximize2, Edit3, HelpCircle
} from 'lucide-react';
import { Car as CarType, Vehicle360, DamageMarker, DamageCategory, VehicleHotspot } from '../types';
import { useVehicle360 } from '../hooks/useVehicle360';
import { vehicle360Service } from '../services/vehicle360.service';
import { getMarkerPositionForFrame } from '../utils/markerUtils';
import PoiPhotoModal from './360/PoiPhotoModal';

const SUGGESTED_POI_TITLES = [
  'Motor',
  'Painel',
  'Porta-malas',
  'Roda Dianteira',
  'Roda Traseira',
  'Interior',
  'Banco Traseiro',
  'Porta Motorista',
  'Porta Passageiro',
  'Capô',
  'Chassi',
  'Documento',
  'Farol Dianteiro',
  'Lanterna Traseira',
  'Teto',
  'Central Multimídia',
  'Volante',
  'Retrovisor'
];

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
    hotspots,
    vehicleImages,
    saveProject,
    saveHotspot,
    deleteHotspot,
    saveMarker,
    deleteMarker,
    deleteProject,
    refresh
  } = useVehicle360(selectedVehicle ? selectedVehicle.id : null, selectedVehicle?.images);

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
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 transition-all cursor-pointer shadow-xs hover:shadow"
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
            hotspots={hotspots}
            vehicleImages={vehicleImages}
            markers={markers}
            saveProject={saveProject}
            saveHotspot={saveHotspot}
            deleteHotspot={deleteHotspot}
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
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
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
                      {status === 'completed' ? '360° Ativo' : status === 'processing' ? 'Em Edição' : 'Pendente'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-red-600 tracking-wider">
                      {car.brand}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base line-clamp-1 mt-0.5">
                      {car.model}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {car.year} • {car.color}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-slate-400 block font-medium">Visualização 360°</span>
                      <span className={`font-bold block ${status !== 'draft' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {status !== 'draft' ? 'Configurado' : 'Não iniciado'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedVehicle(car)}
                      className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
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
  hotspots: VehicleHotspot[];
  vehicleImages: { id: string; url: string; title?: string }[];
  markers: DamageMarker[];
  saveProject: (framesCount: number, images: string[], status: Vehicle360['status']) => Promise<any>;
  saveHotspot: (hotspot: Omit<VehicleHotspot, 'id' | 'vehicleId' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<any>;
  deleteHotspot: (hotspotId: string) => Promise<any>;
  saveMarker: (marker: Omit<DamageMarker, 'id' | 'vehicleId' | 'createdAt'> & { id?: string }) => Promise<any>;
  deleteMarker: (markerId: string) => Promise<any>;
  deleteProject: () => Promise<any>;
  loading: boolean;
}

function Editor360({
  vehicle,
  project,
  hotspots,
  vehicleImages,
  markers,
  saveProject,
  saveHotspot,
  deleteHotspot,
  saveMarker,
  deleteMarker,
  deleteProject,
  loading
}: Editor360Props) {
  const [activeTab, setActiveTab] = useState<'imagens' | 'pois' | 'avarias' | 'configuracoes'>('pois');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // POI Creation State
  const [isCreatingPoi, setIsCreatingPoi] = useState(false);
  const [selectedPoiImage, setSelectedPoiImage] = useState<{ id: string; url: string } | null>(null);
  const [poiTitle, setPoiTitle] = useState('');
  const [newPoiPos, setNewPoiPos] = useState<{ x: number; y: number } | null>(null);
  const [savingPoi, setSavingPoi] = useState(false);

  // POI Edit State
  const [editingPoi, setEditingPoi] = useState<VehicleHotspot | null>(null);
  const [isRepositioningPoi, setIsRepositioningPoi] = useState(false);

  // POI Modal Preview State
  const [previewHotspotId, setPreviewHotspotId] = useState<string | null>(null);

  // Avarias / Damage Marker State
  const [addMarkerMode, setAddMarkerMode] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [markerTitle, setMarkerTitle] = useState('');
  const [markerDescription, setMarkerDescription] = useState('');
  const [markerCategory, setMarkerCategory] = useState<DamageCategory>('Arranhão');
  const [damageImages, setDamageImages] = useState<string[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<DamageMarker | null>(null);
  const [damageUploading, setDamageUploading] = useState(false);

  // Upload frames state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Sync settings
  useEffect(() => {
    if (project) {
      setFramesCount(project.framesCount);
      setProjectStatus(project.status);
    }
  }, [project]);

  const frames = useMemo(() => {
    return project?.images || [];
  }, [project]);

  // All available vehicle images (from DB + vehicle object fallback)
  const availableImages = useMemo(() => {
    if (vehicleImages.length > 0) return vehicleImages;
    return (vehicle.images || []).map((url, idx) => ({
      id: `fallback_${idx}`,
      url,
      title: `Foto ${idx + 1}`
    }));
  }, [vehicleImages, vehicle.images]);

  // Set default selected image for new POI
  useEffect(() => {
    if (isCreatingPoi && !selectedPoiImage && availableImages.length > 0) {
      setSelectedPoiImage(availableImages[0]);
    }
  }, [isCreatingPoi, selectedPoiImage, availableImages]);

  // Handle dragging rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCreatingPoi || isRepositioningPoi || addMarkerMode || frames.length === 0) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startFrame.current = currentFrame;
    setIsPlaying(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  // Handle clicking canvas for POI placement, repositioning, or damage marker
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (frames.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    // 1. Placing new POI
    if (isCreatingPoi) {
      setNewPoiPos({ x, y });
      return;
    }

    // 2. Repositioning existing POI
    if (isRepositioningPoi && editingPoi) {
      try {
        setSavingPoi(true);
        const updated = await saveHotspot({
          ...editingPoi,
          posX: x,
          posY: y,
          frameNumber: currentFrame
        });
        setEditingPoi(updated);
        setIsRepositioningPoi(false);
      } catch (err) {
        console.error('Error repositioning POI:', err);
      } finally {
        setSavingPoi(false);
      }
      return;
    }

    // 3. Placing damage marker
    if (addMarkerMode) {
      setNewMarkerPos({ x, y });
      setAddMarkerMode(false);
      setSelectedMarker(null);
      return;
    }
  };

  // Save new POI
  const handleSaveNewPoi = async () => {
    if (!selectedPoiImage) {
      alert('Selecione uma foto do veículo.');
      return;
    }
    if (!poiTitle.trim()) {
      alert('Informe um título para o ponto de interesse (Ex: Motor, Painel).');
      return;
    }
    if (!newPoiPos) {
      alert('Clique sobre o veículo no visualizador para definir a posição do ponto.');
      return;
    }

    setSavingPoi(true);
    try {
      await saveHotspot({
        title: poiTitle.trim(),
        posX: newPoiPos.x,
        posY: newPoiPos.y,
        frameNumber: currentFrame,
        imageId: selectedPoiImage.id.startsWith('fallback_') ? undefined : selectedPoiImage.id,
        imageUrl: selectedPoiImage.url,
        active: true
      });

      // Reset create state
      setIsCreatingPoi(false);
      setNewPoiPos(null);
      setPoiTitle('');
      setSelectedPoiImage(null);
    } catch (err) {
      console.error('Error saving POI:', err);
      alert('Erro ao salvar ponto de interesse.');
    } finally {
      setSavingPoi(false);
    }
  };

  // Save edited POI
  const handleSaveEditPoi = async () => {
    if (!editingPoi) return;
    if (!editingPoi.title.trim()) {
      alert('Informe um título.');
      return;
    }

    setSavingPoi(true);
    try {
      await saveHotspot({
        id: editingPoi.id,
        title: editingPoi.title.trim(),
        posX: editingPoi.posX,
        posY: editingPoi.posY,
        frameNumber: editingPoi.frameNumber,
        imageId: editingPoi.imageId,
        imageUrl: editingPoi.imageUrl,
        active: editingPoi.active !== false
      });
      setEditingPoi(null);
      setIsRepositioningPoi(false);
    } catch (err) {
      console.error('Error updating POI:', err);
    } finally {
      setSavingPoi(false);
    }
  };

  // Delete POI
  const handleDeletePoi = async (poiId: string) => {
    if (confirm('Deseja realmente remover este ponto de interesse? (A imagem original do veículo NÃO será excluída)')) {
      try {
        await deleteHotspot(poiId);
        if (editingPoi?.id === poiId) {
          setEditingPoi(null);
          setIsRepositioningPoi(false);
        }
      } catch (err) {
        console.error('Error deleting POI:', err);
      }
    }
  };

  // Save new damage marker
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
          [currentFrame]: { posX: newMarkerPos.x, posY: newMarkerPos.y }
        }
      });

      setNewMarkerPos(null);
      setMarkerTitle('');
      setMarkerDescription('');
      setMarkerCategory('Arranhão');
      setDamageImages([]);
    } catch (err) {
      console.error('Error creating marker:', err);
    }
  };

  // Delete project
  const handleDeleteFull360 = async () => {
    if (confirm('Deseja realmente excluir todo o projeto 360° deste veículo? Isso removerá os frames cadastrados.')) {
      await deleteProject();
      setCurrentFrame(0);
      setActiveTab('imagens');
    }
  };

  // Upload frames
  const processUploads = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);

    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];
        const url = await vehicle360Service.upload360Frame(vehicle.id, file);
        uploadedUrls.push(url);
        setUploadProgress(Math.round(((i + 1) / sortedFiles.length) * 100));
      }

      await saveProject(uploadedUrls.length, uploadedUrls, 'processing');
      setCurrentFrame(0);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Erro no upload dos frames: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Filter active POIs and Markers for current frame
  const activeHotspots = useMemo(() => {
    return hotspots.filter(h => h.frameNumber === currentFrame);
  }, [hotspots, currentFrame]);

  const activeMarkers = useMemo(() => {
    if (!frames.length) return [];
    return markers
      .map(m => ({
        marker: m,
        posInfo: getMarkerPositionForFrame(m, currentFrame)
      }))
      .filter(item => item.posInfo.isVisible);
  }, [markers, currentFrame, frames.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT SIDE: 360 INTERACTIVE VIEWPORT */}
      <div className="lg:col-span-7 space-y-4">
        <div 
          ref={viewerRef}
          className={`relative aspect-video rounded-3xl border border-slate-200 bg-slate-950 overflow-hidden select-none ${
            isCreatingPoi || isRepositioningPoi || addMarkerMode 
              ? 'cursor-crosshair' 
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
            <div className="w-full h-full relative">
              <img 
                src={frames[currentFrame]} 
                alt={`Frame ${currentFrame + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* POI Hotspots (Pontos de Interesse) Pins */}
              {activeHotspots.map(hotspot => (
                <div
                  key={hotspot.id}
                  style={{ left: `${hotspot.posX}%`, top: `${hotspot.posY}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 group"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewHotspotId(hotspot.id);
                    }}
                    className={`w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 active:scale-95 cursor-pointer ${
                      editingPoi?.id === hotspot.id ? 'ring-4 ring-red-400 ring-offset-2 scale-125' : ''
                    }`}
                    title={hotspot.title}
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* Hover Tooltip */}
                  <div className="absolute left-1/2 -top-12 -translate-x-1/2 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700/90 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap flex items-center gap-1.5 z-40">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>{hotspot.title}</span>
                    <span className="text-[9px] text-slate-400 font-normal">(Clique para abrir)</span>
                  </div>
                </div>
              ))}

              {/* Damage Markers Pins */}
              {activeMarkers.map(({ marker, posInfo }) => (
                <button
                  key={marker.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                    setActiveTab('avarias');
                  }}
                  className={`absolute w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full border-2 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-30 ${
                    selectedMarker?.id === marker.id ? 'ring-4 ring-amber-300 ring-offset-1 scale-110' : ''
                  }`}
                  style={{ left: `${posInfo.posX}%`, top: `${posInfo.posY}%` }}
                  title={`${marker.category}: ${marker.title}`}
                >
                  <AlertCircle className="w-4 h-4 fill-current" />
                </button>
              ))}

              {/* Temporary Placement Marker overlay for new POI */}
              {newPoiPos && (
                <div 
                  className="absolute w-8 h-8 bg-red-600 text-white font-bold rounded-full border-2 border-white shadow-xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-40 animate-bounce"
                  style={{ left: `${newPoiPos.x}%`, top: `${newPoiPos.y}%` }}
                >
                  <Camera className="w-4 h-4" />
                </div>
              )}

              {/* Placement instruction banner */}
              {(isCreatingPoi || isRepositioningPoi) && (
                <div className="absolute top-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-red-500/40 rounded-2xl p-3 text-white text-xs font-bold flex items-center justify-between shadow-2xl z-30">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>
                      {isRepositioningPoi 
                        ? `Clique no veículo para definir a nova posição do ponto "${editingPoi?.title}"` 
                        : 'Gire até o ângulo desejado e clique no veículo para marcar a foto técnica.'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Frame {currentFrame + 1}</span>
                </div>
              )}

              {/* Bottom indicators */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Frame {currentFrame + 1} de {frames.length}</span>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 shadow-xs">
                  {isCreatingPoi || isRepositioningPoi ? 'Modo Marcação' : 'Arrastar para girar'}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-slate-900">
              <RotateCcw className="w-12 h-12 text-slate-700 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
              <p className="font-extrabold text-white text-lg">Sem frames cadastrados</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Envie as imagens na aba "Imagens" para montar o giro 360°.
              </p>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-40">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                <span className="text-xs font-bold text-white">Carregando dados 360°...</span>
              </div>
            </div>
          )}
        </div>

        {/* Viewport Control Buttons */}
        {frames.length > 0 && (
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl p-3.5 shadow-xs">
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

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{hotspots.length} Pontos de Interesse</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: MANAGEMENT TABS PANEL */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[520px]">
        {/* Tab Headers */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('pois');
              setSelectedMarker(null);
            }}
            className={`py-3.5 text-center text-[11px] font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1 border-b-2 ${
              activeTab === 'pois'
                ? 'text-red-600 border-red-600 bg-white'
                : 'text-slate-400 border-transparent hover:bg-slate-100/50 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>POIs ({hotspots.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('imagens');
              setSelectedMarker(null);
              setIsCreatingPoi(false);
              setEditingPoi(null);
            }}
            className={`py-3.5 text-center text-[11px] font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1 border-b-2 ${
              activeTab === 'imagens'
                ? 'text-red-600 border-red-600 bg-white'
                : 'text-slate-400 border-transparent hover:bg-slate-100/50 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Frames ({frames.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('avarias');
              setIsCreatingPoi(false);
              setEditingPoi(null);
            }}
            className={`py-3.5 text-center text-[11px] font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1 border-b-2 ${
              activeTab === 'avarias'
                ? 'text-red-600 border-red-600 bg-white'
                : 'text-slate-400 border-transparent hover:bg-slate-100/50 hover:text-slate-700'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Avarias ({markers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('configuracoes');
              setSelectedMarker(null);
              setIsCreatingPoi(false);
              setEditingPoi(null);
            }}
            className={`py-3.5 text-center text-[11px] font-bold uppercase transition-colors cursor-pointer flex flex-col items-center gap-1 border-b-2 ${
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
          
          {/* TAB: PONTOS DE INTERESSE (POIs) */}
          {activeTab === 'pois' && (
            <div className="space-y-6">
              
              {/* If creating a new POI */}
              {isCreatingPoi ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                        <Plus className="w-4 h-4" />
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Novo Ponto de Interesse
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setIsCreatingPoi(false);
                        setNewPoiPos(null);
                        setPoiTitle('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* STEP 1: Select Photo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>1. Selecione a Foto Técnica do Veículo:</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({availableImages.length} fotos disponíveis)
                      </span>
                    </label>
                    
                    {availableImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                        {availableImages.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => setSelectedPoiImage(img)}
                            className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                              selectedPoiImage?.id === img.id
                                ? 'border-red-600 ring-2 ring-red-500/30'
                                : 'border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt="Foto técnica"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {selectedPoiImage?.id === img.id && (
                              <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                                <span className="p-1 bg-red-600 text-white rounded-full">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                        Nenhuma foto disponível no cadastro do veículo.
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Title & Suggestions */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      2. Título do Ponto de Interesse:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Motor, Painel, Porta-malas..."
                      value={poiTitle}
                      onChange={(e) => setPoiTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:border-red-600"
                    />

                    {/* Quick Suggestions Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {SUGGESTED_POI_TITLES.slice(0, 10).map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => setPoiTitle(title)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            poiTitle === title
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STEP 3: Position Pin Instruction */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      3. Posicione sobre o Veículo no 360°:
                    </label>
                    <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {newPoiPos ? 'Posição definida no Frame ' + (currentFrame + 1) : 'Clique no visualizador ao lado'}
                        </span>
                        <span className="text-[11px] text-amber-800">
                          {newPoiPos 
                            ? `X: ${newPoiPos.x}%, Y: ${newPoiPos.y}%` 
                            : 'Gire o veículo até o ângulo correspondente à foto e clique sobre o ponto desejado.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingPoi(false);
                        setNewPoiPos(null);
                        setPoiTitle('');
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewPoi}
                      disabled={savingPoi || !selectedPoiImage || !poiTitle.trim() || !newPoiPos}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {savingPoi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Salvar Ponto de Interesse</span>
                    </button>
                  </div>
                </div>
              ) : editingPoi ? (
                /* EDIT POI CARD */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Editar Ponto de Interesse
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPoi(null);
                        setIsRepositioningPoi(false);
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Selected Photo display */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Foto Vinculada:</label>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black">
                      <img
                        src={editingPoi.imageUrl}
                        alt={editingPoi.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Title input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Título:</label>
                    <input
                      type="text"
                      value={editingPoi.title}
                      onChange={(e) => setEditingPoi({ ...editingPoi, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:border-red-600"
                    />
                  </div>

                  {/* Reposition action */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Posição no 360°:</span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Frame {editingPoi.frameNumber + 1} (X: {editingPoi.posX}%, Y: {editingPoi.posY}%)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentFrame(editingPoi.frameNumber);
                        setIsRepositioningPoi(true);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        isRepositioningPoi
                          ? 'bg-red-600 text-white border-red-600 animate-pulse'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Move className="w-4 h-4" />
                      <span>{isRepositioningPoi ? 'Clique no 360° para definir nova posição' : 'Mudar Posição no 360°'}</span>
                    </button>
                  </div>

                  {/* Save buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleDeletePoi(editingPoi.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Ponto</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPoi(null);
                          setIsRepositioningPoi(false);
                        }}
                        className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditPoi}
                        disabled={savingPoi}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {savingPoi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* MAIN POI LIST VIEW */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Pontos de Interesse Cadastrados
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Fotos técnicas vinculadas ao visualizador 360°
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsCreatingPoi(true);
                        setNewPoiPos(null);
                        setPoiTitle('');
                        if (availableImages.length > 0) {
                          setSelectedPoiImage(availableImages[0]);
                        }
                      }}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Ponto</span>
                    </button>
                  </div>

                  {hotspots.length > 0 ? (
                    <div className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                      {hotspots.map((hotspot) => (
                        <div 
                          key={hotspot.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                        >
                          <div 
                            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                            onClick={() => {
                              setCurrentFrame(hotspot.frameNumber);
                              setPreviewHotspotId(hotspot.id);
                            }}
                          >
                            {/* Miniature photo */}
                            <div className="relative w-12 h-10 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                              <img
                                src={hotspot.imageUrl}
                                alt={hotspot.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 block truncate hover:text-red-600 transition-colors">
                                {hotspot.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Frame {hotspot.frameNumber + 1}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Item actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setCurrentFrame(hotspot.frameNumber);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Girar para este Frame"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingPoi(hotspot);
                                setCurrentFrame(hotspot.frameNumber);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar Ponto de Interesse"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeletePoi(hotspot.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Ponto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center space-y-3">
                      <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <h5 className="font-bold text-sm text-slate-800">
                          Nenhum Ponto de Interesse Criado
                        </h5>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                          Vincule fotos de detalhes técnicos (como motor, rodas, painel e porta-malas) aos ângulos 360° do carro.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsCreatingPoi(true);
                          setNewPoiPos(null);
                          setPoiTitle('');
                          if (availableImages.length > 0) {
                            setSelectedPoiImage(availableImages[0]);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar Primeiro Ponto</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: FRAMES (360 IMAGES) */}
          {activeTab === 'imagens' && (
            <div className="space-y-6">
              {/* Upload Zone */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []) as File[];
                  if (files.length > 0) await processUploads(files);
                }}
                className="border-2 border-dashed border-slate-200 hover:border-red-500 rounded-3xl p-6 text-center transition-colors bg-slate-50/50 flex flex-col items-center justify-center gap-3"
              >
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Enviar Frames da Foto 360°
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Arraste ou selecione a sequência de fotos sequenciais (24 a 96 fotos)
                  </p>
                </div>

                <label className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs">
                  <span>Selecionar Fotos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []) as File[];
                      if (files.length > 0) await processUploads(files);
                    }}
                    className="hidden"
                  />
                </label>

                {isUploading && uploadProgress !== null && (
                  <div className="w-full max-w-xs space-y-1.5 pt-2">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-600 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      Enviando frames... {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Frames Miniature Grid */}
              {frames.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Sequência Atual ({frames.length} frames)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Clique para visualizar o quadro
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto p-1">
                    {frames.map((frameUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentFrame(idx)}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          currentFrame === idx
                            ? 'border-red-600 scale-105 shadow-md shadow-red-500/20 ring-2 ring-red-500/30'
                            : 'border-slate-100 hover:border-slate-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={frameUrl}
                          alt={`Frame ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1 rounded">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AVARIAS (DAMAGE MARKERS) */}
          {activeTab === 'avarias' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Avarias e Danos
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Mapeamento independente de arranhões e reparos
                  </p>
                </div>

                {!addMarkerMode && !newMarkerPos && (
                  <button
                    onClick={() => {
                      setAddMarkerMode(true);
                      setNewMarkerPos(null);
                      setSelectedMarker(null);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Avaria</span>
                  </button>
                )}
              </div>

              {/* Add damage marker form */}
              {newMarkerPos ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <h5 className="font-bold text-xs text-slate-900">Nova Avaria (Frame {currentFrame + 1})</h5>
                  <input
                    type="text"
                    placeholder="Título (ex: Arranhão lateral)"
                    value={markerTitle}
                    onChange={(e) => setMarkerTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                  <textarea
                    placeholder="Descrição da avaria..."
                    value={markerDescription}
                    onChange={(e) => setMarkerDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setNewMarkerPos(null)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveNewMarker}
                      disabled={!markerTitle}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      Salvar Avaria
                    </button>
                  </div>
                </div>
              ) : addMarkerMode ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
                  <span className="font-bold block">Clique sobre o veículo no visualizador ao lado para marcar o dano.</span>
                  <button
                    onClick={() => setAddMarkerMode(false)}
                    className="text-amber-700 font-bold underline"
                  >
                    Cancelar marcação
                  </button>
                </div>
              ) : markers.length > 0 ? (
                <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {markers.map((marker) => (
                    <div key={marker.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          {marker.category}
                        </span>
                        <h6 className="font-bold text-xs text-slate-900 mt-1">{marker.title}</h6>
                        <span className="text-[10px] text-slate-400">Frame {marker.frameIndex + 1}</span>
                      </div>
                      <button
                        onClick={() => deleteMarker(marker.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400 text-xs">
                  Nenhuma avaria mapeada neste veículo.
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Status do Projeto 360°
                </label>
                <select
                  value={projectStatus}
                  onChange={(e) => {
                    const next = e.target.value as Vehicle360['status'];
                    setProjectStatus(next);
                    if (project) {
                      saveProject(framesCount, frames, next);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red-600"
                >
                  <option value="draft">Rascunho (Não visível ao cliente)</option>
                  <option value="processing">Em andamento</option>
                  <option value="completed">Concluído e Publicado</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDeleteFull360}
                  className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Giro 360° do Veículo</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* High-Resolution Modal for POI Photo Viewer */}
      {previewHotspotId && (
        <PoiPhotoModal
          hotspots={hotspots}
          currentHotspotId={previewHotspotId}
          onClose={() => setPreviewHotspotId(null)}
          onSelectHotspot={(h) => setPreviewHotspotId(h.id)}
          onRotateToFrame={(frame) => setCurrentFrame(frame)}
        />
      )}
    </div>
  );
}
