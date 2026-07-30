import React, { useRef } from 'react';
import { Layers, ChevronLeft, ChevronRight, CheckCircle2, Circle, Radio } from 'lucide-react';
import { DamageMarker } from '../../types';
import { getMarkerTimelineStatus } from '../../utils/markerUtils';

interface Timeline360Props {
  totalFrames: number;
  currentFrame: number;
  selectedMarker: DamageMarker | null;
  onSelectFrame: (frameIndex: number) => void;
  onRemoveKeyframe?: (frameIndex: number) => void;
}

export const Timeline360: React.FC<Timeline360Props> = ({
  totalFrames,
  currentFrame,
  selectedMarker,
  onSelectFrame,
  onRemoveKeyframe
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (totalFrames <= 0) return null;

  const timelineStatus = selectedMarker
    ? getMarkerTimelineStatus(selectedMarker, totalFrames)
    : Array.from({ length: totalFrames }, (_, i) => ({
        frameIndex: i,
        status: 'none' as const,
        posX: 0,
        posY: 0
      }));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -200 : 200,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-2xl select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500" />
          <span className="text-white font-extrabold text-xs">Timeline de Frames</span>
          {selectedMarker && (
            <span className="text-[11px] text-red-400 font-medium bg-red-950/80 border border-red-800/50 px-2 py-0.5 rounded-md">
              Rastreamento: {selectedMarker.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 cursor-pointer transition-colors"
            title="Rolar para esquerda"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 cursor-pointer transition-colors"
            title="Rolar para direita"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Strip */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent custom-scrollbar"
      >
        {timelineStatus.map(({ frameIndex, status }) => {
          const isCurrent = frameIndex === currentFrame;

          return (
            <div
              key={frameIndex}
              className="group relative shrink-0 flex flex-col items-center"
            >
              <button
                type="button"
                onClick={() => onSelectFrame(frameIndex)}
                className={`flex flex-col items-center justify-center min-w-[44px] px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 border-white bg-slate-800 text-white scale-105 z-10 shadow-lg'
                    : status === 'confirmed'
                    ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900'
                    : status === 'interpolated'
                    ? 'bg-amber-950/80 border-amber-600/70 text-amber-300 hover:bg-amber-900'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
                title={`Frame ${frameIndex + 1}${status === 'confirmed' ? ' (Keyframe Confirmado)' : status === 'interpolated' ? ' (Interpolado)' : ''}`}
              >
                <span>F{frameIndex + 1}</span>
                <span
                  className={`w-2 h-2 rounded-full mt-1 transition-all ${
                    status === 'confirmed'
                      ? 'bg-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                      : status === 'interpolated'
                      ? 'bg-amber-400 ring-2 ring-amber-400/40'
                      : 'bg-slate-700'
                  }`}
                />
              </button>

              {/* Quick Keyframe Remove Button on hover */}
              {selectedMarker && status === 'confirmed' && onRemoveKeyframe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveKeyframe(frameIndex);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow hover:scale-110"
                  title="Remover Keyframe"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-400 pt-1.5 border-t border-slate-800/80 px-1 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 🟢 Confirmado (Keyframe)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 🟡 Interpolado (Tracking)
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-700" /> ⚪ Sem posição
          </span>
        </div>

        <span className="text-slate-500">
          Frame Atual: <strong className="text-white">{currentFrame + 1}</strong> / {totalFrames}
        </span>
      </div>
    </div>
  );
};
