'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Note, NoteCategory } from '../types/note';
import {
  NOTE_COLOR_STYLES,
  formatKoreanDateTime,
  getRotationClass,
} from '../utils/formatters';

interface PostItNoteProps {
  note: Note;
  isNew?: boolean;
  onUpdate: (updated: Note) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onToggleComplete: (id: string) => Promise<void> | void;
}

export const PostItNote: React.FC<PostItNoteProps> = ({
  note,
  isNew = false,
  onUpdate,
  onDelete,
  onToggleComplete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editCategory, setEditCategory] = useState<NoteCategory>(note.category);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.75 : 1,
  };

  const colorStyle = NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES[0];
  const rotationClass = getRotationClass(note.id);
  const isCompleted = note.state === '완료';

  const handleStartEdit = () => {
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      return;
    }
    await onUpdate({
      ...note,
      content: trimmed,
      category: editCategory,
      timestamp: new Date().toISOString(), // 수정 시각 갱신
    });
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col justify-between p-4 rounded-xl border postit-shadow transition-shadow hover:shadow-xl ${
        colorStyle.bgLight
      } ${colorStyle.bgDark} ${colorStyle.borderLight} ${
        colorStyle.borderDark
      } ${isDragging ? 'ring-2 ring-amber-500 scale-105' : rotationClass} ${
        isNew ? 'animate-stick-on' : ''
      } min-h-[220px] max-w-full break-words`}
    >
      {/* 상단 장식용 마스킹 테이프 효과 */}
      <div
        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 ${colorStyle.tapeBg} backdrop-blur-xs rounded-sm shadow-xs border border-white/40 dark:border-white/10 pointer-events-none rotate-[1.5deg]`}
        aria-hidden="true"
      />

      {/* 헤더: 드래그 핸들, 카테고리 태그, 완료 버튼 */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          {/* 드래그 핸들 (본문 선택 및 버튼 클릭 방해 방지) */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 rounded text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label={`메모 순서 변경 핸들: ${note.content.slice(0, 15)}`}
            title="드래그하거나 스페이스바/화살표 키로 순서 변경"
          >
            <GripVertical className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* 카테고리 뱃지 */}
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${colorStyle.tagBg} ${colorStyle.tagText}`}
          >
            {note.category}
          </span>
        </div>

        {/* 완료 토글 버튼 */}
        <button
          type="button"
          onClick={() => onToggleComplete(note.id)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500 ${
            isCompleted
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          aria-label={isCompleted ? '완료 해제하기' : '완료로 표시하기'}
          title={isCompleted ? '완료 해제' : '완료 체크'}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px]">완료됨</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" />
              <span className="text-[11px]">완료하기</span>
            </>
          )}
        </button>
      </div>

      {/* 본문 영역 */}
      <div className="py-2.5 flex-1 min-h-[80px]">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              aria-label="메모 내용 편집"
              className="w-full p-2 text-xs sm:text-sm rounded-lg border border-black/20 dark:border-white/20 bg-white/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <label htmlFor={`edit-category-${note.id}`} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                범주:
              </label>
              <select
                id={`edit-category-${note.id}`}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as NoteCategory)}
                className="text-xs font-semibold px-2 py-1 rounded border border-black/20 dark:border-white/20 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
              >
                <option value="할 일">할 일</option>
                <option value="아이디어">아이디어</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>
        ) : (
          <p
            className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words select-text ${
              isCompleted
                ? 'line-through text-zinc-500 dark:text-zinc-400 opacity-75'
                : 'text-zinc-800 dark:text-zinc-100 font-medium'
            }`}
          >
            {note.content}
          </p>
        )}
      </div>

      {/* 하단 영역: 작성 시간 및 작업 버튼 */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 mt-auto">
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal truncate" title={`생성 시각: ${formatKoreanDateTime(note.datetime)}`}>
          {formatKoreanDateTime(note.datetime)}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editContent.trim().length === 0}
                className="p-1 rounded text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-label="수정 내용 저장"
                title="저장"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                aria-label="수정 취소"
                title="취소"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartEdit}
                className="p-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500"
                aria-label={`메모 수정: ${note.content.slice(0, 15)}`}
                title="편집"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(note.id)}
                className="p-1 rounded text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 focus:outline-none focus:ring-1 focus:ring-rose-500"
                aria-label={`메모 삭제: ${note.content.slice(0, 15)}`}
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
