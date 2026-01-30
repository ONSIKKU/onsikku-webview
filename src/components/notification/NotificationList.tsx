import React, { useEffect, useState } from 'react';
import NotificationCard from './NotificationCard';
import type { Notification } from './NotificationCard';
import { getNotifications, setAccessToken } from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { getRoleIconAndText } from '@/utils/labels';

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const safe = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(safe);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = await getItem('accessToken');
        if (token) setAccessToken(token);

        const data = await getNotifications();
        
        const mapped: Notification[] = data.map((item) => {
          const { icon, text } = item.sender 
            ? getRoleIconAndText(item.sender.familyRole, item.sender.gender)
            : { icon: '📢', text: '알림' };

          return {
            id: item.id,
            type: item.type.toLowerCase() as Notification['type'],
            actor: text,
            actorAvatar: icon,
            message: item.content,
            time: formatTimeAgo(item.createdAt),
            isRead: item.isRead,
          };
        });

        setNotifications(mapped);
      } catch (e: any) {
        console.error('Failed to fetch notifications', e);
        setError('알림을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
         <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-onsikku-dark-orange" />
      </div>
    );
  }

  if (error) {
     return <div className="py-10 text-center text-gray-500 text-base">{error}</div>;
  }

  if (notifications.length === 0) {
    return <div className="py-10 text-center text-gray-500 text-base">새로운 알림이 없습니다.</div>;
  }

  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      {notifications.map((item) => (
        <NotificationCard key={item.id} item={item} />
      ))}
    </div>
  );
}
