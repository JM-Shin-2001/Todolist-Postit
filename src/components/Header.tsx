'use client';

import React from 'react';
import { Sun, Moon, StickyNote } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-amber-50/80 dark:bg-zinc-900/80 border-b border-amber-200/60 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-md rotate-3 transition-transform hover:rotate-6">
            <StickyNote className="w-6 h-6 text-amber-950" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Post-it Todo List
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:block">
              생각과 할 일을 자유롭게 붙이고 정리해보세요
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="p-2.5 rounded-xl border border-amber-300/70 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:bg-amber-100/50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm flex items-center gap-2"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <span className="text-xs font-medium pr-1">라이트 모드</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-zinc-600" aria-hidden="true" />
              <span className="text-xs font-medium pr-1">다크 모드</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
