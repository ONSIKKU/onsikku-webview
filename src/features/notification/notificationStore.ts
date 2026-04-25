import { create } from 'zustand';
import { getUnreadNotificationCount, setAccessToken } from '@/utils/api';
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

      const unreadCount = await getUnreadNotificationCount();
      set({ unreadCount: Math.max(0, unreadCount) });
    } catch (error) {
      console.error('Failed to refresh unread notification count', error);
    }
  },
}));
