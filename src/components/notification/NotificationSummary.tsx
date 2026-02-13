import { IoNotificationsOutline } from 'react-icons/io5';

interface NotificationSummaryProps {
  unreadCount: number;
  totalCount: number;
  onMarkAllRead: () => void;
}

export default function NotificationSummary({
  unreadCount,
  totalCount,
  onMarkAllRead,
}: NotificationSummaryProps) {
  return (
    <div className="bg-white w-full p-6 rounded-2xl shadow-sm">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center">
          <IoNotificationsOutline size={24} color="#F97315" />
          <div className="text-lg font-bold text-gray-800 ml-2">알림</div>
          {unreadCount > 0 && (
            <div className="bg-red-500 rounded-full w-5 h-5 justify-center items-center ml-1 flex">
              <div className="text-white text-xs font-bold">{unreadCount}</div>
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="active:opacity-70"
          >
            <div className="text-sm text-orange-500">✓ 모두 읽음</div>
          </button>
        )}
      </div>

      <div className="text-sm text-gray-500 mt-2">
        {totalCount === 0
          ? '새로운 알림이 없습니다'
          : `총 ${totalCount}개의 알림이 있어요`}
      </div>
    </div>
  );
}
