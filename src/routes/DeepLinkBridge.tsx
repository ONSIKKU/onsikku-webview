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

/**
 * ✅ 백엔드가 302로 onsikku://auth?ticket=... 보내면
 * 여기서 받아서:
 * 1) Browser.close()
 * 2) /api/auth/exchange?ticket=... 호출
 * 3) 토큰 저장 + 라우팅
 */
export default function DeepLinkBridge() {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appUrlOpen', async ({ url }) => {
      if (!url) return;
      if (handledRef.current) return;

      // ✅ 백엔드에서 보내는 딥링크 형태와 반드시 일치해야 함
      // onsikku://auth?ticket=...
      if (!url.startsWith('onsikku://auth')) return;

      handledRef.current = true;

      try {
        const u = new URL(url);
        const ticket = u.searchParams.get('ticket');
        if (!ticket) throw new Error('ticket이 없습니다.');

        // 1) 카카오 로그인 브라우저 닫기
        try {
          await Browser.close();
        } catch {
          // close가 실패해도 진행 가능
        }

        // 2) ticket -> token 교환
        const res = await fetch(
          `${API_BASE}/api/auth/exchange?ticket=${encodeURIComponent(ticket)}`,
          { credentials: 'include' },
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`토큰 교환 실패(${res.status}) ${txt}`);
        }

        const json = await res.json();
        const payload = json?.result ?? json;

        // 백엔드 AuthResponse 형태에 맞춰 파싱
        const accessToken: string | undefined = payload?.accessToken;
        const registrationToken: string | undefined =
          payload?.registrationToken;
        const registered: boolean | undefined =
          payload?.isRegistered ?? payload?.registered;

        // 3) 저장 + API 헤더 세팅
        if (registrationToken) {
          await setItem('registrationToken', registrationToken);
        }
        if (accessToken) {
          await setItem('accessToken', accessToken);
          await setAccessToken(accessToken);
        }

        // 4) 라우팅
        if (registered) {
          navigate('/home', { replace: true });
        } else {
          navigate('/signup/role', { replace: true });
        }
      } catch (e: any) {
        console.error('DeepLink Error:', e);
        alert(e?.message || '로그인 처리 중 오류가 발생했습니다.');
        handledRef.current = false; // 실패 시 재시도 가능하게
        navigate('/', { replace: true });
      }
    });

    return () => {
      // App.addListener는 Promise handle을 반환하는 환경도 있어서 안전하게 처리
      (async () => {
        const h: any = await listener;
        h?.remove?.();
      })();
    };
  }, [navigate]);

  return null;
}
