import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-amber-200/50 dark:border-zinc-800 py-6 mt-auto bg-amber-50/50 dark:bg-zinc-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
        <p>Copyright INU Post-it Todo List by 신제민</p>
      </div>
    </footer>
  );
};
