import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationList from '@/components/notification/NotificationList';
import NotificationSummary from '@/components/notification/NotificationSummary';
import { useModalStore } from '@/features/modal/modalStore';
import { 
  getNotifications, 
  readNotification, 
  deleteNotification, 
  setAccessToken,
  getGenderFromRole
} from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { getRoleIconAndText } from '@/utils/labels';
import type { Notification } from '@/components/notification/NotificationCard';
import { useNotificationStore } from '@/features/notification/notificationStore';

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
  const { openModal } = useModalStore();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const response = await getNotifications(0, 50); // Fetch first 50 for now
      const data = response.notificationHistorySlice.content;
      setUnreadCount(response.unReadCount || 0);
      
      const mapped: Notification[] = data.map((item) => {
        const { icon, text } = item.member 
          ? getRoleIconAndText(item.member.familyRole, getGenderFromRole(item.member.familyRole))
          : { icon: '📢', text: '알림' };

        // Map backend types to UI types
        let uiType: Notification['type'] = 'comment';
        switch (item.notificationType) {
          case 'COMMENT_ADDED': uiType = 'comment'; break;
          case 'REACTION_ADDED': uiType = 'reaction'; break;
          case 'ANSWER_ADDED': uiType = 'answer'; break;
          case 'TODAY_TARGET_MEMBER_ANNOUNCED': uiType = 'all_answered'; break;
          case 'TODAY_TARGET_MEMBER': uiType = 'new_question'; break;
          default: uiType = 'comment'; break;
        }

        // Extract related ID from payload or deepLink
        let relatedId = item.payload?.memberQuestionId || item.payload?.questionInstanceId;
        if (!relatedId && item.deepLink) {
           try {
             const url = new URL(item.deepLink, 'https://dummy.com');
             relatedId = url.searchParams.get('questionInstanceId') || url.searchParams.get('questionAssignmentId') || undefined;
           } catch (e) {
             console.warn('Invalid deepLink URL', item.deepLink);
           }
        }

        return {
          id: item.id,
          type: uiType,
          actor: text,
          actorAvatar: icon,
          message: item.body || item.title,
          time: formatTimeAgo(item.publishedAt),
          isRead: !!(item.readAt || item.confirmedAt),
          relatedEntityId: relatedId || undefined,
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
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await readNotification(id);
      setNotifications(prev => {
        const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
        setUnreadCount(next.filter(n => !n.isRead).length);
        return next;
      });
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => {
        const next = prev.filter(n => n.id !== id);
        setUnreadCount(next.filter(n => !n.isRead).length);
        return next;
      });
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;

    openModal({
      type: 'confirm',
      title: '전체 삭제',
      content: '모든 알림을 삭제하시겠어요?',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          const ids = notifications.map((n) => n.id);
          await Promise.all(ids.map((id) => deleteNotification(id)));
          setNotifications([]);
          setUnreadCount(0);
        } catch (e) {
          console.error('Failed to delete all notifications', e);
          openModal({ content: '전체 삭제에 실패했습니다.' });
        }
      },
    });
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
          onDeleteAll={handleDeleteAll}
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
