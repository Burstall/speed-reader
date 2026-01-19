'use client';

import { useReaderStore } from '@/store/readerStore';

const themes = [
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'system', label: 'System', icon: '💻' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useReaderStore();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-gray-400 dark:text-gray-400">Theme</label>
      <div className="flex gap-1">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`
              flex-1 py-2 px-3 rounded-lg text-sm transition-colors
              ${theme === t.value
                ? 'bg-white text-black dark:bg-white dark:text-black'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }
            `}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
