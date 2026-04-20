import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoRefreshOutline } from 'react-icons/io5';
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
import { formatTimeAgoKo } from '@/utils/dates';
import type { Notification } from '@/components/notification/NotificationCard';
import { useNotificationStore } from '@/features/notification/notificationStore';

export default function NotificationPage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startY, setStartY] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const PULL_MAX = 104;
  const PULL_TRIGGER = 58;
  const PULL_SNAP = 52;

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const response = await getNotifications(0, 50); // Fetch first 50 for now
      const data = response.notificationHistorySlice.content;
      setUnreadCount(response.unReadCount || 0);
      
      const mapped: Notification[] = data.map((item) => {
        const { icon, text } = item.member 
          ? getRoleIconAndText(item.member.familyRole, getGenderFromRole(item.member.familyRole))
          : { icon: '📢', text: '알림' };

        const backendTitle = (item.title || '').trim();
        const backendBody = (item.body || '').trim();
        const payloadValues = Object.values(item.payload || {}).filter(
          (value): value is string => Boolean(value && value.trim()),
        );
        const payloadText = payloadValues[0] || '';

        // Map backend types to UI types
        let uiType: Notification['type'] = 'system_notice';
        switch (item.notificationType) {
          case 'COMMENT_ADDED': uiType = 'comment'; break;
          case 'REACTION_ADDED': uiType = 'reaction'; break;
          case 'ANSWER_ADDED': uiType = 'answer'; break;
          case 'TODAY_TARGET_MEMBER_ANNOUNCED': uiType = 'target_announced'; break;
          case 'TODAY_TARGET_MEMBER': uiType = 'new_question'; break;
          case 'KNOCK_KNOCK': uiType = 'knock_knock'; break;
          case 'MEMBER_JOINED': uiType = 'member_joined'; break;
          case 'WEEKLY_REPORT': uiType = 'weekly_report'; break;
          case 'SYSTEM_NOTICE': uiType = 'system_notice'; break;
          default: uiType = 'system_notice'; break;
        }

        // Extract related ID from payload or deepLink
        let relatedId =
          item.payload?.questionAssignmentId ||
          item.payload?.memberQuestionId ||
          item.payload?.questionInstanceId;
        if (!relatedId && item.deepLink) {
           try {
             const url = new URL(item.deepLink, 'https://dummy.com');
             relatedId =
               url.searchParams.get('questionAssignmentId') ||
               url.searchParams.get('questionInstanceId') ||
               undefined;
           } catch (e) {
             console.warn('Invalid deepLink URL', item.deepLink);
           }
        }

        return {
          id: item.id,
          type: uiType,
          actor: text,
          actorAvatar: icon,
          title: backendTitle,
          body: backendBody,
          message: backendBody || payloadText || backendTitle || '새로운 알림이 도착했어요.',
          time: formatTimeAgoKo(item.publishedAt),
          isRead: !!(item.readAt || item.confirmedAt),
          relatedEntityId: relatedId || undefined,
        };
      });

      setNotifications(mapped);
    } catch (e: any) {
      console.error('Failed to fetch notifications', e);
      setError('알림을 불러오지 못했습니다.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPullY(PULL_SNAP);
    const startedAt = Date.now();

    try {
      await fetchNotifications(false);
    } finally {
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, 420 - elapsed);
      if (remain > 0) {
        await new Promise((resolve) => setTimeout(resolve, remain));
      }
      setRefreshing(false);
      setPullY(0);
      setStartY(0);
      setIsPulling(false);
    }
  }, [fetchNotifications]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY > 0 || refreshing) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling || startY === 0 || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0 && window.scrollY <= 0) {
      const damped = Math.min(PULL_MAX, diff * 0.38);
      setPullY(damped);
      e.preventDefault();
      return;
    }

    setPullY(0);
  };

  const onTouchEnd = async () => {
    if (refreshing) return;

    if (pullY >= PULL_TRIGGER) {
      await handleRefresh();
      return;
    }

    setPullY(0);
    setStartY(0);
    setIsPulling(false);
  };

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

    switch (item.type) {
      case 'comment':
      case 'reaction':
      case 'answer':
      case 'all_answered':
        if (!item.relatedEntityId) return;
        navigate(`/reply-detail?questionInstanceId=${item.relatedEntityId}`);
        break;
      case 'new_question':
      case 'knock_knock':
        if (!item.relatedEntityId) return;
        navigate(`/reply?questionAssignmentId=${item.relatedEntityId}`);
        break;
      case 'target_announced':
      case 'member_joined':
      case 'weekly_report':
      case 'system_notice':
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div
      className="min-h-screen bg-orange-50 overflow-hidden relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="absolute top-0 left-0 right-0 z-10 flex justify-center items-center pointer-events-none"
        style={{
          height: '56px',
          transform: `translateY(${pullY - 56}px)`,
          opacity: pullY > 8 ? 1 : 0,
          transition: isPulling && !refreshing
            ? 'none'
            : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
        }}
      >
        <div className="p-2.5 rounded-full bg-white/95 shadow-md backdrop-blur-[1px]">
          <IoRefreshOutline
            size={22}
            className={`text-onsikku-dark-orange ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: refreshing ? undefined : `rotate(${pullY * 2.4}deg)` }}
          />
        </div>
      </div>

      <div
        className="flex flex-col gap-5 px-5 pb-10 pt-4"
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isPulling && !refreshing
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <NotificationSummary 
          unreadCount={unreadCount} 
          totalCount={notifications.length}
          onMarkAllRead={handleMarkAllRead}
          onDeleteAll={handleDeleteAll}
        />
        <NotificationList 
          notifications={notifications}
          loading={loading && !refreshing}
          refreshing={refreshing}
          error={error}
          onRead={handleRead}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
