/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Calendar, Gauge, Settings, Fuel, 
  Check, Send, CheckCircle2, MapPin, Sparkles, MessageCircle,
  Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, LeadMessage, Vehicle360, DamageMarker } from '../types';
import { vehicle360Service } from '../services/vehicle360.service';

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
  
  // Live 360 project and markers from Supabase
  const [project360, setProject360] = useState<Vehicle360 | null>(null);
  const [markers360, setMarkers360] = useState<DamageMarker[]>([]);
  const [loading360, setLoading360] = useState(true);
  const [currentFrame360, setCurrentFrame360] = useState(0);
  const [isPlaying360, setIsPlaying360] = useState(false);
  const [activeMarker, setActiveMarker] = useState<DamageMarker | null>(null);

  // Drag-to-rotate states
  const [isDragging360, setIsDragging360] = useState(false);
  const startX360Ref = useRef(0);
  const currentFrameOnStart360Ref = useRef(0);

  // Load 360 assets
  useEffect(() => {
    const fetch360Data = async () => {
      setLoading360(true);
      try {
        const [proj, marks] = await Promise.all([
          vehicle360Service.get360ByVehicleId(car.id),
          vehicle360Service.getMarkersByVehicleId(car.id)
        ]);
        setProject360(proj);
        setMarkers360(marks);
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
            
            {/* Primary Display image */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-video relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={activeImage}
                  alt={car.model}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              {car.isSold && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
                    onClick={() => setActiveImage(img)}
                    className={`relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activeImage === img ? 'border-red-600 shadow-md' : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
            <div className="h-[300px] sm:h-[420px] bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <RotateCcw className="w-8 h-8 text-red-600 animate-spin mb-2" />
              <span className="text-xs font-bold text-slate-500">Carregando visualização 360°...</span>
            </div>
          ) : project360 && project360.images && project360.images.length > 0 ? (
            /* ACTIVE 360 DEGREE INTERACTIVE INSPECTOR */
            <div className="space-y-4">
              <div 
                onPointerDown={handlePointerDown360}
                onPointerMove={handlePointerMove360}
                onPointerUp={handlePointerUp360}
                onPointerLeave={handlePointerUp360}
                className="relative bg-slate-900 rounded-2xl overflow-hidden h-[300px] sm:h-[450px] flex items-center justify-center border border-slate-800 cursor-grab active:cursor-grabbing select-none touch-none"
              >
                {/* 360 Frame Image */}
                <img 
                  src={project360.images[currentFrame360]} 
                  alt={`Veículo 360° - Frame ${currentFrame360 + 1}`}
                  className="max-h-full max-w-full object-contain pointer-events-none select-none"
                  referrerPolicy="no-referrer"
                />

                {/* Drag Help Overlay */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-200 flex items-center gap-1.5 pointer-events-none shadow-sm">
                  <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                  <span>Arraste para girar o carro</span>
                </div>

                {/* Active Damage Markers for the current frame */}
                {markers360
                  .filter(marker => Number(marker.frameIndex) === currentFrame360)
                  .map(marker => {
                    const isSelected = activeMarker?.id === marker.id;
                    return (
                      <div
                        key={marker.id}
                        style={{ top: `${marker.posY}%`, left: `${marker.posX}%` }}
                        className="absolute z-20"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMarker(isSelected ? null : marker);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            isSelected ? 'bg-red-600 text-white scale-110 shadow-lg ring-4 ring-red-600/30' : 'bg-slate-950/90 text-white hover:bg-red-600'
                          }`}
                          title={marker.title}
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        </button>

                        {/* Interactive tooltip content inside the canvas */}
                        {isSelected && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-950 text-white p-3.5 rounded-xl border border-slate-800 shadow-2xl pointer-events-auto z-30 space-y-2">
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-extrabold text-[11px] text-red-500 uppercase tracking-wide">
                                {marker.category || 'Diferencial'} • {marker.title}
                              </h5>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMarker(null);
                                }}
                                className="text-slate-400 hover:text-white font-black text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {marker.description}
                            </p>

                            {/* Damage Detail Images */}
                            {marker.damageImages && marker.damageImages.length > 0 && (
                              <div className="grid grid-cols-3 gap-1.5 pt-1">
                                {marker.damageImages.map((imgUrl, idx) => (
                                  <a 
                                    key={idx}
                                    href={imgUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="aspect-square rounded-lg overflow-hidden border border-slate-800 hover:border-red-600 transition-colors"
                                  >
                                    <img src={imgUrl} alt="Avaria detalhe" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-slate-950"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Bottom Control Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentFrame360(prev => {
                        const total = project360.images.length;
                        return (prev - 1 + total) % total;
                      });
                    }}
                    className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer shadow-xs"
                    title="Frame Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying360(!isPlaying360)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {isPlaying360 ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
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
                    className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-all cursor-pointer shadow-xs"
                    title="Próximo Frame"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5 text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs">
                  <span>FRAME {currentFrame360 + 1} DE {project360.images.length}</span>
                </div>
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
    </div>
  );
}
