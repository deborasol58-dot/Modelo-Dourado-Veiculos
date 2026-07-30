import React from 'react';

interface MiniMapCompassProps {
  currentFrame: number;
  totalFrames: number;
  orientationConfig?: { front?: number; right?: number; rear?: number; left?: number };
  size?: number; // pixel size
}

export const MiniMapCompass: React.FC<MiniMapCompassProps> = ({
  currentFrame,
  totalFrames,
  orientationConfig,
  size = 72
}) => {
  if (!totalFrames || totalFrames <= 0) return null;

  const frontFrame = orientationConfig?.front ?? 0;
  const deltaFrame = (currentFrame - frontFrame + totalFrames) % totalFrames;
  const progress = deltaFrame / totalFrames;
  const angleDeg = (progress * 360) % 360;

  // Determine 8-way directional label
  let cardinal = 'Frente';
  if (angleDeg >= 22.5 && angleDeg < 67.5) {
    cardinal = 'Frente Direita';
  } else if (angleDeg >= 67.5 && angleDeg < 112.5) {
    cardinal = 'Direita';
  } else if (angleDeg >= 112.5 && angleDeg < 157.5) {
    cardinal = 'Traseira Direita';
  } else if (angleDeg >= 157.5 && angleDeg < 202.5) {
    cardinal = 'Traseira';
  } else if (angleDeg >= 202.5 && angleDeg < 247.5) {
    cardinal = 'Traseira Esquerda';
  } else if (angleDeg >= 247.5 && angleDeg < 292.5) {
    cardinal = 'Esquerda';
  } else if (angleDeg >= 292.5 && angleDeg < 337.5) {
    cardinal = 'Frente Esquerda';
  } else {
    cardinal = 'Frente';
  }

  // Calculate indicator position on circle
  const radius = (size / 2) - 10;
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const dotX = cx + radius * Math.cos(rad);
  const dotY = cy + radius * Math.sin(rad);

  return (
    <div 
      className="relative flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2 text-white shadow-xl select-none"
      style={{ width: size + 24, height: size + 36 }}
      title={`Visão da câmera: ${cardinal} (${Math.round(angleDeg)}°)`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Circle Track */}
        <svg width={size} height={size} className="overflow-visible">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          {/* Car outline symbol in center */}
          <g transform={`translate(${cx - 12}, ${cy - 16}) scale(0.8)`} opacity="0.4">
            <path
              d="M 5,20 L 7,10 L 12,6 L 18,6 L 23,10 L 25,20 L 27,22 L 27,32 L 25,34 L 5,34 L 3,32 L 3,22 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect x="7" y="12" width="16" height="6" rx="1" fill="#ffffff" />
          </g>

          {/* Line pointing to camera direction */}
          <line
            x1={cx}
            y1={cy}
            x2={dotX}
            y2={dotY}
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Camera dot indicator */}
          <circle
            cx={dotX}
            cy={dotY}
            r="5"
            fill="#ef4444"
            className="animate-pulse"
          />
          <circle
            cx={dotX}
            cy={dotY}
            r="8"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        </svg>

        {/* Cardinal Direction Indicators */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-[8px] font-extrabold text-slate-400">F</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-[8px] font-extrabold text-slate-400">D</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[8px] font-extrabold text-slate-400">T</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-[8px] font-extrabold text-slate-400">E</span>
      </div>

      <span className="text-[10px] font-extrabold text-red-400 mt-1 uppercase tracking-wider">
        {cardinal}
      </span>
    </div>
  );
};
