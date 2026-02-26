import { create } from 'zustand';
import { getNotifications, setAccessToken } from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';

interface NotificationStoreState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  refreshUnreadCount: async () => {
    try {
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const response = await getNotifications(0, 1);
      set({ unreadCount: Math.max(0, response.unReadCount || 0) });
    } catch (error) {
      console.error('Failed to refresh unread notification count', error);
    }
  },
}));
