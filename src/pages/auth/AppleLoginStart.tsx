import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { InAppBrowser } from '@capacitor/inappbrowser';
import { IoLogoApple } from 'react-icons/io5';
import AuthRedirectStatusCard from '@/components/AuthRedirectStatusCard';
import { setItem } from '@/utils/AsyncStorage';
import { setAccessToken } from '@/utils/api';
import { openSystemBrowser } from '@/utils/systemBrowser';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || 'https://api.onsikku.xyz';

const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined;
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined;
const DEFAULT_APPLE_CLIENT_ID = 'com.onsikku.app';
const DEFAULT_APPLE_REDIRECT_URI = 'https://appleid.apple.com';
const AUTH_DEBUG = (import.meta.env.VITE_AUTH_DEBUG as string | undefined) === 'true';

/**
 * (선택) 네이티브 authorize가 실패했을 때(혹은 Web 방식만 지원할 때)
 * 백엔드가 제공하는 Apple OAuth 시작 URL로 열기 위한 fallback 입니다.
 *
 * 예) https://api.onsikku.xyz/api/auth/apple/start
 *  - 로그인 완료 후 onsikku://auth?ticket=... 로 리다이렉트되면 DeepLinkBridge가 처리합니다.
 */
const APPLE_LOGIN_URL = import.meta.env.VITE_APPLE_LOGIN_URL as string | undefined;

function parseJsonSafe(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isAppleAuthCancelled(message: string, code?: unknown) {
  const normalizedMessage = message.trim();
  const normalizedCode = String(code ?? '').trim();

  return (
    normalizedCode === '1001' ||
    /AuthorizationError error 1001/i.test(normalizedMessage) ||
    /com\.apple\.AuthenticationServices/i.test(normalizedMessage)
  );
}

function mapAppleAuthError(message: string, code?: unknown) {
  if (isAppleAuthCancelled(message, code)) {
    return '애플 로그인 창이 닫혀 로그인이 취소되었어요.';
  }
  return message.trim();
}

function getErrorMessage(err: unknown, fallback: string) {
  if (!err) return fallback;
  if (err instanceof Error && err.message) {
    const maybeCode = (err as Error & { code?: unknown }).code;
    return mapAppleAuthError(err.message, maybeCode);
  }
  if (typeof err === 'string' && err.trim()) {
    return mapAppleAuthError(err);
  }

  const maybeObj = err as { message?: unknown; code?: unknown };
  if (typeof maybeObj?.message === 'string' && maybeObj.message.trim()) {
    return mapAppleAuthError(maybeObj.message, maybeObj.code);
  }
  if (maybeObj?.code != null) {
    return `${fallback} (code=${String(maybeObj.code)})`;
  }

  return fallback;
}

function toBodyPreview(text: string, maxLength = 400) {
  if (!text) return '';
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength)}...`;
}

type AppleNativePayload = {
  identityToken: string;
  authorizationCode?: string;
  user?: string;
};

async function requestAppleLogin(nativePayload: AppleNativePayload) {
  if (AUTH_DEBUG) {
    console.log('[AppleDebug] /api/auth/apple request', {
      hasIdentityToken: !!nativePayload.identityToken,
      identityTokenPrefix: nativePayload.identityToken?.slice(0, 16),
      hasAuthorizationCode: !!nativePayload.authorizationCode,
      hasUser: !!nativePayload.user,
    });
  }
  const res = await fetch(`${API_BASE}/api/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nativePayload),
  });

  const text = await res.text().catch(() => '');
  const json = parseJsonSafe(text);
  const bodyPreview = toBodyPreview(text);

  if (AUTH_DEBUG) {
    console.log('[AppleDebug] /api/auth/apple response', {
      status: res.status,
      ok: res.ok,
      hasResult: !!json?.result,
      hasTicket: !!(json?.result?.ticket ?? json?.ticket),
      baseResponseStatus: json?.baseResponseStatus,
      code: json?.code,
      message: json?.message,
      errorMessage: json?.errorMessage,
      bodyPreview,
    });
  }

  const isBackendError =
    !res.ok ||
    json?.errorMessage ||
    json?.baseResponseStatus ||
    (typeof json?.code === 'number' && json.code >= 400);

  if (isBackendError) {
    const msg =
      json?.errorMessage ||
      json?.message ||
      `애플 로그인 실패 (HTTP ${res.status}, code=${json?.code ?? 'unknown'})${
        bodyPreview ? `, body=${bodyPreview}` : ''
      }`;
    throw new Error(msg);
  }

  return json?.result ?? json;
}

