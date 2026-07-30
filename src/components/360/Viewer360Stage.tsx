import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, MapPin, Search, Check, X, Move, Plus } from 'lucide-react';
import { DamageMarker } from '../../types';
import { getMarkerPositionForFrame } from '../../utils/markerUtils';
import { MiniMapCompass } from './MiniMapCompass';

interface Viewer360StageProps {
  frames: string[];
  currentFrame: number;
  totalFrames: number;
  markers: DamageMarker[];
  selectedMarker: DamageMarker | null;
  isEditModeActive: boolean;
  addMarkerMode: boolean;
  zoomLevel: number;
  isFullscreen: boolean;
  saveToast: string | null;
  orientationConfig?: { front?: number; right?: number; rear?: number; left?: number };
  onSelectFrame: (frameIndex: number) => void;
  onSelectMarker: (marker: DamageMarker) => void;
  onSetFramePosition: (x: number, y: number) => Promise<void>;
  onExitEditMode: () => void;
  onChangeZoom: (zoom: number) => void;
}

export const Viewer360Stage: React.FC<Viewer360StageProps> = ({
  frames,
  currentFrame,
  totalFrames,
  markers,
  selectedMarker,
  isEditModeActive,
  addMarkerMode,
  zoomLevel,
  isFullscreen,
  saveToast,
  orientationConfig,
  onSelectFrame,
  onSelectMarker,
  onSetFramePosition,
  onExitEditMode,
  onChangeZoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag rotation state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startFrame = useRef(0);

  // Canvas marker drag state in edit mode
  const [isDraggingMarkerOnCanvas, setIsDraggingMarkerOnCanvas] = useState(false);

  // Pan offset when zoomed in > 100%
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset pan when zoom is 1
  useEffect(() => {
    if (zoomLevel === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Log frame selection
  useEffect(() => {
    if (isEditModeActive || addMarkerMode) {
      console.log(`Frame selecionado: ${currentFrame + 1}`);
    }
  }, [currentFrame, isEditModeActive, addMarkerMode]);

  // Wheel Zoom support (CTRL + Wheel or Pinch)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        onChangeZoom(Math.min(zoomLevel + 0.5, 3));
      } else {
        onChangeZoom(Math.max(zoomLevel - 0.5, 1));
      }
    }
  };

  // Drag rotation or Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggingMarkerOnCanvas || frames.length === 0) return;

    if (isEditModeActive || addMarkerMode) return;

    if (zoomLevel > 1) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    isDragging.current = true;
    startX.current = e.clientX;
    startFrame.current = currentFrame;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMarkerOnCanvas) {
      if ((isEditModeActive || addMarkerMode) && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10, 0), 100);
        const y = Math.min(Math.max(Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10, 0), 100);
        onSetFramePosition(x, y);
      }
      return;
    }

    if (isPanning.current && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
      return;
    }

    if (!isDragging.current || frames.length === 0) return;
    const deltaX = e.clientX - startX.current;
    const framesDiff = Math.floor(deltaX / 15);
    let targetFrame = (startFrame.current - framesDiff) % frames.length;
    if (targetFrame < 0) {
      targetFrame += frames.length;
    }
    onSelectFrame(targetFrame);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isPanning.current = false;
    setIsDraggingMarkerOnCanvas(false);
  };

  // Click on canvas to position
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (frames.length === 0 || isDraggingMarkerOnCanvas || isPanning.current) return;

    if (isEditModeActive || addMarkerMode) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.min(Math.max(Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10, 0), 100);
      const y = Math.min(Math.max(Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10, 0), 100);

      console.log('Clique recebido em X,Y:', { posX: x, posY: y });
      await onSetFramePosition(x, y);
    }
  };

  // Keyboard listener for ESC and ENTER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditModeActive) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          onExitEditMode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModeActive, onExitEditMode]);

  // Filter visible markers for current frame
  const activeMarkers = markers
    .map(m => ({
      marker: m,
      posInfo: getMarkerPositionForFrame(m, currentFrame)
    }))
    .filter(item => item.posInfo.isVisible);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden select-none transition-all ${
        isEditModeActive || addMarkerMode
          ? 'cursor-crosshair ring-2 ring-red-500 shadow-2xl'
          : frames.length > 0
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-default'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {frames.length > 0 && frames[currentFrame] ? (
        <div
          className="w-full h-full relative transition-transform duration-200 origin-center flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Main 360 Image - Object Contain Centered */}
          <img
            src={frames[currentFrame]}
            alt={`Frame ${currentFrame + 1}`}
            className="w-full h-full object-contain pointer-events-none select-none max-h-full"
            referrerPolicy="no-referrer"
          />

          {/* Marker Hotspot Pins */}
          {activeMarkers.map(({ marker, posInfo }) => {
            const isSelected = selectedMarker?.id === marker.id;

            return (
              <div
                key={marker.id}
                style={{ left: `${posInfo.posX}%`, top: `${posInfo.posY}%` }}
                className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMarker(marker);
                  }}
                  onMouseDown={(e) => {
                    if (isEditModeActive && isSelected) {
                      e.stopPropagation();
                      setIsDraggingMarkerOnCanvas(true);
                    }
                  }}
                  className={`relative group/pin w-8 h-8 rounded-full border-2 border-white shadow-2xl flex items-center justify-center font-bold text-white transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 ring-4 ring-red-400 ring-offset-2 ring-offset-slate-950 scale-125 z-40'
                      : 'bg-red-600/90 hover:bg-red-600 hover:scale-110'
                  }`}
                  title={`${marker.category}: ${marker.title}`}
                >
                  <MapPin className="w-4 h-4 fill-current" />

                  {/* Marker Title Tooltip on Hover */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-extrabold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none">
                    {marker.title} ({marker.category})
                  </span>
                </button>

                {/* Keyframe Status Tag */}
                {isSelected && (
                  <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap shadow-lg border backdrop-blur-md pointer-events-none ${
                    posInfo.status === 'confirmed'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                  }`}>
                    {posInfo.status === 'confirmed' ? '🟢 Keyframe' : '🟡 Tracking'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-slate-900">
          <RotateCcw className="w-12 h-12 text-slate-700 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
          <p className="font-extrabold text-white text-lg">Sem frames cadastrados</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Selecione ou envie as fotos do veículo para inicializar o visualizador 360°.
          </p>
        </div>
      )}

      {/* Mini-Map Compass Overlay */}
      {frames.length > 0 && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <MiniMapCompass currentFrame={currentFrame} totalFrames={totalFrames} orientationConfig={orientationConfig} />
        </div>
      )}

      {/* EDIT MODE OVERLAY BANNER */}
      {(isEditModeActive || addMarkerMode) && (
        <div className="absolute top-4 right-4 left-28 sm:left-32 bg-slate-900/95 backdrop-blur-md border border-red-500 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2 z-40">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <div>
              <span className="text-xs font-extrabold text-white block">🎯 Modo de Edição Ativo</span>
              <span className="text-[10px] text-slate-300 font-medium">
                Clique na imagem para posicionar | Arraste o pino para mover | ESC p/ sair
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExitEditMode}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-lg"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast Feedback Banner */}
      {saveToast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}
    </div>
  );
};
