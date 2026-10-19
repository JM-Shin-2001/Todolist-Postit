'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { CategoryFilter } from '../types/note';

interface CategoryFilterBarProps {
  currentFilter: CategoryFilter;
  onChangeFilter: (category: CategoryFilter) => void;
  counts: {
    전체: number;
    '할 일': number;
    '아이디어': number;
    기타: number;
  };
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  currentFilter,
  onChangeFilter,
  counts,
}) => {
  const options: CategoryFilter[] = ['전체', '할 일', '아이디어', '기타'];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
        <label
          htmlFor="category-filter-dropdown"
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-300"
        >
          카테고리 필터:
        </label>
        <select
          id="category-filter-dropdown"
          value={currentFilter}
          onChange={(e) => onChangeFilter(e.target.value as CategoryFilter)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt} ({counts[opt] || 0})
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
        <span>
          표시 중: <strong className="text-zinc-800 dark:text-zinc-200">{counts[currentFilter] || 0}</strong>개
        </span>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <span>핸들 아이콘(⠿)을 잡고 드래그하거나 키보드로 순서를 바꿀 수 있습니다</span>
      </div>
    </div>
  );
};
