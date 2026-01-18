'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

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
