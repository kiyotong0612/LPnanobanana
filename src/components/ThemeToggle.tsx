'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Theme store using external store pattern
const themeStore = {
  isDark: true,
  listeners: new Set<() => void>(),

  subscribe(listener: () => void) {
    themeStore.listeners.add(listener);
    return () => themeStore.listeners.delete(listener);
  },

  getSnapshot() {
    return themeStore.isDark;
  },

  getServerSnapshot() {
    return true; // Default to dark on server
  },

  setTheme(isDark: boolean) {
    themeStore.isDark = isDark;
    themeStore.listeners.forEach((listener) => listener());
  },
};

// Initialize theme on client
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
  themeStore.isDark = shouldBeDark;
  document.documentElement.classList.toggle('dark', shouldBeDark);
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );

  const toggleTheme = useCallback(() => {
    const newIsDark = !themeStore.isDark;
    themeStore.setTheme(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden group"
    >
      <Sun
        className={`h-5 w-5 transition-all duration-300 ${
          isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
        }`}
      />
      <span className="sr-only">テーマ切り替え</span>
    </Button>
  );
}
