'use client';

import { useReaderStore } from '@/store/readerStore';
import { FOCAL_COLORS, type FocalColor } from '@/types';

const COLOR_OPTIONS: { id: FocalColor; label: string }[] = [
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' },
  { id: 'green', label: 'Green' },
  { id: 'purple', label: 'Purple' },
];

export function FocalColorPicker() {
  const { focalColor, setFocalColor } = useReaderStore();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-gray-400">Focus Color</span>
      <div className="flex gap-2">
        {COLOR_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setFocalColor(option.id)}
            className={`
              w-8 h-8 rounded-full border-2 transition-all
              ${focalColor === option.id
                ? 'border-white scale-110'
                : 'border-transparent hover:border-gray-600'
              }
            `}
            style={{ backgroundColor: FOCAL_COLORS[option.id] }}
            title={option.label}
            aria-label={`Set focus color to ${option.label}`}
            aria-pressed={focalColor === option.id}
          />
        ))}
      </div>
    </div>
  );
}
