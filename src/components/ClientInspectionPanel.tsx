import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, 
  ChevronDown, ChevronUp, Camera, FileText, 
  Sparkles, RotateCcw, ArrowLeft, Maximize2, ShieldCheck,
  Eye, Check
} from 'lucide-react';
import { VehicleInspectionItem, DamageMarker, TechnicalInspectionStatus } from '../types';

interface ClientInspectionPanelProps {
  items: VehicleInspectionItem[];
  markers: DamageMarker[];
  selectedItem: VehicleInspectionItem | null;
  selectedMarker: DamageMarker | null;
  onSelectItem: (item: VehicleInspectionItem | null) => void;
  onSelectMarker: (marker: DamageMarker | null) => void;
  onSelectFrame?: (frameIndex: number) => void;
  onOpenLightbox: (imageUrl: string) => void;
  inlineTab: 'inspecao' | 'hotspots';
  onTabChange: (tab: 'inspecao' | 'hotspots') => void;
}

export default function ClientInspectionPanel({
  items,
  markers,
  selectedItem,
  selectedMarker,
  onSelectItem,
  onSelectMarker,
  onSelectFrame,
  onOpenLightbox,
  inlineTab,
  onTabChange
}: ClientInspectionPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Exterior: true,
    Interior: true
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Group items by category (Exterior, Interior)
  const exteriorItems = items.filter(i => i.category === 'Exterior');
  const interiorItems = items.filter(i => i.category === 'Interior');

  // Stats calculation
  const totalItems = items.length;
  const okCount = items.filter(i => i.status === 'OK').length;
  const atencaoCount = items.filter(i => i.status === 'Atenção').length;
  const problemaCount = items.filter(i => i.status === 'Problema' || (i as any).status === 'Avaria').length;
  const naoAvaliadoCount = items.filter(i => i.status === 'Não avaliado' || (i as any).status === 'Não Inspecionado').length;
  
  const evaluatedCount = okCount + atencaoCount + problemaCount;
  const completionPercent = totalItems > 0 ? Math.round((evaluatedCount / totalItems) * 100) : 0;

  const getStatusBadge = (status: TechnicalInspectionStatus | string) => {
    switch (status) {
      case 'OK':
        return {
          label: 'Aprovado (OK)',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotBg: 'bg-emerald-500'
        };
      case 'Atenção':
        return {
          label: 'Atenção',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dotBg: 'bg-amber-500'
        };
      case 'Problema':
      case 'Avaria':
        return {
          label: 'Avaria / Reparo',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dotBg: 'bg-rose-500'
        };
      default:
        return {
          label: 'Não avaliado',
          icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          dotBg: 'bg-slate-400'
        };
    }
  };

  return (
    <div id="inspection-panel-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
      {/* Header & Overall Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                Laudo de Inspeção Técnica e Avarias
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Checklist completo com 29 pontos inspecionados e mapeamento detalhado de avarias.
              </p>
            </div>
          </div>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Progresso do Laudo</span>
            <span className="text-sm font-black text-slate-800">{completionPercent}% Concluído ({evaluatedCount}/{totalItems})</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-red-600 shadow-xs">
            {completionPercent}%
          </div>
        </div>
      </div>

      {/* Overview Metric Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-800 block">Aprovados</span>
            <span className="text-lg font-black text-emerald-950">{okCount} <span className="text-xs font-semibold text-emerald-700">itens</span></span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 block">Atenção</span>
            <span className="text-lg font-black text-amber-950">{atencaoCount} <span className="text-xs font-semibold text-amber-700">itens</span></span>
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/60 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-800 block">Avarias</span>
            <span className="text-lg font-black text-rose-950">{problemaCount} <span className="text-xs font-semibold text-rose-700">itens</span></span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-400 text-white flex items-center justify-center shrink-0 shadow-xs">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-600 block">Não Avaliados</span>
            <span className="text-lg font-black text-slate-800">{naoAvaliadoCount} <span className="text-xs font-semibold text-slate-500">itens</span></span>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
        <div style={{ width: `${totalItems ? (okCount / totalItems) * 100 : 0}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Aprovados: ${okCount}`} />
        <div style={{ width: `${totalItems ? (atencaoCount / totalItems) * 100 : 0}%` }} className="bg-amber-500 h-full transition-all duration-500" title={`Atenção: ${atencaoCount}`} />
        <div style={{ width: `${totalItems ? (problemaCount / totalItems) * 100 : 0}%` }} className="bg-rose-500 h-full transition-all duration-500" title={`Avarias: ${problemaCount}`} />
        <div style={{ width: `${totalItems ? (naoAvaliadoCount / totalItems) * 100 : 0}%` }} className="bg-slate-200 h-full transition-all duration-500" title={`Não avaliados: ${naoAvaliadoCount}`} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            onTabChange('inspecao');
            onSelectMarker(null);
          }}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
            inlineTab === 'inspecao'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Checklist de Inspeção ({totalItems})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange('hotspots');
            onSelectItem(null);
          }}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
            inlineTab === 'hotspots'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Hotspots de Danos 360° ({markers.length})</span>
        </button>
      </div>

      {/* TAB 1: CHECKLIST DE INSPEÇÃO PADRONIZADA */}
      {inlineTab === 'inspecao' && (
        <div className="space-y-6">
          {/* If an item is selected, render INLINE detail card */}
          {selectedItem ? (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-800 shadow-xl animate-fadeIn">
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-950/80 text-red-400 border border-red-800/60 inline-block">
                    {selectedItem.category}
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {selectedItem.itemName}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar à Lista</span>
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-400">Avaliação do item:</span>
                {(() => {
                  const badge = getStatusBadge(selectedItem.status);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Notes / Observations */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block">Observações do Inspetor:</span>
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-slate-300 text-sm leading-relaxed">
                  {selectedItem.notes && selectedItem.notes.trim().length > 0 ? (
                    selectedItem.notes
                  ) : (
                    <span className="text-slate-500 italic">Nenhuma observação cadastrada para este item.</span>
                  )}
                </div>
              </div>

              {/* High-Resolution Evidence Photos */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 block">
                  Fotos de Evidência e Detalhes ({selectedItem.photos ? selectedItem.photos.length : 0}):
                </span>

                {selectedItem.photos && selectedItem.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedItem.photos.map((photoUrl, idx) => (
                      <div 
                        key={idx}
                        className="group relative bg-slate-950 rounded-2xl overflow-hidden aspect-video sm:aspect-square border border-slate-800 cursor-pointer shadow-md"
                        onClick={() => onOpenLightbox(photoUrl)}
                      >
                        <img 
                          src={photoUrl} 
                          alt={`${selectedItem.itemName} - foto ${idx + 1}`}
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
                    Nenhuma foto adicional registrada para este item.
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectItem(null)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          ) : (
            /* Standard Accordion Groups: Exterior & Interior */
            <div className="space-y-4">
              {/* EXTERIOR GROUP */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleGroup('Exterior')}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">Exterior</span>
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full font-black text-xs">
                      {exteriorItems.length} itens
                    </span>
                  </div>
                  {expandedGroups['Exterior'] ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {expandedGroups['Exterior'] && (
                  <div className="divide-y divide-slate-100 bg-white">
                    {exteriorItems.map(item => {
                      const badge = getStatusBadge(item.status);
                      const hasPhotos = item.photos && item.photos.length > 0;
                      const hasNotes = item.notes && item.notes.trim().length > 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => onSelectItem(item)}
                          className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badge.dotBg}`} />
                            <div className="truncate">
                              <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-red-600 transition-colors block truncate">
                                {item.itemName}
                              </span>
                              {hasNotes && (
                                <span className="text-[11px] text-slate-500 truncate block mt-0.5 max-w-md">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {hasPhotos && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border border-slate-200">
                                <Camera className="w-3 h-3" />
                                <span>{item.photos.length}</span>
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                              {badge.icon}
                              <span className="hidden sm:inline">{badge.label}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* INTERIOR GROUP */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleGroup('Interior')}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 px-5 py-3.5 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 text-sm sm:text-base">Interior</span>
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full font-black text-xs">
                      {interiorItems.length} itens
                    </span>
                  </div>
                  {expandedGroups['Interior'] ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {expandedGroups['Interior'] && (
                  <div className="divide-y divide-slate-100 bg-white">
                    {interiorItems.map(item => {
                      const badge = getStatusBadge(item.status);
                      const hasPhotos = item.photos && item.photos.length > 0;
                      const hasNotes = item.notes && item.notes.trim().length > 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => onSelectItem(item)}
                          className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badge.dotBg}`} />
                            <div className="truncate">
                              <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-red-600 transition-colors block truncate">
                                {item.itemName}
                              </span>
                              {hasNotes && (
                                <span className="text-[11px] text-slate-500 truncate block mt-0.5 max-w-md">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {hasPhotos && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border border-slate-200">
                                <Camera className="w-3 h-3" />
                                <span>{item.photos.length}</span>
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                              {badge.icon}
                              <span className="hidden sm:inline">{badge.label}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOTSPOTS DE DANOS E AVARIAS */}
      {inlineTab === 'hotspots' && (
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
              {onSelectFrame && selectedMarker.frameIndex != null && (
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectFrame(selectedMarker.frameIndex)}
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
                        onClick={() => onOpenLightbox(imgUrl)}
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
          ) : markers.length > 0 ? (
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
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-500 text-xs sm:text-sm border border-slate-200/80 space-y-1">
              <span className="font-bold text-slate-700 block text-sm">Nenhum ponto de avaria registrado no 360°.</span>
              <span>Todos os pontos avaliados estão descritos no checklist técnico.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
