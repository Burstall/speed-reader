'use client';

import { useReaderStore } from '@/store/readerStore';

const SPEED_PRESETS = [200, 300, 450, 600, 900];

export function SpeedControl() {
  const { wpm, setWpm } = useReaderStore();

  return (
    <div className="flex flex-col gap-3">
      {/* Speed display */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">Speed</span>
        <span className="text-white font-mono text-lg">{wpm} WPM</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={150}
        max={1200}
        step={25}
        value={wpm}
        onChange={(e) => setWpm(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:bg-white
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:bg-white
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:cursor-pointer"
        aria-label={`Reading speed: ${wpm} words per minute`}
        aria-valuemin={150}
        aria-valuemax={1200}
        aria-valuenow={wpm}
      />

      {/* Presets */}
      <div className="flex items-center justify-between gap-1">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setWpm(preset)}
            className={`px-2 py-1 text-xs rounded transition-colors
                       ${wpm === preset
                         ? 'bg-white text-black'
                         : 'text-gray-500 hover:text-white hover:bg-gray-800'
                       }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
