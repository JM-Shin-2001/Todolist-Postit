import { Note } from '../types/note';

export interface NoteStorageRepository {
  getNotes(): Promise<Note[]>;
  saveNotes(notes: Note[]): Promise<void>;
  createNote(note: Note): Promise<void>;
  updateNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  updateNoteOrders(orderedNotes: Note[]): Promise<void>;
}

const STORAGE_KEY = 'postit_todo_notes_v1';

/**
 * 1. 로컬 스토리지 레포지토리
 */
export class LocalStorageNoteRepository implements NoteStorageRepository {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  async getNotes(): Promise<Note[]> {
    if (!this.isBrowser()) return [];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const validatedNotes: Note[] = parsed
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item, index) => {
          const colorNum = Number(item.color);
          const validColor = ([0, 1, 2, 3].includes(colorNum) ? colorNum : 0) as Note['color'];
          const category = (['할 일', '아이디어', '기타'].includes(String(item.category))
            ? item.category
            : '할 일') as Note['category'];
          const state = (item.state === '완료' ? '완료' : '') as Note['state'];

          return {
            id: String(item.id || `note-${Date.now()}-${index}`),
            timestamp: String(item.timestamp || new Date().toISOString()),
            datetime: String(item.datetime || new Date().toISOString()),
            category,
            content: String(item.content || ''),
            color: validColor,
            state,
            order: typeof item.order === 'number' ? item.order : index,
          };
        })
        .sort((a, b) => a.order - b.order);

      return validatedNotes;
    } catch (err) {
      console.error('Failed to load notes from localStorage:', err);
      throw new Error('저장된 메모를 불러오는 중 오류가 발생했습니다.');
    }
  }

  async saveNotes(notes: Note[]): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notes to localStorage:', err);
      throw new Error('메모를 로컬 저장소에 저장하지 못했습니다.');
    }
  }

  async createNote(note: Note): Promise<void> {
    const notes = await this.getNotes();
    notes.push(note);
    await this.saveNotes(notes);
  }

  async updateNote(updated: Note): Promise<void> {
    const notes = await this.getNotes();
    const index = notes.findIndex((n) => n.id === updated.id);
    if (index !== -1) {
      notes[index] = updated;
      await this.saveNotes(notes);
    }
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    const filtered = notes.filter((n) => n.id !== id);
    const reordered = filtered.map((item, idx) => ({ ...item, order: idx }));
    await this.saveNotes(reordered);
  }

  async updateNoteOrders(orderedNotes: Note[]): Promise<void> {
    await this.saveNotes(orderedNotes);
  }
}

/**
 * 2. 구글 시트 (Google Apps Script Web App) 레포지토리
 */
export class GoogleSheetsNoteRepository implements NoteStorageRepository {
  private scriptUrl: string;
  private localFallback = new LocalStorageNoteRepository();

  constructor(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
  }

  private async sendPostRequest(payload: unknown): Promise<void> {
    try {
      // Google Apps Script 웹 앱은 리다이렉트 및 CORS 정책상 브라우저 직접 POST 시 
      // mode: 'no-cors'를 사용해야 Failed to fetch 오류 없이 안전하게 전송됩니다.
      await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
    } catch (err) {
      console.warn('Google Sheets background sync failed:', err);
    }
  }

  async getNotes(): Promise<Note[]> {
    try {
      const response = await fetch(`${this.scriptUrl}?t=${Date.now()}`, {
        method: 'GET',
        mode: 'cors',
      });
      const data = await response.json();
      if (!data.success || !Array.isArray(data.notes)) {
        throw new Error(data.error || '시트 데이터를 불러오지 못했습니다.');
      }

      const validated: Note[] = data.notes.map((item: any, index: number) => ({
        id: String(item.id || `note-${Date.now()}-${index}`),
        timestamp: String(item.timestamp || new Date().toISOString()),
        datetime: String(item.datetime || new Date().toISOString()),
        category: (['할 일', '아이디어', '기타'].includes(item.category)
          ? item.category
          : '할 일') as Note['category'],
        content: String(item.content || ''),
        color: ([0, 1, 2, 3].includes(Number(item.color)) ? Number(item.color) : 0) as Note['color'],
        state: item.state === '완료' ? '완료' : '',
        order: typeof item.order === 'number' ? item.order : index,
      }));

      // 로컬 스토리지에도 캐시 백업
      await this.localFallback.saveNotes(validated);
      return validated;
    } catch (err) {
      console.warn('Google Sheets fetch failed, falling back to localStorage cache:', err);
      return await this.localFallback.getNotes();
    }
  }

  async saveNotes(notes: Note[]): Promise<void> {
    // 로컬 즉시 반영
    await this.localFallback.saveNotes(notes);
    // 구글 시트에 일괄 동기화
    await this.sendPostRequest({
      action: 'saveAll',
      notes,
    });
  }

  async createNote(note: Note): Promise<void> {
    await this.localFallback.createNote(note);
    await this.sendPostRequest({
      action: 'create',
      note,
    });
  }

  async updateNote(note: Note): Promise<void> {
    await this.localFallback.updateNote(note);
    await this.sendPostRequest({
      action: 'update',
      note,
    });
  }

  async deleteNote(id: string): Promise<void> {
    await this.localFallback.deleteNote(id);
    await this.sendPostRequest({
      action: 'delete',
      id,
    });
  }

  async updateNoteOrders(orderedNotes: Note[]): Promise<void> {
    await this.saveNotes(orderedNotes);
  }
}

/**
 * 환경 변수(NEXT_PUBLIC_GOOGLE_SCRIPT_URL) 값에 따라
 * 구글 시트 연동 인스턴스 또는 로컬스토리지 인스턴스를 자동으로 활성화
 */
const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL?.trim();

export const noteRepository: NoteStorageRepository = GOOGLE_SCRIPT_URL
  ? new GoogleSheetsNoteRepository(GOOGLE_SCRIPT_URL)
  : new LocalStorageNoteRepository();
