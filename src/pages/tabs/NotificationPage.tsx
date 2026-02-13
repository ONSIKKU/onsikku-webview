import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationList from '@/components/notification/NotificationList';
import NotificationSummary from '@/components/notification/NotificationSummary';
import { 
  getNotifications, 
  readNotification, 
  deleteNotification, 
  setAccessToken 
} from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { getRoleIconAndText } from '@/utils/labels';
import type { Notification } from '@/components/notification/NotificationCard';

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

export default function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
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
          relatedEntityId: item.relatedEntityId,
        };
      });

      setNotifications(mapped);
    } catch (e: any) {
      console.error('Failed to fetch notifications', e);
      setError('알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      // API only supports individual read, so we call them in parallel
      await Promise.all(unreadIds.map(id => readNotification(id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await readNotification(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleNavigate = async (item: Notification) => {
    if (!item.isRead) {
      await handleRead(item.id);
    }

    if (!item.relatedEntityId) return;

    switch (item.type) {
      case 'comment':
      case 'reaction':
      case 'answer':
      case 'all_answered':
        navigate(`/reply-detail?questionInstanceId=${item.relatedEntityId}`);
        break;
      case 'new_question':
        navigate(`/reply?questionAssignmentId=${item.relatedEntityId}`);
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="flex flex-col gap-5 px-5 pb-10 pt-4">
        <NotificationSummary 
          unreadCount={unreadCount} 
          totalCount={notifications.length}
          onMarkAllRead={handleMarkAllRead}
        />
        <NotificationList 
          notifications={notifications}
          loading={loading}
          error={error}
          onRead={handleRead}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
