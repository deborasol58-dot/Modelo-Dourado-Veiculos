import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, 
  ChevronDown, ChevronUp, Camera, Upload, Trash2, 
  Check, X, Loader2, Save, FileText, Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { VehicleInspectionItem, TechnicalInspectionStatus, InspectionCategory } from '../types';
import { inspectionService, DEFAULT_INSPECTION_STRUCTURE } from '../services/inspectionService';

interface TechnicalInspectionModuleProps {
  projectId: string; // vehicleId
  onInspectionChange?: (items: VehicleInspectionItem[]) => void;
}

export default function TechnicalInspectionModule({ projectId, onInspectionChange }: TechnicalInspectionModuleProps) {
  const [items, setItems] = useState<VehicleInspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Accordion open/close states
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Exterior: true,
    Interior: true
  });

  // Selected item being edited in the side card
  const [selectedItem, setSelectedItem] = useState<VehicleInspectionItem | null>(null);
  // Draft state while editing in the card
  const [draftStatus, setDraftStatus] = useState<TechnicalInspectionStatus>('Não avaliado');
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [draftPhotos, setDraftPhotos] = useState<string[]>([]);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Load inspection items on mount or when projectId changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const fetched = await inspectionService.getInspection(projectId);
        if (isMounted) {
          setItems(fetched);
          if (onInspectionChange) onInspectionChange(fetched);
        }
      } catch (err) {
        console.error('Error loading technical inspection:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // When an item is clicked to edit
  const handleSelectItem = (item: VehicleInspectionItem) => {
    setSelectedItem(item);
    setDraftStatus(item.status);
    setDraftNotes(item.notes || '');
    setDraftPhotos([...(item.photos || [])]);
    setSaveFeedback(false);
  };

  // Close the card
  const handleCancelEdit = () => {
    setSelectedItem(null);
    setSaveFeedback(false);
  };

  // Save the item to Supabase & local state
  const handleSaveItem = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      const updatedItem: VehicleInspectionItem = {
        ...selectedItem,
        status: draftStatus,
        notes: draftNotes,
        photos: draftPhotos,
        updatedAt: new Date().toISOString()
      };

      const saved = await inspectionService.saveInspectionItem(updatedItem);

      const nextItems = items.map(i => 
        (i.category === saved.category && i.itemName === saved.itemName) ? saved : i
      );

      setItems(nextItems);
      setSelectedItem(saved);
      if (onInspectionChange) onInspectionChange(nextItems);

      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch (err) {
      console.error('Error saving inspection item:', err);
    } finally {
      setSaving(false);
    }
  };

  // Upload multiple photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !selectedItem) return;

    setUploadingPhotos(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await inspectionService.uploadInspectionPhoto(projectId, file);
        uploadedUrls.push(url);
      }
      setDraftPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error('Error uploading inspection photos:', err);
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Remove a photo from the draft
  const handleRemovePhoto = (indexToRemove: number) => {
    setDraftPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Toggle Accordion
  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Calculations for progress bar and stats
  const totalItems = items.length;
  const evaluatedItems = useMemo(() => {
    return items.filter(i => i.status !== 'Não avaliado').length;
  }, [items]);

  const percentage = totalItems > 0 ? Math.round((evaluatedItems / totalItems) * 100) : 0;

  const statusCounts = useMemo(() => {
    let ok = 0;
    let atencao = 0;
    let problema = 0;
    let naoAvaliado = 0;

    for (const it of items) {
      if (it.status === 'OK') ok++;
      else if (it.status === 'Atenção') atencao++;
      else if (it.status === 'Problema') problema++;
      else naoAvaliado++;
    }

    return { ok, atencao, problema, naoAvaliado };
  }, [items]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Carregando checklist de inspeção técnica...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. PROGRESS BAR & STATS TOP HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-black text-base tracking-tight text-white">Inspeção Técnica</h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Avaliação de conformidade e integridade física do veículo
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white tracking-tight">
              {percentage}%
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              {evaluatedItems} de {totalItems} itens avaliados
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentage === 100 
                  ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                  : percentage > 50 
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-amber-500 to-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Quick status counter pills */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
          <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">○ Pendente</span>
            <span className="text-xs font-black text-slate-300">{statusCounts.naoAvaliado}</span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-emerald-400 block uppercase">🟢 OK</span>
            <span className="text-xs font-black text-emerald-300">{statusCounts.ok}</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">🟡 Atenção</span>
            <span className="text-xs font-black text-amber-300">{statusCounts.atencao}</span>
          </div>
          <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-2 text-center">
            <span className="text-[10px] font-bold text-red-400 block uppercase">🔴 Problema</span>
            <span className="text-xs font-black text-red-300">{statusCounts.problema}</span>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE ITEM EDIT CARD (INLINE, NO MODAL) */}
      {selectedItem && (
        <div className="bg-white border-2 border-red-500/80 rounded-3xl p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full inline-block border border-red-100">
                {selectedItem.category}
              </span>
              <h4 className="font-extrabold text-lg text-slate-900 mt-1">
                {selectedItem.itemName}
              </h4>
            </div>
            <button
              onClick={handleCancelEdit}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Fechar editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status selector buttons */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-2">
              Estado de Conservação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'Não avaliado', label: 'Não avaliado', icon: '○', color: 'border-slate-300 text-slate-700 hover:bg-slate-50', activeColor: 'bg-slate-900 text-white border-slate-900 shadow-sm' },
                { value: 'OK', label: 'OK', icon: '🟢', color: 'border-emerald-200 text-emerald-800 hover:bg-emerald-50', activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
                { value: 'Atenção', label: 'Atenção', icon: '🟡', color: 'border-amber-200 text-amber-800 hover:bg-amber-50', activeColor: 'bg-amber-500 text-white border-amber-500 shadow-sm' },
                { value: 'Problema', label: 'Problema', icon: '🔴', color: 'border-red-200 text-red-800 hover:bg-red-50', activeColor: 'bg-red-600 text-white border-red-600 shadow-sm' }
              ].map(opt => {
                const isSelected = draftStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDraftStatus(opt.value as TechnicalInspectionStatus)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected ? opt.activeColor : `bg-white ${opt.color}`
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações / Notes Field */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observações</span>
            </label>
            <textarea
              rows={3}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Descreva detalhes, arranhões, desgastes ou observações deste item..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:bg-white focus:outline-none focus:border-red-600 transition-colors resize-none"
            />
          </div>

          {/* Fotos / Evidence Upload */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-600 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span>Fotos e Evidências</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                {draftPhotos.length} {draftPhotos.length === 1 ? 'foto' : 'fotos'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              <input
                type="file"
                id="tech-inspection-photo-uploader"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhotos}
              />
              <label
                htmlFor="tech-inspection-photo-uploader"
                className={`w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 hover:border-red-600 bg-slate-50 hover:bg-red-50/40 text-slate-400 hover:text-red-600 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  uploadingPhotos ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {uploadingPhotos ? (
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="text-[9px] font-bold mt-0.5">Anexar</span>
                  </>
                )}
              </label>

              {draftPhotos.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden group shadow-sm bg-slate-100">
                  <img src={url} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-lg opacity-90 group-hover:opacity-100 hover:bg-red-700 transition-opacity cursor-pointer shadow"
                    title="Remover foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Salvar & Cancelar */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveItem}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-red-600 disabled:bg-slate-300 text-white text-xs font-extrabold uppercase rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : saveFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Item Salvo!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* 3. ACCORDION CHECKLIST GROUPS */}
      <div className="space-y-4">
        {DEFAULT_INSPECTION_STRUCTURE.map(group => {
          const isExpanded = expandedGroups[group.category] ?? true;
          const groupItems = items.filter(i => i.category === group.category);
          const groupEvaluated = groupItems.filter(i => i.status !== 'Não avaliado').length;
          const isGroupComplete = groupItems.length > 0 && groupEvaluated === groupItems.length;

          return (
            <div key={group.category} className="bg-slate-50/70 border border-slate-200/80 rounded-3xl overflow-hidden transition-all">
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.category)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-100/70 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                    isGroupComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {group.category === 'Exterior' ? 'EXT' : 'INT'}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">
                      {group.category}
                    </h5>
                    <span className="text-[11px] font-bold text-slate-400">
                      {groupEvaluated} de {groupItems.length} avaliados
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    isGroupComplete 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}>
                    {groupEvaluated}/{groupItems.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Accordion Body: Items list */}
              {isExpanded && (
                <div className="p-3 pt-0 grid grid-cols-1 gap-1.5 border-t border-slate-200/40">
                  {groupItems.map(item => {
                    const isSelected = selectedItem?.category === item.category && selectedItem?.itemName === item.itemName;
                    
                    return (
                      <div
                        key={item.id || item.itemName}
                        onClick={() => handleSelectItem(item)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-red-50/60 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                            : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Status Icon */}
                          <div className="shrink-0">
                            {item.status === 'OK' && (
                              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-xs" title="OK">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {item.status === 'Atenção' && (
                              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-xs" title="Atenção">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {item.status === 'Problema' && (
                              <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold text-xs" title="Problema">
                                <XCircle className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {item.status === 'Não avaliado' && (
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-[10px] font-bold" title="Não avaliado">
                                ○
                              </div>
                            )}
                          </div>

                          <div className="truncate">
                            <span className="font-bold text-xs text-slate-800 block truncate">
                              {item.itemName}
                            </span>
                            <span className={`text-[10px] font-bold block ${
                              item.status === 'OK' ? 'text-emerald-600' :
                              item.status === 'Atenção' ? 'text-amber-600' :
                              item.status === 'Problema' ? 'text-red-600' :
                              'text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* Extra indicators: Notes and Photos */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.notes && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title="Possui observação">
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>Obs</span>
                            </span>
                          )}
                          {item.photos && item.photos.length > 0 && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title={`${item.photos.length} fotos anexadas`}>
                              <Camera className="w-3 h-3 text-blue-500" />
                              <span>{item.photos.length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
