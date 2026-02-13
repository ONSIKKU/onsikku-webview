import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { setItem } from '@/utils/AsyncStorage';
import { setAccessToken } from '@/utils/api';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || 'https://api.onsikku.xyz';

const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;

/**
 * (선택) 네이티브 authorize가 실패했을 때(혹은 Web 방식만 지원할 때)
 * 백엔드가 제공하는 Apple OAuth 시작 URL로 열기 위한 fallback 입니다.
 *
 * 예) https://api.onsikku.xyz/api/auth/apple/start
 *  - 로그인 완료 후 onsikku://auth?ticket=... 로 리다이렉트되면 DeepLinkBridge가 처리합니다.
 */
const APPLE_LOGIN_URL = import.meta.env.VITE_APPLE_LOGIN_URL as string | undefined;

function safeRandom(): string {
  try {
    // 최신 브라우저/웹뷰
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

export default function AppleLoginStart() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // ✅ iOS 네이티브에서만 지원
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        alert('애플 로그인은 iOS 앱에서만 지원됩니다.');
        navigate('/', { replace: true });
        return;
      }

      // 1) 네이티브 Sign in with Apple 시도
      try {
        // 동적 import로 web 번들에서 안전하게 처리
        const mod = await import('@capacitor-community/apple-sign-in');
        const SignInWithApple = mod.SignInWithApple;

        if (!APPLE_CLIENT_ID || !APPLE_REDIRECT_URI) {
          throw new Error(
            'Apple 로그인 환경변수(VITE_APPLE_CLIENT_ID / VITE_APPLE_REDIRECT_URI)가 필요합니다. (.env 설정 확인)',
          );
        }

        const result = await SignInWithApple.authorize({
          clientId: APPLE_CLIENT_ID,
          redirectURI: APPLE_REDIRECT_URI,
          scopes: 'email name',
          state: safeRandom(),
          nonce: safeRandom(),
        });

        // plugin 반환 형태가 버전에 따라 다를 수 있어 방어적으로 처리
        const response: any = (result as any)?.response ?? result;

        const identityToken = response?.identityToken;
        const authorizationCode = response?.authorizationCode;
        const user = response?.user;
        const email = response?.email;
        const givenName = response?.givenName;
        const familyName = response?.familyName;

        // 2) 백엔드에 토큰 검증 + 우리 서비스 토큰 발급 요청
        // ⚠️ 엔드포인트/바디는 백엔드 구현에 따라 달라질 수 있습니다.
        const res = await fetch(`${API_BASE}/api/auth/apple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identityToken,
            authorizationCode,
            user,
            email,
            givenName,
            familyName,
          }),
        });

        const text = await res.text().catch(() => '');
        const json = text ? JSON.parse(text) : null;

        const isBackendError =
          !res.ok ||
          json?.errorMessage ||
          json?.baseResponseStatus ||
          (typeof json?.code === 'number' && json.code >= 400);

        if (isBackendError) {
          const msg =
            json?.errorMessage ||
            json?.message ||
            `애플 로그인 실패 (HTTP ${res.status}, code=${json?.code ?? 'unknown'})`;
          throw new Error(msg);
        }

        const payload = json?.result ?? json;

        const accessToken: string | undefined = payload?.accessToken;
        const refreshToken: string | undefined = payload?.refreshToken;
        const registrationToken: string | undefined = payload?.registrationToken;

        // boolean 키가 registered / isRegistered 둘 다 가능
        const isRegistered: boolean = payload?.isRegistered ?? payload?.registered ?? false;

        if (registrationToken) {
          await setItem('registrationToken', registrationToken);
        }
        if (accessToken) {
          console.log("🔓 Apple Access Token:", accessToken);
          setAccessToken(accessToken);
          await setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          await setItem('refreshToken', refreshToken);
        }

        if (!accessToken && !registrationToken) {
          throw new Error('토큰을 받지 못했습니다. (accessToken/registrationToken 없음)');
        }

        // 라우팅
        if (isRegistered) {
          navigate('/home', { replace: true });
        } else {
          navigate('/signup/role', { replace: true });
        }
        return;
      } catch (e: any) {
        console.warn('[AppleLogin] native authorize failed:', e);

        // 2) fallback: 백엔드 OAuth 시작 URL이 있다면 브라우저로 열기
        if (APPLE_LOGIN_URL) {
          try {
            await Browser.open({ url: APPLE_LOGIN_URL, presentationStyle: 'fullscreen' });
            // ✅ 성공 시, DeepLinkBridge가 onsikku://auth?ticket=... 를 받아서 처리합니다.
            return;
          } catch (openErr) {
            console.error('[AppleLogin] fallback Browser.open failed:', openErr);
          }
        }

        alert(e?.message || '애플 로그인 중 오류가 발생했습니다.');
        navigate('/', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
      애플 로그인 진행중...
    </div>
  );
}
