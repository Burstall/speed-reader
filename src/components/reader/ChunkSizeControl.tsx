'use client';

import { useReaderStore } from '@/store/readerStore';

export function ChunkSizeControl() {
  const { chunkSize, setChunkSize } = useReaderStore();

  const options: { value: 1 | 2 | 3; label: string }[] = [
    { value: 1, label: '1 word' },
    { value: 2, label: '2 words' },
    { value: 3, label: '3 words' },
  ];

  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
        Words per flash
      </label>
      <div className="flex gap-1">
        {options.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setChunkSize(value)}
            className={`
              flex-1 px-2 py-1.5 text-xs rounded-md font-medium transition-colors
              ${chunkSize === value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
