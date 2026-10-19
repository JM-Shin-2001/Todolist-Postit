import { NoteColor } from '../types/note';

/**
 * 2026. 10. 19. (월) 오후 3:30 형식의 한국어 날짜/시간 포맷터
 */
export function formatKoreanDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[date.getDay()];

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const paddedMinutes = String(minutes).padStart(2, '0');

    return `${year}. ${month}. ${day}. (${dayOfWeek}) ${period} ${displayHour}:${paddedMinutes}`;
  } catch {
    return isoString;
  }
}

/**
 * 포스트잇 색상 정의
 * 0: 노랑, 1: 분홍, 2: 초록, 3: 파랑
 */
export interface NoteColorStyle {
  name: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  tagBg: string;
  tagText: string;
  tapeBg: string;
}

export const NOTE_COLOR_STYLES: Record<NoteColor, NoteColorStyle> = {
  0: {
    name: '노랑',
    bgLight: 'bg-[#fff9a6]',
    bgDark: 'dark:bg-[#4a461b]',
    borderLight: 'border-[#f0e784]',
    borderDark: 'dark:border-[#635f29]',
    tagBg: 'bg-[#ffed4a]/60 dark:bg-[#736d22]',
    tagText: 'text-[#635900] dark:text-[#fef08a]',
    tapeBg: 'bg-[#fef08a]/60 dark:bg-[#736d22]/50',
  },
  1: {
    name: '분홍',
    bgLight: 'bg-[#ffd3e2]',
    bgDark: 'dark:bg-[#4d1f2e]',
    borderLight: 'border-[#fca5c5]',
    borderDark: 'dark:border-[#732a43]',
    tagBg: 'bg-[#f472b6]/30 dark:bg-[#831843]/60',
    tagText: 'text-[#9d174d] dark:text-[#fbcfe8]',
    tapeBg: 'bg-[#fbcfe8]/60 dark:bg-[#831843]/50',
  },
  2: {
    name: '초록',
    bgLight: 'bg-[#d2f8d2]',
    bgDark: 'dark:bg-[#1b4324]',
    borderLight: 'border-[#a3e6a3]',
    borderDark: 'dark:border-[#276135]',
    tagBg: 'bg-[#4ade80]/30 dark:bg-[#14532d]/60',
    tagText: 'text-[#166534] dark:text-[#bbf7d0]',
    tapeBg: 'bg-[#bbf7d0]/60 dark:bg-[#14532d]/50',
  },
  3: {
    name: '파랑',
    bgLight: 'bg-[#d0ecff]',
    bgDark: 'dark:bg-[#193a52]',
    borderLight: 'border-[#9bd6fb]',
    borderDark: 'dark:border-[#255273]',
    tagBg: 'bg-[#38bdf8]/30 dark:bg-[#0c4a6e]/60',
    tagText: 'text-[#075985] dark:text-[#bae6fd]',
    tapeBg: 'bg-[#bae6fd]/60 dark:bg-[#0c4a6e]/50',
  },
};

/**
 * 고정된 미세 회전각 (메모 id 해시 기반으로 렌더링 간 일관되게)
 */
export function getRotationClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const rotations = [
    '-rotate-1',
    'rotate-1',
    '-rotate-[0.5deg]',
    'rotate-[0.5deg]',
    '-rotate-1.5',
    'rotate-1.5',
    'rotate-0',
  ];
  const index = Math.abs(hash) % rotations.length;
  return rotations[index];
}
