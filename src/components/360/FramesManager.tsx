import React, { useState } from 'react';
import { Upload, ChevronLeft, ChevronRight, Trash2, Image as ImageIcon } from 'lucide-react';
import { vehicle360Service } from '../../services/vehicle360.service';

interface FramesManagerProps {
  vehicleId: string;
  frames: string[];
  totalFramesConfig: number;
  currentFrame: number;
  onSelectFrame: (index: number) => void;
  onSaveFrames: (newFrames: string[]) => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const FramesManager: React.FC<FramesManagerProps> = ({
  vehicleId,
  frames,
  totalFramesConfig,
  currentFrame,
  onSelectFrame,
  onSaveFrames,
  onShowToast
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Sort files by name sequentially
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    setIsUploading(true);
    setUploadProgress(1);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const url = await vehicle360Service.upload360Frame(vehicleId, imageFiles[i]);
        uploadedUrls.push(url);
        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      const updated = [...frames, ...uploadedUrls];
      await onSaveFrames(updated);
      onShowToast(`✓ ${uploadedUrls.length} frame(s) adicionados com sucesso!`);
    } catch (err) {
      console.error('Error uploading 360 frames:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleMoveFrame = async (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= frames.length) return;

    const newFrames = [...frames];
    const temp = newFrames[index];
    newFrames[index] = newFrames[targetIdx];
    newFrames[targetIdx] = temp;

    await onSaveFrames(newFrames);
    onSelectFrame(targetIdx);
  };

  const handleRemoveFrame = async (index: number) => {
    if (!confirm(`Remover frame #${index + 1}?`)) return;

    const newFrames = frames.filter((_, i) => i !== index);
    await onSaveFrames(newFrames);
    if (currentFrame >= newFrames.length && newFrames.length > 0) {
      onSelectFrame(newFrames.length - 1);
    }
  };

  return (
    <div className="space-y-5 select-none">
      {/* Upload Drop Zone */}
      <div className="border-2 border-dashed border-slate-200 hover:border-red-600 rounded-2xl p-5 text-center transition-colors bg-slate-50/50 relative cursor-pointer">
        <input
          type="file"
          id="360-frames-input"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="360-frames-input" className="cursor-pointer block space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-slate-800 block">
              Arraste ou selecione fotos do giro 360°
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Recomendado: {totalFramesConfig} imagens em ordem (ex: 01.jpg, 02.jpg)
            </span>
          </div>
        </label>
      </div>

      {isUploading && uploadProgress !== null && (
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Enviando frames...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Grid of frames */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
          <span>Frames ({frames.length} de {totalFramesConfig})</span>
        </div>

        <div className="grid grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
          {frames.map((url, idx) => (
            <div
              key={idx}
              onClick={() => onSelectFrame(idx)}
              className={`relative aspect-video rounded-xl border-2 overflow-hidden cursor-pointer group transition-all ${
                currentFrame === idx ? 'border-red-600 ring-2 ring-red-200 shadow-md scale-95' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <img src={url} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute bottom-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                #{idx + 1}
              </span>

              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveFrame(idx, 'left');
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
                    handleRemoveFrame(idx);
                  }}
                  className="p-1 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveFrame(idx, 'right');
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
  );
};
