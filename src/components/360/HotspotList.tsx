import React, { useState, useMemo } from 'react';
import { Plus, Search, MapPin, Camera, ChevronRight, Layers, Tag } from 'lucide-react';
import { DamageMarker } from '../../types';

interface HotspotListProps {
  markers: DamageMarker[];
  selectedMarker: DamageMarker | null;
  currentFrame: number;
  totalFrames: number;
  onSelectMarker: (marker: DamageMarker) => void;
  onNewHotspot: () => void;
}

export const HotspotList: React.FC<HotspotListProps> = ({
  markers,
  selectedMarker,
  currentFrame,
  totalFrames,
  onSelectMarker,
  onNewHotspot
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return markers.filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [markers, search]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Create CTA */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-extrabold text-slate-900 text-base">Hotspots 360°</h4>
          <p className="text-xs text-slate-400 font-medium">
            {markers.length} {markers.length === 1 ? 'ponto registrado' : 'pontos registrados'}
          </p>
        </div>

        <button
          type="button"
          onClick={onNewHotspot}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Hotspot</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nome ou avaria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-red-600 transition-all font-medium"
        />
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[480px]">
        {filtered.map((marker) => {
          const isSelected = selectedMarker?.id === marker.id;
          const keyframesCount = marker.framePositions
            ? Object.keys(marker.framePositions).length
            : 1;
          const imageCount = marker.damageImages?.length || 0;

          return (
            <button
              key={marker.id}
              type="button"
              onClick={() => onSelectMarker(marker)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                isSelected
                  ? 'bg-red-50/80 border-red-500/80 shadow-sm ring-1 ring-red-500/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border font-bold ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-500 shadow'
                    : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-red-50 group-hover:text-red-600'
                }`}>
                  <MapPin className="w-4 h-4 fill-current" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {marker.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-500">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-red-500" />
                      {marker.category}
                    </span>

                    <span className="flex items-center gap-1 text-slate-400">
                      <Layers className="w-3 h-3" />
                      {keyframesCount} {keyframesCount === 1 ? 'keyframe' : 'keyframes'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {imageCount > 0 && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-slate-200">
                    <Camera className="w-3 h-3 text-blue-500" />
                    {imageCount}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-red-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'}`} />
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-extrabold text-xs text-slate-600">Nenhum hotspot encontrado</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Clique no botão "+ Novo Hotspot" acima para adicionar uma nova avaria ou marcação no veículo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
