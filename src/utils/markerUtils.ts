import { DamageMarker } from '../types';

export const HOTSPOT_VISIBLE_RANGE = 2;

export interface FramePos {
  posX: number;
  posY: number;
}

/**
 * Calculates exact or interpolated position of a marker for a given currentFrame
 */
export function getMarkerPositionForFrame(
  marker: DamageMarker,
  currentFrame: number
): { posX: number; posY: number; isVisible: boolean } {
  const primaryFrame = Number(marker.frameIndex);
  const primaryPos: FramePos = { posX: Number(marker.posX), posY: Number(marker.posY) };

  const positions: Record<number, FramePos> = { ...marker.framePositions };
  if (positions[primaryFrame] === undefined) {
    positions[primaryFrame] = primaryPos;
  }

  const keys = Object.keys(positions)
    .map(Number)
    .sort((a, b) => a - b);

  if (keys.length === 0) {
    const diff = Math.abs(currentFrame - primaryFrame);
    return {
      posX: primaryPos.posX,
      posY: primaryPos.posY,
      isVisible: diff <= HOTSPOT_VISIBLE_RANGE
    };
  }

  // 1. Exact frame match
  if (positions[currentFrame] !== undefined) {
    return {
      posX: positions[currentFrame].posX,
      posY: positions[currentFrame].posY,
      isVisible: true
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

  // Case A: Between two registered frames -> Linear Interpolation
  if (prevFrame !== null && nextFrame !== null) {
    const gap = nextFrame - prevFrame;
    const distFromPrev = currentFrame - prevFrame;
    const distFromNext = nextFrame - currentFrame;

    // Visible if between registered frames OR within tolerance of registered frames
    if (distFromPrev <= HOTSPOT_VISIBLE_RANGE || distFromNext <= HOTSPOT_VISIBLE_RANGE || gap <= HOTSPOT_VISIBLE_RANGE * 2) {
      const t = (currentFrame - prevFrame) / (nextFrame - prevFrame);
      const posPrev = positions[prevFrame];
      const posNext = positions[nextFrame];
      return {
        posX: posPrev.posX + t * (posNext.posX - posPrev.posX),
        posY: posPrev.posY + t * (posNext.posY - posPrev.posY),
        isVisible: true
      };
    }
    return { posX: positions[prevFrame].posX, posY: positions[prevFrame].posY, isVisible: false };
  }

  // Case B: Before all registered frames
  if (nextFrame !== null && prevFrame === null) {
    const diff = nextFrame - currentFrame;
    return {
      posX: positions[nextFrame].posX,
      posY: positions[nextFrame].posY,
      isVisible: diff <= HOTSPOT_VISIBLE_RANGE
    };
  }

  // Case C: After all registered frames
  if (prevFrame !== null && nextFrame === null) {
    const diff = currentFrame - prevFrame;
    return {
      posX: positions[prevFrame].posX,
      posY: positions[prevFrame].posY,
      isVisible: diff <= HOTSPOT_VISIBLE_RANGE
    };
  }

  return { posX: primaryPos.posX, posY: primaryPos.posY, isVisible: false };
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
