import React from 'react';
import { 
  ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize, 
  ZoomIn, ZoomOut, Plus, PanelRightClose, PanelRightOpen, Check, Move
} from 'lucide-react';

interface Toolbar360Props {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  zoomLevel: number;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  isEditModeActive: boolean;
  saveToast: string | null;
  onPrevFrame: () => void;
  onNextFrame: () => void;
  onTogglePlay: () => void;
  onChangeZoom: (level: number) => void;
  onToggleFullscreen: () => void;
  onToggleSidebar: () => void;
  onNewHotspot: () => void;
  onToggleEditMode?: () => void;
}

export const Toolbar360: React.FC<Toolbar360Props> = ({
  currentFrame,
  totalFrames,
  isPlaying,
  zoomLevel,
  isFullscreen,
  isSidebarOpen,
  isEditModeActive,
  saveToast,
  onPrevFrame,
  onNextFrame,
  onTogglePlay,
  onChangeZoom,
  onToggleFullscreen,
  onToggleSidebar,
  onNewHotspot,
  onToggleEditMode
}) => {
  const zoomLevels = [1, 1.5, 2, 3];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
      {/* Left Group: Frame Stepper & Rotation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrevFrame}
          disabled={totalFrames === 0}
          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-slate-700/60"
          title="Frame Anterior (Seta Esquerda ←)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-bold">Anterior</span>
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={totalFrames === 0 || isEditModeActive}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
          } disabled:opacity-40`}
          title="Giro Automático 360°"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pausar' : 'Girar'}</span>
        </button>

        <button
          type="button"
          onClick={onNextFrame}
          disabled={totalFrames === 0}
          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-slate-700/60"
          title="Próximo Frame (Seta Direita →)"
        >
          <span className="hidden sm:inline text-xs font-bold">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-extrabold text-slate-400 ml-2 hidden md:inline bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          Frame {currentFrame + 1} / {totalFrames || 1}
        </span>
      </div>

      {/* Middle Group: Zoom Level Selectors */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase hidden sm:inline">Zoom:</span>
        {zoomLevels.map((lvl) => {
          const isActive = zoomLevel === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChangeZoom(lvl)}
              className={`px-2 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {lvl * 100}%
            </button>
          );
        })}
      </div>

      {/* Right Group: Action Controls */}
      <div className="flex items-center gap-2">
        {saveToast && (
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            {saveToast}
          </span>
        )}

        <button
          type="button"
          onClick={onNewHotspot}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-red-500/50"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">+ Hotspot</span>
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-700/60"
          title={isFullscreen ? 'Sair da Tela Cheia' : '⛶ Tela Cheia'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer border border-slate-700/60"
          title={isSidebarOpen ? 'Recolher Painel Lateral' : 'Expandir Painel Lateral'}
        >
          {isSidebarOpen ? <PanelRightClose className="w-4 h-4 text-red-400" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
