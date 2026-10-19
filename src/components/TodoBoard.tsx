'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Note, NoteCategory, CategoryFilter, NoteColor } from '../types/note';
import { noteRepository } from '../services/noteRepository';
import { Header } from './Header';
import { Footer } from './Footer';
import { NoteInputForm } from './NoteInputForm';
import { CategoryFilterBar } from './CategoryFilterBar';
import { PostItNote } from './PostItNote';
import { AlertCircle, FileQuestion, Sparkles } from 'lucide-react';

const THEME_STORAGE_KEY = 'postit_todo_theme_v1';

export const TodoBoard: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('전체');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // dnd-kit 센서 설정: 포인터 및 접근성 키보드 센서
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 클릭과 드래그 구분
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 테마 초기화 및 로컬스토리지 로드 (클라이언트 마운트 시 1회)
  useEffect(() => {
    // 1. 테마 로드 (기본은 light)
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // 최초 기본은 라이트 모드
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // localStorage 접근 불가 환경 대비
    }

    // 2. 메모 로드
    const loadNotes = async () => {
      try {
        const loaded = await noteRepository.getNotes();
        setNotes(loaded);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '메모를 불러오지 못했습니다.';
        setErrorMessage(msg);
      } finally {
        setIsLoaded(true);
      }
    };

    loadNotes();
  }, []);

  // 테마 토글 핸들러
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore
    }
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 메모 추가
  const handleAddNote = async (content: string, category: NoteCategory) => {
    try {
      setErrorMessage(null);
      const randomColor = (Math.floor(Math.random() * 4) as NoteColor);
      const nowIso = new Date().toISOString();
      // B열 datetime을 고유 키로 활용
      const uniqueId = nowIso;

      const newNote: Note = {
        id: uniqueId,
        timestamp: nowIso,
        datetime: nowIso,
        category,
        content,
        color: randomColor,
        state: '',
        order: notes.length,
      };

      const updatedList = [...notes, newNote];
      setNotes(updatedList);
      setNewNoteId(uniqueId);

      // 애니메이션 플래그는 1초 후 자동 해제하여 추후 필터/재렌더링 시 반복 방지
      setTimeout(() => {
        setNewNoteId((current) => (current === uniqueId ? null : current));
      }, 1000);

      await noteRepository.saveNotes(updatedList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '메모 저장에 실패했습니다.';
      setErrorMessage(msg);
    }
  };

  // 메모 수정
  const handleUpdateNote = async (updated: Note) => {
    try {
      setErrorMessage(null);
      const updatedList = notes.map((n) => (n.id === updated.id ? updated : n));
      setNotes(updatedList);
      await noteRepository.saveNotes(updatedList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '메모 수정 내용 저장에 실패했습니다.';
      setErrorMessage(msg);
    }
  };

  // 메모 삭제
  const handleDeleteNote = async (id: string) => {
    try {
      setErrorMessage(null);
      const filtered = notes.filter((n) => n.id !== id);
      const reordered = filtered.map((n, idx) => ({ ...n, order: idx }));
      setNotes(reordered);
      await noteRepository.saveNotes(reordered);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '메모 삭제에 실패했습니다.';
      setErrorMessage(msg);
    }
  };

  // 완료/미완료 토글
  const handleToggleComplete = async (id: string) => {
    try {
      setErrorMessage(null);
      const updatedList = notes.map((n) => {
        if (n.id === id) {
          return {
            ...n,
            state: (n.state === '완료' ? '' : '완료') as Note['state'],
            timestamp: new Date().toISOString(),
          };
        }
        return n;
      });
      setNotes(updatedList);
      await noteRepository.saveNotes(updatedList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '완료 상태 변경 저장에 실패했습니다.';
      setErrorMessage(msg);
    }
  };

  // 카테고리 필터링된 메모 목록
  const visibleNotes = useMemo(() => {
    if (filter === '전체') return notes;
    return notes.filter((n) => n.category === filter);
  }, [notes, filter]);

  // 카테고리별 개수 통계
  const counts = useMemo(() => {
    const res = {
      전체: notes.length,
      '할 일': 0,
      '아이디어': 0,
      기타: 0,
    };
    notes.forEach((n) => {
      if (res[n.category] !== undefined) {
        res[n.category]++;
      }
    });
    return res;
  }, [notes]);

  // 드래그 앤 드롭 정렬 완료 처리
  // 요구사항: "카테고리 필터가 적용된 상태에서도 정렬할 수 있게 해 줘.
  // 이때 보이는 메모끼리만 기존 전체 목록의 해당 위치를 교환하고, 숨겨진 메모의 위치와 상대 순서는 유지해 줘."
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndexInVisible = visibleNotes.findIndex((n) => n.id === active.id);
    const newIndexInVisible = visibleNotes.findIndex((n) => n.id === over.id);

    if (oldIndexInVisible === -1 || newIndexInVisible === -1) {
      return;
    }

    try {
      let nextAllNotes: Note[];

      if (filter === '전체') {
        // 전체일 때는 단순 배열 순서 이동
        const reordered = arrayMove(notes, oldIndexInVisible, newIndexInVisible);
        nextAllNotes = reordered.map((item, idx) => ({ ...item, order: idx }));
      } else {
        // 필터가 걸려있는 상태일 때:
        // 전체 리스트에서 보이는 메모들이 차지하고 있던 원본 인덱스 슬롯들
        const visibleIndicesInAll: number[] = [];
        notes.forEach((item, idx) => {
          if (item.category === filter) {
            visibleIndicesInAll.push(idx);
          }
        });

        // 보이는 메모들만 순서 이동
        const reorderedVisible = arrayMove(visibleNotes, oldIndexInVisible, newIndexInVisible);

        // 원본 배열 복사 후 보이는 슬롯들에 이동된 요소들을 순서대로 배치
        nextAllNotes = [...notes];
        visibleIndicesInAll.forEach((allIndex, i) => {
          nextAllNotes[allIndex] = reorderedVisible[i];
        });

        // 최종 order 필드 갱신
        nextAllNotes = nextAllNotes.map((item, idx) => ({ ...item, order: idx }));
      }

      setNotes(nextAllNotes);
      await noteRepository.saveNotes(nextAllNotes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '순서 변경 저장에 실패했습니다.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* 에러 메시지 알림 배너 */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center justify-between text-xs sm:text-sm shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="px-2 py-1 text-xs font-semibold hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* 메인 메모 입력 폼 */}
        <NoteInputForm onAddNote={handleAddNote} />

        {/* 카테고리 필터 바 */}
        <CategoryFilterBar
          currentFilter={filter}
          onChangeFilter={setFilter}
          counts={counts}
        />

        {/* 메모 목록 영역 */}
        {!isLoaded ? (
          <div className="py-20 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            메모 보드를 불러오는 중입니다...
          </div>
        ) : notes.length === 0 ? (
          /* 처음 실행했을 때 빈 상태 안내 */
          <div className="my-12 py-16 px-6 max-w-md mx-auto text-center rounded-2xl border-2 border-dashed border-amber-300 dark:border-zinc-700 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-xs">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-zinc-700 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
              등록된 메모가 없습니다
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              위의 입력창에 할 일이나 떠오른 아이디어를 적고<br />
              첫 번째 포스트잇을 보드에 붙여보세요!
            </p>
          </div>
        ) : visibleNotes.length === 0 ? (
          /* 필터 결과가 없을 때 안내 */
          <div className="my-12 py-16 px-6 max-w-md mx-auto text-center rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white/30 dark:bg-zinc-800/30">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              &apos;{filter}&apos; 카테고리의 메모가 없습니다
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              다른 카테고리를 선택하거나 새 메모를 추가해보세요.
            </p>
          </div>
        ) : (
          /* DndKit 정렬 가능한 그리드: 데스크톱 4열, 태블릿 2열, 모바일 1열 */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleNotes.map((n) => n.id)}
              strategy={rectSortingStrategy}
            >
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 py-4"
                role="list"
                aria-label="포스트잇 메모 목록"
              >
                {visibleNotes.map((note) => (
                  <PostItNote
                    key={note.id}
                    note={note}
                    isNew={note.id === newNoteId}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <Footer />
    </div>
  );
};
