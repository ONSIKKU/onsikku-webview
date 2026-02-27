import NotificationCard from './NotificationCard';
import type { Notification } from './NotificationCard';
import Skeleton from '@/components/Skeleton';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: string;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (item: Notification) => void;
}

export default function NotificationList({
  notifications,
  loading,
  error,
  onDelete,
  onNavigate,
}: NotificationListProps) {
  if (loading && notifications.length === 0) {
    return (
      <div className="py-2 space-y-3">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="w-full p-4 rounded-2xl shadow-sm bg-white border border-transparent"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="w-5 h-5 rounded" />
            </div>
            <Skeleton className="h-4 w-11/12 mb-2" />
            <Skeleton className="h-4 w-4/5 mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-gray-500 text-base">{error}</div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500 text-base">
        새로운 알림이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {notifications.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          onClick={onNavigate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