async function exchangeTicket(ticket: string) {
  if (AUTH_DEBUG) {
    console.log('[AppleDebug] /api/auth/exchange request', {
      hasTicket: !!ticket,
      ticketPrefix: ticket?.slice(0, 8),
    });
  }
  const res = await fetch(`${API_BASE}/api/auth/exchange?ticket=${encodeURIComponent(ticket)}`, {
    method: 'GET',
  });

  const text = await res.text().catch(() => '');
  const json = parseJsonSafe(text);
  const bodyPreview = toBodyPreview(text);

  if (AUTH_DEBUG) {
    const payload = json?.result ?? json;
    console.log('[AppleDebug] /api/auth/exchange response', {
      status: res.status,
      ok: res.ok,
      isRegistered: payload?.isRegistered ?? payload?.registered,
      hasAccessToken: !!payload?.accessToken,
      hasRefreshToken: !!payload?.refreshToken,
      hasRegistrationToken: !!payload?.registrationToken,
      baseResponseStatus: json?.baseResponseStatus,
      code: json?.code,
      message: json?.message,
      errorMessage: json?.errorMessage,
      bodyPreview,
    });
  }

  const isBackendError =
    !res.ok ||
    json?.errorMessage ||
    json?.baseResponseStatus ||
    (typeof json?.code === 'number' && json.code >= 400);

  if (isBackendError) {
    const msg =
      json?.errorMessage ||
      json?.message ||
      `티켓 교환 실패 (HTTP ${res.status}, code=${json?.code ?? 'unknown'})${
        bodyPreview ? `, body=${bodyPreview}` : ''
      }`;
    throw new Error(msg);
  }

  return json?.result ?? json;
}

