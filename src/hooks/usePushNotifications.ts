import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItem } from '@/utils/AsyncStorage';
import {
  initPushNotifications,
  unregisterPushNotifications,
} from '@/utils/pushNotifications';

/**
 * ✅ 라우터가 있는 컴포넌트(예: TabsLayout)에서 호출하세요.
 * - 푸시를 눌렀을 때 notification 탭으로 이동하는 기본 동작을 제공합니다.
 */
export function usePushNotifications() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const alarmEnabled = await getItem('alarmEnabled');
      const shouldEnablePush = alarmEnabled !== 'false';

      if (!shouldEnablePush) {
        await unregisterPushNotifications();
        return;
      }

      await initPushNotifications({
        confirmBeforeRequest: false,
        onActionPerformed: (event) => {
          if (cancelled) return;

          const data = event?.notification?.data as any;

          // 서버가 payload.data로 딥링크를 내려주는 경우 대응
          const link: unknown = data?.link ?? data?.url ?? data?.path;

          if (typeof link === 'string' && link.startsWith('/')) {
            navigate(link);
            return;
          }

          // 기본: 알림 탭으로 이동
          navigate('/notification');
        },
      });
    };

    run().catch((e) => console.warn('[Push] init failed:', e));

    return () => {
      cancelled = true;
    };
  }, [navigate]);
}
