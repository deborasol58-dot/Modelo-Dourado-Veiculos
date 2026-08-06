import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Camera, Eye } from 'lucide-react';
import { VehicleHotspot } from '../../types';

interface PoiPhotoModalProps {
  hotspots: VehicleHotspot[];
  currentHotspotId: string | null;
  onClose: () => void;
  onSelectHotspot: (hotspot: VehicleHotspot) => void;
  onRotateToFrame?: (frameIndex: number) => void;
}

export default function PoiPhotoModal({
  hotspots,
  currentHotspotId,
  onClose,
  onSelectHotspot,
  onRotateToFrame
}: PoiPhotoModalProps) {
  const activeHotspot = hotspots.find(h => h.id === currentHotspotId) || hotspots[0];
  const currentIndex = activeHotspot ? hotspots.findIndex(h => h.id === activeHotspot.id) : 0;

  const handlePrev = () => {
    if (hotspots.length <= 1) return;
    const prevIdx = (currentIndex - 1 + hotspots.length) % hotspots.length;
    const prevHotspot = hotspots[prevIdx];
    onSelectHotspot(prevHotspot);
    if (onRotateToFrame && prevHotspot.frameNumber != null) {
      onRotateToFrame(prevHotspot.frameNumber);
    }
  };

  const handleNext = () => {
    if (hotspots.length <= 1) return;
    const nextIdx = (currentIndex + 1) % hotspots.length;
    const nextHotspot = hotspots[nextIdx];
    onSelectHotspot(nextHotspot);
    if (onRotateToFrame && nextHotspot.frameNumber != null) {
      onRotateToFrame(nextHotspot.frameNumber);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hotspots]);

  if (!activeHotspot) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 block">
                Ponto de Interesse 360°
              </span>
              <h3 className="font-black text-lg sm:text-xl text-white">
                {activeHotspot.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              {currentIndex + 1} de {hotspots.length} fotos
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High Resolution Image Viewer */}
        <div className="relative flex-1 bg-black/80 flex items-center justify-center min-h-[380px] max-h-[68vh] p-2 overflow-hidden">
          <img
            src={activeHotspot.imageUrl}
            alt={activeHotspot.title}
            className="max-w-full max-h-[66vh] object-contain rounded-xl shadow-lg"
            referrerPolicy="no-referrer"
          />

          {/* Navigation Arrows */}
          {hotspots.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700/80 transition-all cursor-pointer shadow-xl hover:scale-105"
                title="Foto anterior (Seta Esquerda)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700/80 transition-all cursor-pointer shadow-xl hover:scale-105"
                title="Próxima foto (Seta Direita)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Footer info & thumbnails strip */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Posicionado no <strong>Frame {activeHotspot.frameNumber + 1}</strong> do 360°</span>
          </div>

          {/* Miniatures bar */}
          {hotspots.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
              {hotspots.map((h, idx) => (
                <button
                  key={h.id}
                  onClick={() => {
                    onSelectHotspot(h);
                    if (onRotateToFrame && h.frameNumber != null) {
                      onRotateToFrame(h.frameNumber);
                    }
                  }}
                  className={`relative w-12 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    h.id === activeHotspot.id
                      ? 'border-red-500 scale-105 shadow-md shadow-red-500/20 ring-2 ring-red-500/40'
                      : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                  }`}
                  title={`${h.title} (Frame ${h.frameNumber + 1})`}
                >
                  <img
                    src={h.imageUrl}
                    alt={h.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
