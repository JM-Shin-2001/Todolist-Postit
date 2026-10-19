'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { NoteCategory } from '../types/note';

interface NoteInputFormProps {
  onAddNote: (content: string, category: NoteCategory) => Promise<void> | void;
}

export const NoteInputForm: React.FC<NoteInputFormProps> = ({ onAddNote }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('할 일');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddNote(trimmed, category);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter 또는 Cmd+Enter로 빠른 제출
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isBlank = content.trim().length === 0;

  return (
    <section className="w-full max-w-2xl mx-auto my-6 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 dark:bg-zinc-800/95 rounded-2xl p-5 shadow-lg border border-amber-200/80 dark:border-zinc-700 backdrop-blur-sm transition-all"
        aria-label="새 포스트잇 메모 작성"
      >
        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="note-content-input"
              className="block text-xs font-semibold uppercase tracking-wider text-amber-800/80 dark:text-amber-400 mb-1"
            >
              새 메모 내용
            </label>
            <textarea
              id="note-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="무엇을 기억해야 하나요? (Ctrl+Enter로 등록)"
              rows={3}
              className="w-full p-3 text-sm rounded-xl border border-zinc-300 dark:border-zinc-600 bg-amber-50/30 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y min-h-[72px] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label
                htmlFor="note-category-select"
                className="text-xs font-medium text-zinc-600 dark:text-zinc-300"
              >
                범주:
              </label>
              <select
                id="note-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as NoteCategory)}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="할 일">할 일</option>
                <option value="아이디어">아이디어</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isBlank || isSubmitting}
              className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ${
                isBlank || isSubmitting
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed shadow-none'
                  : 'bg-amber-400 hover:bg-amber-500 text-amber-950 active:scale-95 shadow-amber-300/50'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span>포스트잇 붙이기</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
