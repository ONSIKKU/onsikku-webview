import { useState } from 'react';
import { IoEllipsisHorizontal } from 'react-icons/io5';

interface NotificationSummaryProps {
  unreadCount: number;
  totalCount: number;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
}

export default function NotificationSummary({
  unreadCount,
  totalCount,
  onMarkAllRead,
  onDeleteAll,
}: NotificationSummaryProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const unreadText =
    totalCount === 0
      ? '새로운 알림이 없습니다'
      : unreadCount > 0
        ? `읽지 않은 알림 ${unreadCount}개`
        : '모든 알림을 확인했어요';

  return (
    <header className="relative px-1 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-8 text-gray-950">알림</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">{unreadText}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="rounded-full px-3 py-2 text-sm font-semibold text-onsikku-dark-orange transition active:bg-orange-100 disabled:text-gray-300 disabled:active:bg-transparent"
          >
            모두 읽음
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition active:bg-orange-100"
            aria-label="알림 옵션"
            aria-expanded={isMenuOpen}
          >
            <IoEllipsisHorizontal size={22} />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute right-1 top-11 z-20 w-40 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onDeleteAll();
            }}
            disabled={totalCount === 0}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-red-500 transition active:bg-red-50 disabled:text-gray-300"
          >
            전체 삭제
          </button>
        </div>
      )}
    </header>
  );
}