export default function AppleLoginStart() {
  const navigate = useNavigate();
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let browserClosedHandle: { remove: () => Promise<void> } | null = null;

    (async () => {
      // ✅ iOS 네이티브에서만 지원
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
        alert('애플 로그인은 iOS 앱에서만 지원됩니다.');
        navigate('/', { replace: true });
        return;
      }

      browserClosedHandle = await InAppBrowser.addListener(
        'browserClosed',
        () => {
          if (isMounted) setIsCancelled(true);
        },
      );

      let identityToken = '';
      let authorizationCode = '';
      let user = '';

      // 1) 네이티브 Sign in with Apple 시도
      try {
        if (AUTH_DEBUG) {
          try {
            const info = await App.getInfo();
            console.log('[AppleDebug] app info', {
              id: info.id,
              name: info.name,
              version: info.version,
              build: info.build,
              platform: Capacitor.getPlatform(),
            });
          } catch {
            // ignore
          }
        }

        // 동적 import로 web 번들에서 안전하게 처리
        const mod = await import('@capacitor-community/apple-sign-in');
        const SignInWithApple = mod.SignInWithApple;

        const result = await SignInWithApple.authorize({
          clientId: APPLE_CLIENT_ID || DEFAULT_APPLE_CLIENT_ID,
          redirectURI: APPLE_REDIRECT_URI || DEFAULT_APPLE_REDIRECT_URI,
          scopes: 'email name',
        });

        if (AUTH_DEBUG) {
          console.log('[AppleDebug] native authorize success', {
            hasResponse: !!result,
          });
        }

        // plugin 반환 형태가 버전에 따라 다를 수 있어 방어적으로 처리
        const response: any = (result as any)?.response ?? result;

        identityToken = response?.identityToken ?? '';
        authorizationCode = response?.authorizationCode ?? '';
        user = response?.user ?? '';
        if (!identityToken) {
          throw new Error('Apple identityToken을 받지 못했습니다.');
        }

        if (AUTH_DEBUG) {
          console.log('[AppleDebug] native payload parsed', {
            hasIdentityToken: !!response?.identityToken,
            hasAuthorizationCode: !!response?.authorizationCode,
            hasUser: !!response?.user,
            hasEmail: !!response?.email,
          });
        }
      } catch (e) {
        console.warn('[AppleLogin] native authorize failed:', e);
        if (AUTH_DEBUG) {
          console.log('[AppleDebug] native authorize failed detail', {
            message: (e as any)?.message,
            code: (e as any)?.code,
          });
        }

        const nativeErrorMessage =
          typeof (e as any)?.message === 'string' ? (e as any).message : '';
        const nativeErrorCode = (e as any)?.code;

        if (isAppleAuthCancelled(nativeErrorMessage, nativeErrorCode)) {
          if (isMounted) setIsCancelled(true);
          return;
        }

        // fallback: 네이티브 authorize 단계에서만 실행
        if (APPLE_LOGIN_URL) {
          try {
            if (isMounted) setIsCancelled(false);
            await openSystemBrowser(APPLE_LOGIN_URL);
            // ✅ 성공 시, DeepLinkBridge가 onsikku://auth?ticket=... 를 받아서 처리합니다.
            return;
          } catch (openErr) {
            console.error('[AppleLogin] fallback system browser open failed:', openErr);
          }
        }

        alert(getErrorMessage(e, '애플 로그인 인증 단계에서 오류가 발생했습니다.'));
        navigate('/', { replace: true });
        return;
      }

      // 2) 백엔드에 Apple identityToken 전달
      // - 백엔드가 직접 토큰을 반환하거나
      // - ticket만 반환하고 /api/auth/exchange로 교환하는 방식 둘 다 지원
      try {
        const applePayload = await requestAppleLogin({
          identityToken,
          authorizationCode: authorizationCode || undefined,
          user: user || undefined,
        });
        const payload = applePayload?.ticket
          ? await exchangeTicket(applePayload.ticket)
          : applePayload;

        const accessToken: string | undefined = payload?.accessToken;
        const refreshToken: string | undefined = payload?.refreshToken;
        const registrationToken: string | undefined = payload?.registrationToken;

        // boolean 키가 registered / isRegistered 둘 다 가능
        const isRegistered: boolean = payload?.isRegistered ?? payload?.registered ?? false;

        if (registrationToken) {
          await setItem('registrationToken', registrationToken);
        }
        if (accessToken) {
          console.log('🔓 Apple Access Token:', accessToken);
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
          if (AUTH_DEBUG) console.log('[AppleDebug] navigate /home');
          navigate('/home', { replace: true });
        } else {
          if (AUTH_DEBUG) console.log('[AppleDebug] navigate /signup/agree');
          navigate('/signup/agree', { replace: true });
        }
      } catch (e) {
        const errorMessage = getErrorMessage(e, '애플 로그인 처리 중 오류가 발생했습니다.');
        console.error('[AppleLogin] backend exchange failed:', errorMessage, e);
        if (AUTH_DEBUG) {
          console.log('[AppleDebug] backend exchange failed detail', {
            message: errorMessage,
            code: (e as any)?.code,
          });
        }
        alert(errorMessage);
        navigate('/', { replace: true });
      }
    })();

    return () => {
      isMounted = false;
      browserClosedHandle?.remove();
    };
  }, [navigate]);

  return (
    <AuthRedirectStatusCard
      icon={<IoLogoApple size={28} className="text-gray-950" />}
      idleTitle="애플 로그인 진행 중"
      idleDescription={'안전하게 로그인할 수 있도록\n애플 인증 화면으로 연결하고 있어요.'}
      cancelledTitle="애플 로그인이 취소되었어요"
      cancelledDescription={
        '로그인 창을 닫아 이전 단계로 돌아왔어요.\n다시 시도하거나 첫 화면으로 돌아갈 수 있어요.'
      }
      retryLabel="애플 로그인 다시 시도"
      isCancelled={isCancelled}
      onRetry={() => window.location.reload()}
    />
  );
}
