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

  // ✅ 같은 ticket이 중복으로 들어오는 것만 막고, 새 ticket은 처리
  const lastTicketRef = useRef<string | null>(null);
  const isHandlingRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const sub = App.addListener('appUrlOpen', async ({ url }) => {
      console.log('[DeepLink] appUrlOpen url =', url);

      if (!url) return;
      if (!url.startsWith('onsikku://auth')) return;

      let ticket = '';
      try {
        const u = new URL(url);
        ticket = u.searchParams.get('ticket') ?? '';
      } catch {
        // URL 파싱 실패
      }

      if (!ticket) {
        console.warn('[DeepLink] ticket missing');
        alert('ticket이 없습니다.');
        return;
      }

      // ✅ 같은 ticket이 또 들어오면 무시 (iOS에서 appUrlOpen 2번 오는 경우 방지)
      if (lastTicketRef.current === ticket) {
        console.log('[DeepLink] duplicated ticket ignored:', ticket);
        return;
      }

      // ✅ 처리중이면(아직 exchange 완료 전) 새 이벤트는 무시
      if (isHandlingRef.current) {
        console.log('[DeepLink] handling in progress, ignored:', ticket);
        return;
      }

      lastTicketRef.current = ticket;
      isHandlingRef.current = true;

      try {
        // 로그인 브라우저 닫기 (실패해도 진행)
        try {
          await Browser.close();
        } catch {}

        const res = await fetch(
          `${API_BASE}/api/auth/exchange?ticket=${encodeURIComponent(ticket)}`,
          { credentials: 'include' },
        );

        const text = await res.text().catch(() => '');
        const json = text ? JSON.parse(text) : null;

        // ✅ 백엔드가 에러를 body로 내려주는 경우 대비 (HTTP 200이라도 code/errorMessage 있을 수 있음)
        const isBackendError =
          !res.ok ||
          json?.errorMessage ||
          json?.baseResponseStatus ||
          (typeof json?.code === 'number' && json.code >= 400);

        if (isBackendError) {
          const msg =
            json?.errorMessage ||
            json?.message ||
            `교환 실패 (HTTP ${res.status}, code=${json?.code ?? 'unknown'})`;
          throw new Error(msg);
        }

        // BaseResponse면 result 안에 진짜 payload 있음
        const payload = json?.result ?? json;

        console.log('[DeepLink] exchange payload =', payload);

        const accessToken: string | undefined = payload?.accessToken;
        const refreshToken: string | undefined = payload?.refreshToken;
        const registrationToken: string | undefined =
          payload?.registrationToken;

        // boolean 키는 백엔드에 따라 isRegistered 또는 registered일 수 있음
        const isRegistered: boolean =
          payload?.isRegistered ?? payload?.registered ?? false;

        // 저장
        if (registrationToken) {
          await setItem('registrationToken', registrationToken);
        }
        if (accessToken) {
          setAccessToken(accessToken); // in-memory 토큰 세팅 (API 호출에 필요)
          await setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          await setItem('refreshToken', refreshToken);
        }

        if (!accessToken && !registrationToken) {
          throw new Error(
            '토큰을 받지 못했습니다. (accessToken/registrationToken 없음)',
          );
        }

        // 라우팅
        if (isRegistered) {
          navigate('/home', { replace: true });
        } else {
          navigate('/signup/role', { replace: true });
        }
      } catch (e: any) {
        console.error('[DeepLink] error:', e);
        alert(e?.message || '로그인 처리 중 오류가 발생했습니다.');

        // 실패하면 같은 ticket이라도 다시 시도 가능하게 하려면 lastTicketRef를 초기화
        lastTicketRef.current = null;

        navigate('/', { replace: true });
      } finally {
        isHandlingRef.current = false;
      }
    });

    return () => {
      sub.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
