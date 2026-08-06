/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Calendar, Gauge, Settings, Fuel, 
  Check, Send, CheckCircle2, MapPin, Sparkles, MessageCircle,
  Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Info,
  X, Maximize2, ZoomIn, ZoomOut, AlertTriangle, XCircle,
  ShieldCheck, FileText, ChevronDown, ChevronUp, Camera, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, LeadMessage, Vehicle360, DamageMarker, VehicleHotspot } from '../types';
import { vehicle360Service } from '../services/vehicle360.service';
import { getMarkerPositionForFrame } from '../utils/markerUtils';
import ClientPoiPanel from './ClientPoiPanel';
import PoiPhotoModal from './360/PoiPhotoModal';

const HOTSPOT_VISIBLE_RANGE = 2;

function isMarkerVisibleOnFrame(markerFrameIndex: number, currentFrame: number): boolean {
  const diff = Math.abs(currentFrame - markerFrameIndex);
  return diff <= HOTSPOT_VISIBLE_RANGE;
}

interface CarDetailsProps {
  car: Car;
  onBack: () => void;
  onSubmitLead: (lead: Omit<LeadMessage, 'id' | 'createdAt' | 'status'>) => void;
}

export default function CarDetails({ car, onBack, onSubmitLead }: CarDetailsProps) {
  const [activeImage, setActiveImage] = useState(car.images[0] || '');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadMessage, setLeadMessage] = useState(`Olá, tenho interesse neste ${car.brand} ${car.model} ${car.year}. Gostaria de receber um orçamento.`);
  
  // Live 360 project, markers and POIs from Supabase
  const [project360, setProject360] = useState<Vehicle360 | null>(null);
  const [markers360, setMarkers360] = useState<DamageMarker[]>([]);
  const [hotspots360, setHotspots360] = useState<VehicleHotspot[]>([]);
  const [loading360, setLoading360] = useState(true);
  const [currentFrame360, setCurrentFrame360] = useState(0);
  const [isPlaying360, setIsPlaying360] = useState(false);

  // POI & Damage Selection States
  const [selectedInlineHotspot, setSelectedInlineHotspot] = useState<VehicleHotspot | null>(null);
  const [selectedInlineMarker, setSelectedInlineMarker] = useState<DamageMarker | null>(null);
  const [selectedPoiModalId, setSelectedPoiModalId] = useState<string | null>(null);
  const [activePoiTab, setActivePoiTab] = useState<'pois' | 'avarias'>('pois');

  // Lightbox for full-resolution photo inspection
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [lightboxPan, setLightboxPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingLightbox, setIsDraggingLightbox] = useState<boolean>(false);
  const lightboxDragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Car Photo Gallery Fullscreen Lightbox states
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null);
  const [galleryZoom, setGalleryZoom] = useState<number>(1);
  const [galleryPan, setGalleryPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingGallery, setIsDraggingGallery] = useState<boolean>(false);
  const galleryDragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartX = useRef<number | null>(null);

  // Preloading 2 frames before & 2 frames after current frame
  useEffect(() => {
    if (!project360?.images || project360.images.length === 0) return;
    const total = project360.images.length;
    const indicesToPreload = [
      (currentFrame360 - 2 + total) % total,
      (currentFrame360 - 1 + total) % total,
      (currentFrame360 + 1) % total,
      (currentFrame360 + 2) % total,
    ];
    indicesToPreload.forEach(idx => {
      const url = project360.images[idx];
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [currentFrame360, project360]);

  // Global Keyboard listener to close modals/lightboxes and navigate gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
          setLightboxZoom(1);
          setLightboxPan({ x: 0, y: 0 });
        } else if (galleryLightboxIndex !== null) {
          setGalleryLightboxIndex(null);
          setGalleryZoom(1);
          setGalleryPan({ x: 0, y: 0 });
        } else if (selectedPoiModalId) {
          setSelectedPoiModalId(null);
        } else if (selectedInlineMarker) {
          setSelectedInlineMarker(null);
        } else if (selectedInlineHotspot) {
          setSelectedInlineHotspot(null);
        }
      } else if (galleryLightboxIndex !== null && car.images && car.images.length > 0) {
        if (e.key === 'ArrowLeft') {
          setGalleryLightboxIndex(prev => prev !== null ? (prev - 1 + car.images.length) % car.images.length : 0);
          setGalleryZoom(1);
          setGalleryPan({ x: 0, y: 0 });
        } else if (e.key === 'ArrowRight') {
          setGalleryLightboxIndex(prev => prev !== null ? (prev + 1) % car.images.length : 0);
          setGalleryZoom(1);
          setGalleryPan({ x: 0, y: 0 });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, galleryLightboxIndex, selectedPoiModalId, selectedInlineMarker, selectedInlineHotspot, car.images]);

  // Drag-to-rotate states
  const [isDragging360, setIsDragging360] = useState(false);
  const startX360Ref = useRef(0);
  const currentFrameOnStart360Ref = useRef(0);

  // Load 360 assets, markers, and POI hotspots
  useEffect(() => {
    const fetch360Data = async () => {
      setLoading360(true);
      try {
        const [proj, marks, pois] = await Promise.all([
          vehicle360Service.get360ByVehicleId(car.id),
          vehicle360Service.getMarkersByVehicleId(car.id),
          vehicle360Service.getHotspotsByVehicleId(car.id)
        ]);
        setProject360(proj);
        setMarkers360(marks);
        setHotspots360(pois);
      } catch (err) {
        console.error('Error loading public 360 data:', err);
      } finally {
        setLoading360(false);
      }
    };
    fetch360Data();
  }, [car.id]);

  // Auto-rotation player
  useEffect(() => {
    let interval: any = null;
    if (isPlaying360 && project360 && project360.images && project360.images.length > 0) {
      interval = setInterval(() => {
        setCurrentFrame360(prev => (prev + 1) % project360.images.length);
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying360, project360]);

  // Handle Drag / Pointer interaction
  const handlePointerDown360 = (e: React.PointerEvent) => {
    if (!project360 || !project360.images || project360.images.length === 0) return;
    setIsDragging360(true);
    startX360Ref.current = e.clientX;
    currentFrameOnStart360Ref.current = currentFrame360;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove360 = (e: React.PointerEvent) => {
    if (!isDragging360 || !project360 || !project360.images || project360.images.length === 0) return;
    const deltaX = e.clientX - startX360Ref.current;
    
    // Calculate how many frames to rotate (15px of horizontal motion per frame)
    const frameShift = Math.floor(deltaX / 15);
    const totalFrames = project360.images.length;
    
    // Invert addition to make dragging feel natural (drag right -> rotates left, drag left -> rotates right)
    let nextFrame = (currentFrameOnStart360Ref.current - frameShift) % totalFrames;
    if (nextFrame < 0) {
      nextFrame += totalFrames;
    }
    
    setCurrentFrame360(nextFrame);
  };

  const handlePointerUp360 = (e: React.PointerEvent) => {
    setIsDragging360(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Interactive 360 hotspots state
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    onSubmitLead({
      carId: car.id,
      carTitle: `${car.brand} ${car.model}`,
      name: leadName,
      phone: leadPhone,
      email: leadEmail,
      message: leadMessage
    });

    setFormSubmitted(true);
    setTimeout(() => {
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setFormSubmitted(false);
    }, 5000);
  };

  const handleWhatsAppInquiry = () => {
    // Analytics tracking counter simulation is handled in parent state
    const text = encodeURIComponent(`Olá Dourado Veículos! Vi o anúncio do ${car.brand} ${car.model} (${car.year}) no site e gostaria de solicitar um orçamento.`);
    window.open(`https://wa.me/5511987654321?text=${text}`, '_blank');
  };

  // Hotspots definitions
  const hotspots = [
    {
      id: 'motor',
      top: '32%',
      left: '26%',
      title: 'Motorização Turbo',
      desc: 'Motor Turbo de alta eficiência que combina excelente torque com baixo consumo de combustível.',
    },
    {
      id: 'farol',
      top: '44%',
      left: '12%',
      title: 'Faróis Full LED',
      desc: 'Conjunto óptico em LED com projetores originais para máxima visibilidade e estilo moderno.',
    },
    {
      id: 'interior',
      top: '38%',
      left: '52%',
      title: 'Interior Premium',
      desc: 'Acabamento requintado, central multimídia flutuante integrada e bancos com costura dupla.',
    },
    {
      id: 'roda',
      top: '72%',
      left: '22%',
      title: 'Rodas de Liga Leve',
      desc: 'Rodas esportivas de liga leve diamantadas, sem riscos ou amassados, com pneus excelentes.',
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      
      {/* Top Banner & Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-semibold transition-colors text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Estoque</span>
          </button>
          <div className="text-xs text-slate-400">
            Estoque &gt; {car.brand} &gt; <span className="text-slate-600 font-medium">{car.model}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* Core Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Images and Gallery */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Primary Display image with Fullscreen Lightbox trigger */}
            <div 
              onClick={() => {
                const idx = car.images.indexOf(activeImage);
                setGalleryLightboxIndex(idx >= 0 ? idx : 0);
                setGalleryZoom(1);
                setGalleryPan({ x: 0, y: 0 });
              }}
              className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md aspect-video relative flex items-center justify-center cursor-pointer group select-none"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={activeImage || car.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'}
                  alt={car.model}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Hover overlay prompt */}
              <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 text-white font-bold text-xs border border-slate-700/60 shadow-2xl">
                  <Maximize2 className="w-4 h-4 text-red-500" />
                  <span>Clique para ampliar em Tela Cheia</span>
                </div>
              </div>
              
              {car.isSold && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                  <div className="bg-slate-900 text-white font-extrabold px-6 py-3 rounded-2xl text-xl uppercase tracking-widest shadow-lg">
                    Veículo Reservado / Vendido
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail collection */}
            {car.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImage(img);
                      setGalleryLightboxIndex(idx);
                      setGalleryZoom(1);
                      setGalleryPan({ x: 0, y: 0 });
                    }}
                    className={`relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 group ${
                      activeImage === img ? 'border-red-600 shadow-md ring-2 ring-red-600/30' : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: Primary purchase and actions card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              
              {/* Titles */}
              <div>
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {car.category}
                </span>
                <h1 className="font-extrabold text-3xl text-slate-900 tracking-tight mt-2.5">
                  {car.brand} {car.model}
                </h1>
                <p className="text-slate-500 font-medium text-sm mt-1">{car.version}</p>
              </div>

              {/* Price display replaced with quote request callout */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Disponível para Orçamento
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight block">
                  Preço sob Consulta
                </span>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Entrada facilitada e financiamento sob medida. Solicite sua cotação personalizada hoje mesmo.
                </p>
              </div>

              {/* Quick Specs parameters */}
              <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-700">
                <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none mb-0.5">Ano</span>
                    <span>{car.year}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Gauge className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none mb-0.5">Quilometragem</span>
                    <span>{car.km === 0 ? 'Zero km' : car.km.toLocaleString('pt-BR') + ' km'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Settings className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none mb-0.5">Câmbio</span>
                    <span>{car.gearbox}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Fuel className="w-4 h-4 text-red-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none mb-0.5">Combustível</span>
                    <span>{car.fuel}</span>
                  </div>
                </div>
              </div>

              {/* Instant CTAs */}
              <div className="space-y-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleWhatsAppInquiry}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Negociar no WhatsApp</span>
                </motion.button>

                <a
                  href="#proposta-form"
                  className="w-full py-3.5 border-2 border-slate-200 hover:border-slate-800 text-slate-800 hover:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer text-center bg-white"
                >
                  Enviar Proposta por E-mail
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 360° Interactive Hotspot exploration */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" />
                <span>Exploração Interativa 360°</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Gire o veículo arrastando para os lados ou use os botões para inspecionar os detalhes e avarias de forma transparente.
              </p>
            </div>
            {project360 && project360.images && project360.images.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 font-semibold text-xs rounded-full shadow-xs">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                <span>360° Ativo</span>
              </span>
            )}
          </div>

          {loading360 ? (
            <div className="h-[450px] sm:h-[650px] bg-slate-900 rounded-3xl border border-slate-800 flex flex-col items-center justify-center animate-pulse">
              <RotateCcw className="w-10 h-10 text-red-600 animate-spin mb-3" />
              <span className="text-sm font-bold text-slate-400">Carregando visualização 360°...</span>
            </div>
          ) : project360 && project360.images && project360.images.length > 0 ? (
            /* ACTIVE 360 DEGREE INTERACTIVE INSPECTOR */
            <div className="space-y-4">
              <div 
                onPointerDown={handlePointerDown360}
                onPointerMove={handlePointerMove360}
                onPointerUp={handlePointerUp360}
                onPointerLeave={handlePointerUp360}
                className="relative bg-slate-950 rounded-3xl overflow-hidden h-[50vh] sm:h-[75vh] min-h-[420px] max-h-[850px] w-full flex items-center justify-center border border-slate-800/80 shadow-2xl cursor-grab active:cursor-grabbing select-none touch-none"
              >
                {/* 360 Frame Image - Centered object-contain without black side borders */}
                {project360.images[currentFrame360] && (
                  <img 
                    src={project360.images[currentFrame360]} 
                    alt={`Veículo 360° - Frame ${currentFrame360 + 1}`}
                    className="w-full h-full object-contain pointer-events-none select-none p-2 sm:p-4"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Drag Help Overlay */}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-2 pointer-events-none shadow-lg border border-slate-800">
                  <RotateCcw className="w-4 h-4 text-red-500" />
                  <span>Arraste para girar o carro</span>
                </div>

                {/* Active Points of Interest (POIs) Hotspots Overlay */}
                {hotspots360.filter(h => isMarkerVisibleOnFrame(h.frame_number, currentFrame360)).map(hotspot => {
                  return (
                    <div
                      key={hotspot.id}
                      style={{ 
                        top: `${hotspot.pos_y}%`, 
                        left: `${hotspot.pos_x}%`,
                        transform: `translate(-50%, -50%)`,
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="absolute z-20 group"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInlineHotspot(hotspot);
                          setSelectedPoiModalId(hotspot.id);
                        }}
                        className="relative cursor-pointer transition-transform duration-200 hover:scale-125 focus:outline-none"
                        title={hotspot.title}
                      >
                        {/* Pulse Ring */}
                        <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                        {/* Inner Marker Circle with Camera Icon */}
                        <div className="relative w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white ring-2 ring-red-500/50">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </button>

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-slate-700/60 text-center space-y-0.5">
                          <span className="font-extrabold block text-red-400">{hotspot.title}</span>
                          <span className="text-[10px] text-slate-300 font-medium block">Clique para ver a foto técnica</span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-slate-900/95 rotate-45 -mt-1.5 border-r border-b border-slate-700/60" />
                      </div>
                    </div>
                  );
                })}

                {/* Active Damage Markers with smooth multi-frame interpolation */}
                {markers360.map(marker => {
                  const posInfo = getMarkerPositionForFrame(marker, currentFrame360);
                  if (!posInfo.isVisible) return null;

                  return (
                    <div
                      key={marker.id}
                      style={{ 
                        top: `${posInfo.posY}%`, 
                        left: `${posInfo.posX}%`,
                        transform: `translate(-50%, -50%)`,
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      className="absolute z-20 group"
                    >
                      {/* Marker Circle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInlineMarker(marker);
                          setSelectedInlineHotspot(null);
                          setActivePoiTab('avarias');
                          const elem = document.getElementById('poi-panel-section');
                          if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        className="relative cursor-pointer transition-transform duration-200 hover:scale-125 focus:outline-none"
                      >
                        {/* Pulse Ring */}
                        <span className="absolute -inset-2 rounded-full bg-amber-500/40 animate-ping pointer-events-none" />
                        {/* Inner Marker Circle */}
                        <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-white ring-2 ring-amber-500/50">
                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap border border-slate-700/60 text-center space-y-0.5">
                          <span className="font-extrabold block text-amber-400">{marker.title}</span>
                          <span className="text-[10px] text-slate-300 font-medium block">Ver detalhes da avaria</span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-slate-900/95 rotate-45 -mt-1.5 border-r border-b border-slate-700/60" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Control Bar - Strictly ◀, ▶, Giro Automático (No frame counter) */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 flex items-center justify-center gap-3 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentFrame360(prev => {
                      const total = project360.images.length;
                      return (prev - 1 + total) % total;
                    });
                  }}
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying360(!isPlaying360)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  {isPlaying360 ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Giro Automático</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentFrame360(prev => {
                      const total = project360.images.length;
                      return (prev + 1) % total;
                    });
                  }}
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Próximo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* GRACEFUL FALLBACK TO STANDARD STATIC SILHOUETTE HOTSPOTS */
            <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl overflow-hidden h-[300px] sm:h-[420px] flex items-center justify-center border border-slate-300">
              {/* Base car silhouette */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEA_foNZyYrsrpZs8dtn8WPSDQhjQfLW6nQ5AE7a86qaoRG8gSdNTKeWBS7p1AAguADy_wp0PSNjaXvsrzJkoy3RxU6NDmxyn4bu3XS6f2_T09n8ZINYQpf_C5mcdUE9ZwIHhhR8gfI7HBtmu3A2hIUSnw4PcQhDg4C6g0Es8qNN3RnLbSP6DQ0UeKcY2MUPwKnpLt59DoPlkpIW4Mk2MdtAI7JO1O7Dp5mJeIhXZK7FB8CkfBBps5X58c-8Id7a5suQkP46sP5LA"
                alt="Car profile"
                className="max-h-[85%] object-contain select-none pointer-events-none opacity-90"
                referrerPolicy="no-referrer"
              />

              {/* Overlaid Hotspots */}
              {hotspots.map((h) => {
                const isActive = activeHotspot === h.id;
                return (
                  <div
                    key={h.id}
                    style={{ top: h.top, left: h.left }}
                    className="absolute z-20 group"
                  >
                    {/* Pulsing trigger circle */}
                    <button
                      onClick={() => setActiveHotspot(isActive ? null : h.id)}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center cursor-pointer font-bold text-xs shadow-md transition-all ${
                        isActive ? 'bg-red-600 text-white scale-110' : 'bg-slate-900 text-white hover:bg-red-600 hover:scale-105'
                      }`}
                    >
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </button>

                    {/* Tooltip Card */}
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-52 sm:w-64 bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-800 transition-all duration-300 pointer-events-none ${
                        isActive ? 'opacity-100 transform translate-y-0 scale-100 visible' : 'opacity-0 transform translate-y-2 scale-95 invisible'
                      }`}
                    >
                      <h5 className="font-bold text-xs uppercase tracking-wider text-red-500 mb-1">
                        {h.title}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {h.desc}
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* INLINE POINTS OF INTEREST AND AVARIAS PANEL */}
          <div id="poi-panel-section">
            <ClientPoiPanel
              hotspots={hotspots360}
              markers={markers360}
              selectedHotspot={selectedInlineHotspot}
              selectedMarker={selectedInlineMarker}
              onSelectHotspot={(h) => {
                setSelectedInlineHotspot(h);
                if (h) {
                  setSelectedPoiModalId(h.id);
                }
              }}
              onSelectMarker={(marker) => setSelectedInlineMarker(marker)}
              onRotateToFrame={(frameIdx) => setCurrentFrame360(frameIdx)}
              onOpenLightbox={(url) => {
                setLightboxImage(url);
                setLightboxZoom(1);
                setLightboxPan({ x: 0, y: 0 });
              }}
              activeTab={activePoiTab}
              onTabChange={(tab) => setActivePoiTab(tab)}
            />
          </div>
        </section>

        {/* Content sections: About, Features & Technical Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: About & Itens de Serie */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Description Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xl text-slate-900">Sobre este Veículo</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {car.description}
              </p>
            </div>

            {/* Features (Itens de serie) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-extrabold text-xl text-slate-900">Itens de Série &amp; Acessórios</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {car.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-700 text-sm">
                    <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Ficha tecnica & Proposal Form */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Technical spec card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h3 className="font-extrabold text-lg text-slate-900">Ficha Técnica</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Cor</span>
                  <span className="font-bold text-slate-800">{car.color}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Final da Placa</span>
                  <span className="font-bold text-slate-800">{car.plateEnd}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Motor</span>
                  <span className="font-bold text-slate-800">1.0 / 2.0 Turbo</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Portas</span>
                  <span className="font-bold text-slate-800">4 Portas</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Procedência</span>
                  <span className="font-bold text-emerald-600">Laudo Cautelar Aprovado</span>
                </div>
              </div>
            </div>

            {/* Lead contact proposal form */}
            <div id="proposta-form" className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <h3 className="font-bold text-lg text-white mb-2">Simular Financiamento ou Proposta</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Envie seus dados e nossos especialistas entrarão em contato para simular parcelas ou agendar o test-drive.
              </p>

              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-800/80 p-6 rounded-xl border border-emerald-500/20 text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Proposta Recebida!</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Obrigado. Salvamos sua proposta com sucesso no painel administrativo e um consultor entrará em contato via WhatsApp/E-mail em breve.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">WhatsApp / Telefone</label>
                      <input
                        type="tel"
                        required
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">E-mail</label>
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-semibold">Sua Mensagem</label>
                    <textarea
                      rows={3}
                      value={leadMessage}
                      onChange={(e) => setLeadMessage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Proposta</span>
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX WITH ZOOM & PAN */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex items-center justify-center select-none"
            onClick={() => {
              setLightboxImage(null);
              setLightboxZoom(1);
              setLightboxPan({ x: 0, y: 0 });
            }}
          >
            {/* Top Toolbar */}
            <div 
              className="absolute top-4 right-4 z-70 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxZoom(prev => Math.min(prev + 0.5, 3))}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(prev => {
                    const n = Math.max(prev - 0.5, 1);
                    if (n === 1) setLightboxPan({ x: 0, y: 0 });
                    return n;
                  });
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Resetar Zoom"
              >
                100%
              </button>
              <div className="w-px h-5 bg-slate-800 my-auto" />
              <button
                type="button"
                onClick={() => {
                  setLightboxImage(null);
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                }}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Fechar (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lightbox Image Stage */}
            <div 
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-4"
              onWheel={(e) => {
                e.stopPropagation();
                if (e.deltaY < 0) {
                  setLightboxZoom(prev => Math.min(prev + 0.25, 3));
                } else {
                  setLightboxZoom(prev => {
                    const n = Math.max(prev - 0.25, 1);
                    if (n === 1) setLightboxPan({ x: 0, y: 0 });
                    return n;
                  });
                }
              }}
              onMouseDown={(e) => {
                if (lightboxZoom > 1) {
                  e.stopPropagation();
                  setIsDraggingLightbox(true);
                  lightboxDragStart.current = { x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y };
                }
              }}
              onMouseMove={(e) => {
                if (isDraggingLightbox && lightboxZoom > 1) {
                  e.stopPropagation();
                  setLightboxPan({
                    x: e.clientX - lightboxDragStart.current.x,
                    y: e.clientY - lightboxDragStart.current.y
                  });
                }
              }}
              onMouseUp={() => setIsDraggingLightbox(false)}
              onMouseLeave={() => setIsDraggingLightbox(false)}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={lightboxImage} 
                alt="Detalhe em Tela Cheia"
                style={{
                  transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                  transition: isDraggingLightbox ? 'none' : 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-full object-contain select-none pointer-events-auto shadow-2xl rounded-lg"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN VEHICLE GALLERY LIGHTBOX */}
      <AnimatePresence>
        {galleryLightboxIndex !== null && car.images && car.images.length > 0 && (
          <div 
            className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-6 select-none"
            onClick={() => {
              setGalleryLightboxIndex(null);
              setGalleryZoom(1);
              setGalleryPan({ x: 0, y: 0 });
            }}
          >
            {/* Top Toolbar */}
            <div 
              className="w-full flex items-center justify-between z-70 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                  {car.brand} {car.model}
                </span>
                <span className="text-xs font-mono font-bold text-red-500 bg-red-950/80 border border-red-800/60 px-2.5 py-0.5 rounded-full">
                  {galleryLightboxIndex + 1} / {car.images.length}
                </span>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setGalleryZoom(prev => Math.min(prev + 0.5, 3))}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryZoom(prev => {
                      const n = Math.max(prev - 0.5, 1);
                      if (n === 1) setGalleryPan({ x: 0, y: 0 });
                      return n;
                    });
                  }}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Reduzir Zoom"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGalleryZoom(1);
                    setGalleryPan({ x: 0, y: 0 });
                  }}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer hidden sm:block"
                  title="Resetar Zoom"
                >
                  100%
                </button>
                <div className="w-px h-5 bg-slate-800 my-auto" />
                <button
                  type="button"
                  onClick={() => {
                    setGalleryLightboxIndex(null);
                    setGalleryZoom(1);
                    setGalleryPan({ x: 0, y: 0 });
                  }}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Fechar (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Stage with Navigation Chevrons */}
            <div className="relative flex-1 w-full flex items-center justify-center my-2 overflow-hidden">
              {/* Previous Image Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryLightboxIndex(prev => prev !== null ? (prev - 1 + car.images.length) % car.images.length : 0);
                  setGalleryZoom(1);
                  setGalleryPan({ x: 0, y: 0 });
                }}
                className="absolute left-2 sm:left-4 z-70 p-3.5 bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700/80 rounded-2xl shadow-2xl transition-all cursor-pointer active:scale-95"
                title="Imagem Anterior (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Main Image Stage */}
              <div 
                className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-2"
                onTouchStart={(e) => {
                  touchStartX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (touchStartX.current !== null) {
                    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                    if (deltaX > 50) {
                      setGalleryLightboxIndex(prev => prev !== null ? (prev - 1 + car.images.length) % car.images.length : 0);
                      setGalleryZoom(1);
                      setGalleryPan({ x: 0, y: 0 });
                    } else if (deltaX < -50) {
                      setGalleryLightboxIndex(prev => prev !== null ? (prev + 1) % car.images.length : 0);
                      setGalleryZoom(1);
                      setGalleryPan({ x: 0, y: 0 });
                    }
                    touchStartX.current = null;
                  }
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  if (e.deltaY < 0) {
                    setGalleryZoom(prev => Math.min(prev + 0.25, 3));
                  } else {
                    setGalleryZoom(prev => {
                      const n = Math.max(prev - 0.25, 1);
                      if (n === 1) setGalleryPan({ x: 0, y: 0 });
                      return n;
                    });
                  }
                }}
                onMouseDown={(e) => {
                  if (galleryZoom > 1) {
                    e.stopPropagation();
                    setIsDraggingGallery(true);
                    galleryDragStart.current = { x: e.clientX - galleryPan.x, y: e.clientY - galleryPan.y };
                  }
                }}
                onMouseMove={(e) => {
                  if (isDraggingGallery && galleryZoom > 1) {
                    e.stopPropagation();
                    setGalleryPan({
                      x: e.clientX - galleryDragStart.current.x,
                      y: e.clientY - galleryDragStart.current.y
                    });
                  }
                }}
                onMouseUp={() => setIsDraggingGallery(false)}
                onMouseLeave={() => setIsDraggingGallery(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.img 
                  key={galleryLightboxIndex}
                  src={car.images[galleryLightboxIndex]} 
                  alt={`${car.brand} ${car.model} - foto ${galleryLightboxIndex + 1}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    transform: `translate(${galleryPan.x}px, ${galleryPan.y}px) scale(${galleryZoom})`,
                    transition: isDraggingGallery ? 'none' : 'transform 0.15s ease-out'
                  }}
                  className="max-w-full max-h-full object-contain select-none pointer-events-auto shadow-2xl rounded-2xl"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Next Image Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryLightboxIndex(prev => prev !== null ? (prev + 1) % car.images.length : 0);
                  setGalleryZoom(1);
                  setGalleryPan({ x: 0, y: 0 });
                }}
                className="absolute right-2 sm:right-4 z-70 p-3.5 bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700/80 rounded-2xl shadow-2xl transition-all cursor-pointer active:scale-95"
                title="Próxima Imagem (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Thumbnails Strip */}
            <div 
              className="w-full max-w-4xl mx-auto z-70 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-2 sm:p-3 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin py-0.5 px-1">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setGalleryLightboxIndex(idx);
                      setActiveImage(img);
                      setGalleryZoom(1);
                      setGalleryPan({ x: 0, y: 0 });
                    }}
                    className={`relative w-16 sm:w-20 aspect-video rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      galleryLightboxIndex === idx ? 'border-red-500 scale-105 shadow-lg ring-2 ring-red-500/50' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* POI High-Resolution Photo Viewer Modal */}
      {selectedPoiModalId && (
        <PoiPhotoModal
          hotspots={hotspots360}
          currentHotspotId={selectedPoiModalId}
          onClose={() => setSelectedPoiModalId(null)}
          onSelectHotspot={(h) => setSelectedPoiModalId(h.id)}
          onRotateToFrame={(frame) => setCurrentFrame360(frame)}
        />
      )}
    </div>
  );
}
