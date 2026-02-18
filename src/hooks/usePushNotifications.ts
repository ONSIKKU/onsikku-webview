import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initPushNotifications } from '@/utils/pushNotifications';

/**
 * ✅ 라우터가 있는 컴포넌트(예: TabsLayout)에서 호출하세요.
 * - 푸시를 눌렀을 때 notification 탭으로 이동하는 기본 동작을 제공합니다.
 */
export function usePushNotifications() {
  const navigate = useNavigate();

  useEffect(() => {
    initPushNotifications({
      confirmBeforeRequest: false,
      onActionPerformed: (event) => {
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
    }).catch((e) => console.warn('[Push] init failed:', e));
  }, [navigate]);
}
