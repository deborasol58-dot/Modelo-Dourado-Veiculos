import React from 'react';
import { 
  Camera, Eye, RotateCcw, Maximize2, ShieldCheck, 
  ChevronRight, AlertCircle, ArrowLeft, Layers
} from 'lucide-react';
import { VehicleHotspot, DamageMarker } from '../types';

interface ClientPoiPanelProps {
  hotspots: VehicleHotspot[];
  markers: DamageMarker[];
  selectedHotspot: VehicleHotspot | null;
  selectedMarker: DamageMarker | null;
  onSelectHotspot: (hotspot: VehicleHotspot | null) => void;
  onSelectMarker: (marker: DamageMarker | null) => void;
  onRotateToFrame?: (frameIndex: number) => void;
  onOpenLightbox: (imageUrl: string, title?: string) => void;
  activeTab: 'pois' | 'avarias';
  onTabChange: (tab: 'pois' | 'avarias') => void;
}

export default function ClientPoiPanel({
  hotspots,
  markers,
  selectedHotspot,
  selectedMarker,
  onSelectHotspot,
  onSelectMarker,
  onRotateToFrame,
  onOpenLightbox,
  activeTab,
  onTabChange
}: ClientPoiPanelProps) {
  return (
    <div id="poi-panel-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      {/* Header & Overall Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
              <Camera className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                Pontos de Interesse 360°
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Fotos técnicas e detalhes do veículo vinculados aos ângulos do visualizador 360°.
              </p>
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-black text-slate-800">
            {hotspots.length} {hotspots.length === 1 ? 'Ponto Mapeado' : 'Pontos Mapeados'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs if markers exist */}
      {markers.length > 0 && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              onTabChange('pois');
              onSelectMarker(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pois'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Pontos de Interesse ({hotspots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onTabChange('avarias');
              onSelectHotspot(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'avarias'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Avarias Identificadas ({markers.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: PONTOS DE INTERESSE (FOTOS TÉCNICAS) */}
      {activeTab === 'pois' && (
        <div>
          {hotspots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotspots.map(hotspot => (
                <div
                  key={hotspot.id}
                  onClick={() => {
                    onSelectHotspot(hotspot);
                    if (onRotateToFrame && hotspot.frameNumber != null) {
                      onRotateToFrame(hotspot.frameNumber);
                    }
                  }}
                  className="group bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-red-500/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={hotspot.imageUrl}
                      alt={hotspot.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Frame indicator pill */}
                    <div className="absolute bottom-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 shadow-xs">
                      <RotateCcw className="w-3 h-3 text-red-400" />
                      <span>Frame {hotspot.frameNumber + 1}</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="p-1.5 rounded-lg bg-red-600 text-white shadow-md flex items-center justify-center">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-red-600 transition-colors truncate">
                        {hotspot.title}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                        Clique para ampliar foto técnica
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-red-50 text-slate-500 group-hover:text-red-600 flex items-center justify-center transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-500 text-sm border border-slate-200/80 space-y-2">
              <Camera className="w-10 h-10 text-slate-400 mx-auto stroke-1" />
              <p className="font-bold text-slate-700">Nenhum ponto de interesse cadastrado ainda.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                As fotos técnicas deste veículo poderão ser visualizadas diretamente sobre o giro 360°.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVARIAS IDENTIFICADAS */}
      {activeTab === 'avarias' && (
        <div className="space-y-6">
          {selectedMarker ? (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl animate-fadeIn">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60 inline-block">
                    {selectedMarker.category || 'Avaria'}
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {selectedMarker.title}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectMarker(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar à Lista</span>
                </button>
              </div>

              {/* Angle Action Button */}
              {onRotateToFrame && selectedMarker.frameIndex != null && (
                <div>
                  <button
                    type="button"
                    onClick={() => onRotateToFrame(selectedMarker.frameIndex)}
                    className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Girar visualizador 360° para este ângulo</span>
                  </button>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Descrição do Dano:</span>
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-slate-300 text-sm leading-relaxed">
                  {selectedMarker.description && selectedMarker.description.trim().length > 0 ? (
                    selectedMarker.description
                  ) : (
                    <span className="text-slate-500 italic">Sem descrição adicional informada.</span>
                  )}
                </div>
              </div>

              {/* Damage Images */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 block">
                  Fotos da Avaria ({selectedMarker.damageImages ? selectedMarker.damageImages.length : 0}):
                </span>

                {selectedMarker.damageImages && selectedMarker.damageImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedMarker.damageImages.map((imgUrl, idx) => (
                      <div 
                        key={idx}
                        className="group relative bg-slate-950 rounded-2xl overflow-hidden aspect-video sm:aspect-square border border-slate-800 cursor-pointer shadow-md"
                        onClick={() => onOpenLightbox(imgUrl, `${selectedMarker.title} - Foto ${idx + 1}`)}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`${selectedMarker.title} - foto ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" />
                            <span>Ampliar</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-6 text-center text-slate-500 text-xs">
                    Nenhuma foto de alta resolução cadastrada para esta avaria.
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectMarker(null)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {markers.map(marker => (
                <div
                  key={marker.id}
                  onClick={() => onSelectMarker(marker)}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold rounded-full">
                        {marker.category || 'Avaria'}
                      </span>
                      {marker.damageImages && marker.damageImages.length > 0 && (
                        <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>{marker.damageImages.length} fotos</span>
                        </span>
                      )}
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-sm group-hover:text-red-600 transition-colors">
                      {marker.title}
                    </h5>
                    {marker.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {marker.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-red-600">
                    <span>Ver detalhes</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
