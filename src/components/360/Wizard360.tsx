import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, Car, Compass, ArrowRight, X } from 'lucide-react';
import { MiniMapCompass } from './MiniMapCompass';

interface Wizard360Props {
  isOpen: boolean;
  onClose: () => void;
  frames: string[];
  totalFramesConfig: number;
  currentFrame: number;
  onSelectFrame: (idx: number) => void;
  orientationConfig: { front?: number; right?: number; rear?: number; left?: number };
  onSaveOrientation: (config: { front?: number; right?: number; rear?: number; left?: number }) => void;
  onFinish: () => void;
}

export const Wizard360: React.FC<Wizard360Props> = ({
  isOpen,
  onClose,
  frames,
  totalFramesConfig,
  currentFrame,
  onSelectFrame,
  orientationConfig,
  onSaveOrientation,
  onFinish
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  const { front, right, rear, left } = orientationConfig;

  const isOrientationComplete =
    front !== undefined && right !== undefined && rear !== undefined && left !== undefined;

  const handleSetCardinal = (type: 'front' | 'right' | 'rear' | 'left') => {
    const updated = {
      ...orientationConfig,
      [type]: currentFrame
    };
    onSaveOrientation(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase text-red-500 tracking-wider">
              Assistente de Configuração 360°
            </span>
            <h3 className="text-xl font-extrabold text-white mt-0.5">
              Etapa {step} de 3: {step === 1 ? 'Validação dos Frames' : step === 2 ? 'Orientação do Veículo' : 'Resumo & Finalização'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Stepper Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              step === 1
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            1. Frames ({frames.length}/{totalFramesConfig})
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              step === 2
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            2. Orientação
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              step === 3
                ? 'bg-red-600 text-white border-red-500 shadow-md'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            3. Resumo
          </button>
        </div>

        {/* STEP 1: FRAMES VALIDATION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-2">
              <Car className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
              <h4 className="font-extrabold text-lg text-white">Frames Carregados</h4>
              <p className="text-2xl font-black text-emerald-400">
                {frames.length} de {totalFramesConfig} frames
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {frames.length >= totalFramesConfig
                  ? '✓ Todos os frames requeridos foram devidamente carregados para a rotação 360°.'
                  : 'Atenção: A quantidade de frames enviados é menor do que a meta configurada.'}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Avançar para Orientação</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VEHICLE ORIENTATION */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-xs text-slate-300">
              Navegue entre os frames do veículo abaixo e clique nos botões para definir em qual frame o veículo está virado de Frente, Lado Direito, Traseira e Lado Esquerdo.
            </p>

            {/* Frame Viewer & Stepper */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              {frames[currentFrame] ? (
                <img src={frames[currentFrame]} alt={`Frame ${currentFrame + 1}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs text-slate-500">Nenhum frame selecionado</span>
              )}

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={() => onSelectFrame((currentFrame - 1 + frames.length) % frames.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => onSelectFrame((currentFrame + 1) % frames.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white text-xs font-extrabold px-3 py-1 rounded-lg border border-slate-700">
                Frame Atual: {currentFrame + 1} / {frames.length}
              </span>
            </div>

            {/* Set Orientation Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSetCardinal('front')}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  front === currentFrame
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                    : front !== undefined
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <span>🎯 Definir Frente</span>
                <span className="text-[10px] opacity-80">
                  {front !== undefined ? `Frame ${front + 1}` : 'Não definido'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetCardinal('right')}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  right === currentFrame
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                    : right !== undefined
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <span>🎯 Definir Direita</span>
                <span className="text-[10px] opacity-80">
                  {right !== undefined ? `Frame ${right + 1}` : 'Não definido'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetCardinal('rear')}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  rear === currentFrame
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                    : rear !== undefined
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <span>🎯 Definir Traseira</span>
                <span className="text-[10px] opacity-80">
                  {rear !== undefined ? `Frame ${rear + 1}` : 'Não definido'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSetCardinal('left')}
                className={`py-3 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  left === currentFrame
                    ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                    : left !== undefined
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <span>🎯 Definir Esquerda</span>
                <span className="text-[10px] opacity-80">
                  {left !== undefined ? `Frame ${left + 1}` : 'Não definido'}
                </span>
              </button>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Avançar para Resumo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY & FINALIZE */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">
                Resumo da Configuração
              </h4>

              <div className="space-y-2 text-xs font-bold">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Frente do veículo</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    {front !== undefined ? `Frame ${front + 1}` : 'Padrão (Frame 1)'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Lado Direito</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    {right !== undefined ? `Frame ${right + 1}` : `Padrão (Frame ${Math.round(frames.length * 0.25) + 1})`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Traseira</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    {rear !== undefined ? `Frame ${rear + 1}` : `Padrão (Frame ${Math.round(frames.length * 0.50) + 1})`}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Lado Esquerdo</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    {left !== undefined ? `Frame ${left + 1}` : `Padrão (Frame ${Math.round(frames.length * 0.75) + 1})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  onFinish();
                  onClose();
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 cursor-pointer shadow-xl transition-all scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar Projeto 360°</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
