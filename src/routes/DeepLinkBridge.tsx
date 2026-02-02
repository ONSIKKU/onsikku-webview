import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { setItem } from '@/utils/AsyncStorage';
import { setAccessToken } from '@/utils/api';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  'https://api.onsikku.xyz';

export default function DeepLinkBridge() {
  const navigate = useNavigate();
  const calledRef = useRef(false);

  useEffect(() => {
    // 네이티브 환경이 아니면 실행 중단
    if (!Capacitor.isNativePlatform()) return;

    // App.addListener는 Promise<PluginListenerHandle>을 반환합니다.
    const sub = App.addListener('appUrlOpen', async ({ url }) => {
      if (calledRef.current) return;
      if (!url?.startsWith('onsikku://auth')) return;

      calledRef.current = true;

      try {
        const u = new URL(url);
        const ticket = u.searchParams.get('ticket');
        if (!ticket) throw new Error('ticket이 없습니다.');

        // 1) 인증용 브라우저 닫기
        await Browser.close();

        // 2) 백엔드와 티켓 교환 (토큰 수령)
        const res = await fetch(
          `${API_BASE}/api/auth/exchange?ticket=${encodeURIComponent(ticket)}`,
          { credentials: 'include' },
        );

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`토큰 교환 실패(${res.status}) ${txt}`);
        }

        const json = await res.json();
        const { accessToken, registrationToken, registered } =
          json?.result ?? json;

        // 3) 토큰 저장 및 헤더 설정
        if (registrationToken)
          await setItem('registrationToken', registrationToken);
        if (accessToken) {
          await setAccessToken(accessToken); // API 헤더 설정
          await setItem('accessToken', accessToken);
        }

        // 4) 사용자 상태에 따른 라우팅
        if (registered) {
          navigate('/home', { replace: true });
        } else {
          navigate('/signup/role', { replace: true });
        }
      } catch (e: any) {
        console.error('DeepLink Error:', e);
        alert(e?.message || '로그인 처리 중 오류가 발생했습니다.');
        navigate('/', { replace: true });
      } finally {
        // 실패 시 재시도를 위해 초기화하거나 그대로 유지
        calledRef.current = false;
      }
    });

    // ✅ 클린업: Promise가 해결된 후 remove() 호출
    return () => {
      sub.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
