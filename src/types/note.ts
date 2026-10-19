export type NoteCategory = '할 일' | '아이디어' | '기타';

export type NoteColor = 0 | 1 | 2 | 3; // 0=노랑, 1=분홍, 2=초록, 3=파랑

export type NoteState = '' | '완료';

export interface Note {
  id: string;          // 변경되지 않는 고유 식별자
  timestamp: string;   // 마지막 저장·수정 시각 (ISO)
  datetime: string;    // 최초 생성 시각 (ISO)
  category: NoteCategory;
  content: string;
  color: NoteColor;
  state: NoteState;
  order: number;       // 표시 순서
}

export type CategoryFilter = '전체' | NoteCategory;
