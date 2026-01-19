'use client';

import { useEffect } from 'react';
import { useReaderStore } from '@/store/readerStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useReaderStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.style.backgroundColor = '#0a0a0a';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        document.body.style.backgroundColor = '#f5f5f5';
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  return <>{children}</>;
}
