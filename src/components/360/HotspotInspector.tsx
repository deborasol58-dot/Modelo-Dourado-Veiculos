import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Edit3, Trash2, Copy, Move, Upload, 
  Layers, CheckCircle2, AlertCircle, Eye, X, Image as ImageIcon,
  Tag, Sparkles, Send, Plus
} from 'lucide-react';
import { DamageMarker, DamageCategory } from '../../types';
import { getMarkerPositionForFrame, propagateMarkerPositions } from '../../utils/markerUtils';
import { vehicle360Service } from '../../services/vehicle360.service';

interface HotspotInspectorProps {
  marker: DamageMarker;
  vehicleId: string;
  currentFrame: number;
  totalFrames: number;
  onClose: () => void;
  onEditPosition: () => void;
  onSaveMarker: (updatedMarker: DamageMarker) => Promise<void>;
  onDeleteMarker: (markerId: string) => Promise<void>;
  onDuplicateMarker: (marker: DamageMarker) => Promise<void>;
  onShowToast: (msg: string) => void;
}

const CATEGORIES: DamageCategory[] = [
  'Arranhão',
  'Amassado',
  'Parachoque',
  'Farol',
  'Lanterna',
  'Pneu',
  'Roda',
  'Retrovisor',
  'Capô',
  'Teto',
  'Vidro',
  'Outro'
];

export const HotspotInspector: React.FC<HotspotInspectorProps> = ({
  marker,
  vehicleId,
  currentFrame,
  totalFrames,
  onClose,
  onEditPosition,
  onSaveMarker,
  onDeleteMarker,
  onDuplicateMarker,
  onShowToast
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [title, setTitle] = useState(marker.title);
  const [category, setCategory] = useState<DamageCategory>(marker.category);
  const [description, setDescription] = useState(marker.description);
  const [damageImages, setDamageImages] = useState<string[]>(marker.damageImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Position status for current frame
  const posInfo = getMarkerPositionForFrame(marker, currentFrame);

  // Save textual details change
  const handleSaveTextDetails = async () => {
    try {
      await onSaveMarker({
        ...marker,
        title,
        category,
        description,
        damageImages
      });
      setIsEditingText(false);
      onShowToast('✓ Detalhes salvos!');
    } catch (err) {
      console.error('Error saving marker text details:', err);
    }
  };

  // Upload evidence image
  const handleImageUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileList) {
        const url = await vehicle360Service.uploadDamageImage(vehicleId, file);
        uploadedUrls.push(url);
      }
      const newImages = [...damageImages, ...uploadedUrls];
      setDamageImages(newImages);

      await onSaveMarker({
        ...marker,
        damageImages: newImages
      });

      onShowToast(`✓ ${uploadedUrls.length} imagem(ns) adicionada(s)!`);
    } catch (err) {
      console.error('Error uploading damage image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Remove evidence image
  const handleRemoveImage = async (indexToRemove: number) => {
    const updated = damageImages.filter((_, idx) => idx !== indexToRemove);
    setDamageImages(updated);
    try {
      await onSaveMarker({
        ...marker,
        damageImages: updated
      });
      onShowToast('✓ Imagem removida!');
    } catch (err) {
      console.error('Error removing damage image:', err);
    }
  };

  // Handle Propagate Forward
  const handlePropagate = async (count: number | 'end') => {
    const updatedPositions = propagateMarkerPositions(marker, currentFrame, count, totalFrames);
    try {
      await onSaveMarker({
        ...marker,
        framePositions: updatedPositions
      });
      onShowToast(count === 'end' ? '✓ Posição rastreada até o fim!' : `✓ Posição propagada por +${count} frames!`);
    } catch (err) {
      console.error('Error propagating marker:', err);
    }
  };

  const registeredKeyframeList = Object.keys(marker.framePositions || {}).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col h-full space-y-5 select-none">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar p/ Lista</span>
        </button>

        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">
          Inspector de Hotspot
        </span>
      </div>

      {/* Main Details Header */}
      {!isEditingText ? (
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md mb-1">
                <Tag className="w-3 h-3 text-red-500" />
                {marker.category}
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                {marker.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingText(true)}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 cursor-pointer shadow-xs transition-colors"
              title="Editar Título / Categoria"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {marker.description || 'Sem descrição cadastrada.'}
          </p>
        </div>
      ) : (
        /* Edit Text Form */
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-red-200">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Título do Ponto</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria de Avaria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DamageCategory)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-red-600 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-red-600 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveTextDetails}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Salvar Alterações
            </button>
            <button
              type="button"
              onClick={() => setIsEditingText(false)}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Frame Position Inspector Card */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-500" />
            <span>Posição no Frame {currentFrame + 1}</span>
          </span>

          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
            posInfo.status === 'confirmed'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : posInfo.status === 'interpolated'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {posInfo.status === 'confirmed' ? '🟢 Keyframe Confirmado' : posInfo.status === 'interpolated' ? '🟡 Tracking Interpolado' : '⚪ Fora de Alcance'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-medium">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Eixo X (Largura)</span>
            <span className="font-extrabold text-sm text-red-400">{posInfo.posX}%</span>
          </div>

          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Eixo Y (Altura)</span>
            <span className="font-extrabold text-sm text-red-400">{posInfo.posY}%</span>
          </div>
        </div>

        {/* Action button to adjust position */}
        <button
          type="button"
          onClick={onEditPosition}
          className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <Move className="w-4 h-4" />
          <span>Ajustar Posição neste Frame</span>
        </button>

        {/* Keyframe Propagation helper */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Propagar Rastreamento</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handlePropagate(5)}
              className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 cursor-pointer"
            >
              +5 Frames Adiante
            </button>
            <button
              type="button"
              onClick={() => handlePropagate('end')}
              className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 cursor-pointer"
            >
              Até o Fim
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes Registered Overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-red-600" />
            <span>Keyframes Gravados ({registeredKeyframeList.length})</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
          {registeredKeyframeList.map((fIdx) => (
            <span
              key={fIdx}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border ${
                fIdx === currentFrame
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              F{fIdx + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Evidence Gallery (Evidências de Avaria) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Fotos de Evidência ({damageImages.length})</span>
          </span>

          <label className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer border border-blue-200 flex items-center gap-1">
            <Upload className="w-3 h-3" />
            <span>Adicionar Foto</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {/* Gallery Thumbnails */}
        {damageImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {damageImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100"
              >
                <img src={imgUrl} alt={`Avaria ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewImage(imgUrl)}
                    className="p-1 bg-white text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                    title="Ampliar"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                    title="Excluir foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 font-medium bg-slate-50">
            Nenhuma foto de evidência anexada a este hotspot.
          </div>
        )}

        {isUploading && (
          <div className="text-xs font-bold text-blue-600 animate-pulse flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 animate-bounce" />
            <span>Enviando fotos de evidência...</span>
          </div>
        )}
      </div>

      {/* Inspector Bottom Actions (Duplicar, Excluir) */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 mt-auto">
        <button
          type="button"
          onClick={() => onDuplicateMarker(marker)}
          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm(`Deseja realmente excluir o hotspot "${marker.title}"?`)) {
              onDeleteMarker(marker.id);
            }
          }}
          className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-red-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Evidência ampliada" className="w-full max-h-[80vh] object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  );
};
