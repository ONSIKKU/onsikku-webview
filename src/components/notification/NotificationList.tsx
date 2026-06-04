import NotificationCard from './NotificationCard';
import type { Notification } from './NotificationCard';
import Skeleton from '@/components/Skeleton';
import { IoNotificationsOutline } from 'react-icons/io5';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  refreshing?: boolean;
  error: string;
  onNavigate: (item: Notification) => void;
}

const getGroupLabel = (publishedAt: string) => {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return '이전 알림';

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const groupNotifications = (notifications: Notification[]) => {
  const groups = new Map<string, Notification[]>();

  notifications.forEach((item) => {
    const label = getGroupLabel(item.publishedAt);
    const items = groups.get(label) || [];
    items.push(item);
    groups.set(label, items);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
};

export default function NotificationList({
  notifications,
  loading,
  refreshing = false,
  error,
  onNavigate,
}: NotificationListProps) {
  if (refreshing && notifications.length === 0) {
    return <div className="py-2" />;
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="py-2 space-y-3">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="w-full rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="mb-2 ml-12 h-3.5 w-10/12" />
            <Skeleton className="ml-12 h-3.5 w-7/12" />
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
      <div className="flex flex-col items-center justify-center rounded-[18px] bg-white px-6 py-12 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-onsikku-dark-orange">
          <IoNotificationsOutline size={24} aria-hidden="true" />
        </div>
        <p className="text-base font-semibold text-gray-800">
          새로운 알림이 없습니다.
        </p>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          가족의 새 소식이 도착하면 이곳에서 알려드릴게요.
        </p>
      </div>
    );
  }

  const groups = groupNotifications(notifications);

  return (
    <div className="space-y-5 pb-4">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-2 px-1 text-xs font-bold text-gray-400">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <NotificationCard key={item.id} item={item} onClick={onNavigate} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
