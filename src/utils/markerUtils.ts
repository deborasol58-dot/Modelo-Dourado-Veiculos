import { DamageMarker } from '../types';

export const HOTSPOT_VISIBLE_RANGE = 3;

export interface FramePos {
  posX: number;
  posY: number;
  isConfirmed?: boolean;
}

export interface MarkerPositionResult {
  posX: number;
  posY: number;
  isVisible: boolean;
  status: 'confirmed' | 'interpolated' | 'none';
  isKeyframe: boolean;
}

/**
 * Calculates exact or interpolated position of a marker for a given currentFrame
 */
export function getMarkerPositionForFrame(
  marker: DamageMarker,
  currentFrame: number
): MarkerPositionResult {
  const primaryFrame = Number(marker.frameIndex);
  const primaryPos: FramePos = { posX: Number(marker.posX), posY: Number(marker.posY), isConfirmed: true };

  const positions: Record<number, FramePos> = { ...marker.framePositions };
  if (positions[primaryFrame] === undefined) {
    positions[primaryFrame] = primaryPos;
  }

  // Exact frame keyframe match
  if (positions[currentFrame] !== undefined) {
    return {
      posX: positions[currentFrame].posX,
      posY: positions[currentFrame].posY,
      isVisible: true,
      status: 'confirmed',
      isKeyframe: true
    };
  }

  const keys = Object.keys(positions)
    .map(Number)
    .sort((a, b) => a - b);

  if (keys.length === 0) {
    const diff = Math.abs(currentFrame - primaryFrame);
    return {
      posX: primaryPos.posX,
      posY: primaryPos.posY,
      isVisible: diff <= HOTSPOT_VISIBLE_RANGE,
      status: diff === 0 ? 'confirmed' : diff <= HOTSPOT_VISIBLE_RANGE ? 'interpolated' : 'none',
      isKeyframe: diff === 0
    };
  }

  // Find nearest lower registered frame (prevFrame) and nearest higher registered frame (nextFrame)
  let prevFrame: number | null = null;
  let nextFrame: number | null = null;

  for (const f of keys) {
    if (f < currentFrame) {
      prevFrame = f;
    } else if (f > currentFrame && nextFrame === null) {
      nextFrame = f;
    }
  }

  // Case A: Between two registered keyframes -> Linear Interpolation
  if (prevFrame !== null && nextFrame !== null) {
    const gap = nextFrame - prevFrame;
    const t = (currentFrame - prevFrame) / gap;
    const posPrev = positions[prevFrame];
    const posNext = positions[nextFrame];
    const posX = Math.round((posPrev.posX + t * (posNext.posX - posPrev.posX)) * 10) / 10;
    const posY = Math.round((posPrev.posY + t * (posNext.posY - posPrev.posY)) * 10) / 10;

    return {
      posX,
      posY,
      isVisible: true,
      status: 'interpolated',
      isKeyframe: false
    };
  }

  // Case B: Before first registered keyframe
  if (nextFrame !== null && prevFrame === null) {
    const diff = nextFrame - currentFrame;
    const pos = positions[nextFrame];
    return {
      posX: pos.posX,
      posY: pos.posY,
      isVisible: diff <= HOTSPOT_VISIBLE_RANGE,
      status: diff <= HOTSPOT_VISIBLE_RANGE ? 'interpolated' : 'none',
      isKeyframe: false
    };
  }

  // Case C: After last registered keyframe
  if (prevFrame !== null && nextFrame === null) {
    const diff = currentFrame - prevFrame;
    const pos = positions[prevFrame];
    return {
      posX: pos.posX,
      posY: pos.posY,
      isVisible: diff <= HOTSPOT_VISIBLE_RANGE,
      status: diff <= HOTSPOT_VISIBLE_RANGE ? 'interpolated' : 'none',
      isKeyframe: false
    };
  }

  return {
    posX: primaryPos.posX,
    posY: primaryPos.posY,
    isVisible: false,
    status: 'none',
    isKeyframe: false
  };
}

/**
 * Returns timeline breakdown for all frames in the 360 rotation
 */
export function getMarkerTimelineStatus(
  marker: DamageMarker,
  totalFrames: number
): Array<{ frameIndex: number; status: 'confirmed' | 'interpolated' | 'none'; posX: number; posY: number }> {
  const result = [];
  for (let f = 0; f < totalFrames; f++) {
    const info = getMarkerPositionForFrame(marker, f);
    result.push({
      frameIndex: f,
      status: info.status,
      posX: info.posX,
      posY: info.posY
    });
  }
  return result;
}

/**
 * Propagates current position from startFrame forward by `count` frames or until end
 */
export function propagateMarkerPositions(
  marker: DamageMarker,
  startFrame: number,
  count: number | 'end',
  totalFrames: number
): Record<number, FramePos> {
  const currentPos = getMarkerPositionForFrame(marker, startFrame);
  const updatedPositions: Record<number, FramePos> = { ...marker.framePositions };

  // Set current as confirmed keyframe
  updatedPositions[startFrame] = { posX: currentPos.posX, posY: currentPos.posY, isConfirmed: true };

  const targetEndFrame = count === 'end' ? totalFrames - 1 : Math.min(startFrame + count, totalFrames - 1);

  for (let f = startFrame + 1; f <= targetEndFrame; f++) {
    // Only set if not already set or overwrite with propagated position
    updatedPositions[f] = { posX: currentPos.posX, posY: currentPos.posY, isConfirmed: true };
  }

  return updatedPositions;
}

/**
 * Extracts clean description and framePositions from marker raw description/data
 */
export function parseMarkerPositions(rawDescription: string, frame_positions_col?: any): {
  cleanDescription: string;
  framePositions: Record<number, FramePos>;
} {
  let framePositions: Record<number, FramePos> = {};

  // Try DB column first
  if (frame_positions_col) {
    try {
      framePositions = typeof frame_positions_col === 'string' ? JSON.parse(frame_positions_col) : frame_positions_col;
    } catch (e) {
      // ignore
    }
  }

  // Try parsing HTML comment inside description: <!--FP:{"18":{"posX":50,"posY":60}}-->
  let cleanDescription = rawDescription || '';
  const match = cleanDescription.match(/<!--FP:(.*?)-->/);
  if (match && match[1]) {
    try {
      const parsedFromDesc = JSON.parse(match[1]);
      framePositions = { ...parsedFromDesc, ...framePositions };
    } catch (e) {
      // ignore
    }
    cleanDescription = cleanDescription.replace(/<!--FP:.*?-->/g, '').trim();
  }

  return { cleanDescription, framePositions };
}

/**
 * Serializes framePositions into HTML comment tag to append to description
 */
export function encodeMarkerDescription(description: string, framePositions?: Record<number, FramePos>): string {
  const clean = (description || '').replace(/<!--FP:.*?-->/g, '').trim();
  if (!framePositions || Object.keys(framePositions).length === 0) {
    return clean;
  }
  return `${clean} <!--FP:${JSON.stringify(framePositions)}-->`;
}
