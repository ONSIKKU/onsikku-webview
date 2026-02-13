import NotificationCard from './NotificationCard';
import type { Notification } from './NotificationCard';

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
      <div className="py-10 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-onsikku-dark-orange" />
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
    <div className="flex flex-col" style={{ gap: 12 }}>
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
