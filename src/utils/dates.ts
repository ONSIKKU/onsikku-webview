export type Item = { label: string; value: string };
export const CURRENT_YEAR = new Date().getFullYear();
// 상수(불변)로 1회만 생성
export const YEAR_ITEMS: Item[] = Array.from({ length: 121 }, (_, i) => {
  const y = CURRENT_YEAR - i; // 최근 연도가 먼저 보이도록
  return { label: String(y), value: String(y) };
});

export const MONTH_ITEMS: Item[] = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: String(i + 1).padStart(2, "0"),
}));

const hasExplicitTimezone = (value: string) => /([zZ]|[+-]\d{2}:\d{2})$/.test(value);

const normalizeDateInput = (raw: string) => {
  const trimmed = raw.trim();
  const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");

  if (/^\d{4}-\d{2}-\d{2}$/.test(withT)) {
    return `${withT}T00:00:00+09:00`;
  }

  if (hasExplicitTimezone(withT)) {
    return withT;
  }

  return `${withT}+09:00`;
};

export const parseServerDateKST = (dateString: string): Date | null => {
  if (!dateString) return null;
  const normalized = normalizeDateInput(dateString);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const formatTimeAgoKo = (dateString: string, now: Date = new Date()) => {
  const parsed = parseServerDateKST(dateString);
  if (!parsed) return "";

  const diffMs = Math.max(0, now.getTime() - parsed.getTime());
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return parsed.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
};

export const formatDateYMDKo = (dateString: string) => {
  const parsed = parseServerDateKST(dateString);
  if (!parsed) return "";

  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
};
