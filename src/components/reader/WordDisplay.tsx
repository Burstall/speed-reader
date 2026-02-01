'use client';

import { calculateORP, calculateChunkORP } from '@/lib/orp';
import { FOCAL_COLORS, type FocalColor } from '@/types';

interface WordDisplayProps {
  chunk: string[];
  focalColor: FocalColor;
}

export function WordDisplay({ chunk, focalColor }: WordDisplayProps) {
  const word = chunk.join(' ');
  const { before, focal, after } = chunk.length > 1
    ? calculateChunkORP(chunk)
    : calculateORP(word);
  const colorHex = FOCAL_COLORS[focalColor];

  // Dynamic font scaling for long words (15+ chars)
  const fontScale = word.length >= 15 ? Math.max(0.7, 15 / word.length) : 1;

  if (!word) {
    return (
      <div className="relative h-48 md:h-64 flex items-center justify-center">
        <span className="text-2xl text-gray-400 dark:text-gray-600">
          Paste text to begin reading
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-48 md:h-64">
      {/* Fixed center marker line */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-16 opacity-15"
        style={{ backgroundColor: colorHex }}
      />

      {/* Word container - uses CSS grid to center focal letter precisely */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="grid items-baseline font-mono text-gray-900 dark:text-white"
          style={{
            gridTemplateColumns: '1fr auto 1fr',
            fontSize: `calc(clamp(1.25rem, 5vw, 3.5rem) * ${fontScale})`,
            letterSpacing: '0.04em',
            gap: '0 0.08em',
          }}
        >
          {/* Before focal - right-aligned to butt against center */}
          <span className="text-right" style={{ minWidth: 0, overflow: 'hidden' }}>
            {before}
          </span>

          {/* Focal letter - centered, larger and bolder */}
          <span
            className="font-bold text-center"
            style={{
              color: colorHex,
              fontSize: '1.15em',
              textShadow: `0 0 20px ${colorHex}40`,
            }}
          >
            {focal}
          </span>

          {/* After focal - left-aligned starting from center */}
          <span className="text-left" style={{ minWidth: 0, overflow: 'hidden' }}>
            {after}
          </span>
        </div>
      </div>

      {/* Top/bottom guide marks */}
      <div
        className="absolute left-1/2 top-[calc(50%-2.5rem)] -translate-x-1/2 w-1.5 h-1.5 rotate-45 opacity-25"
        style={{ backgroundColor: colorHex }}
      />
      <div
        className="absolute left-1/2 bottom-[calc(50%-2.5rem)] -translate-x-1/2 w-1.5 h-1.5 rotate-45 opacity-25"
        style={{ backgroundColor: colorHex }}
      />
    </div>
  );
}
