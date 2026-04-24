import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
  type Token,
} from '@capacitor/push-notifications';
import { getItem, removeItem, setItem } from '@/utils/AsyncStorage';
import { deletePushToken, setAccessToken, upsertPushToken } from '@/utils/api';

const PUSH_TOKEN_STORAGE_KEY = 'pushToken';
const ANDROID_DEFAULT_CHANNEL_ID = 'onsikku_default';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SyncPushTokenParams = {
  token: string;
  platform: string;
  fcmToken?: string;
};

const syncPushToken = async ({ token, platform, fcmToken }: SyncPushTokenParams) => {
  const prev = await getItem(PUSH_TOKEN_STORAGE_KEY);

  console.log('[Push][Sync] token candidate', {
    platform,
    hasFcmToken: Boolean(fcmToken),
    changed: prev !== token,
    tokenPreview: `${token.slice(0, 12)}...`,
  });

  const accessToken = await getItem('accessToken');
  if (accessToken) {
    setAccessToken(accessToken);
  } else {
    console.warn('[Push][Sync] access token missing, skip token upload');
    return;
  }

  await upsertPushToken({
    token,
    platform,
    ...(fcmToken ? { fcmToken } : {}),
  });

  await setItem(PUSH_TOKEN_STORAGE_KEY, token);
};

const getFcmTokenBestEffort = async () => {
  const delays = [0, 500, 1000];

  for (const delay of delays) {
    if (delay > 0) await sleep(delay);

    try {
      const { token } = await FirebaseMessaging.getToken();
      if (token) return token;
    } catch {
      // ignore and retry
    }
  }

  return null;
};

/**
 * Push 관련 리스너를 "한 번만" 등록하기 위한 플래그
 */
let initialized = false;
let activeHandlers: Pick<InitPushOptions, 'onActionPerformed' | 'onReceived'> = {};

export type InitPushOptions = {
  /**
   * 푸시를 탭해서 앱이 열렸을 때 실행됩니다.
   */
  onActionPerformed?: (event: ActionPerformed) => void;

  /**
   * 앱이 실행 중(포그라운드)일 때 푸시가 도착하면 실행됩니다.
   * - iOS는 capacitor.config.ts의 presentationOptions에 따라 얼럿/배지/사운드 표시 여부가 결정됩니다.
   */
  onReceived?: (notification: PushNotificationSchema) => void;

  /**
   * 시스템 권한 팝업을 띄우기 전에, 한 번 더 사용자에게 확인할지 여부 (기본 true)
   */
  confirmBeforeRequest?: boolean;

  /**
   * 리스너만 초기화하고 이번 호출에서는 등록을 생략할지 여부
   */
  registerOnInit?: boolean;
};

/**
 * ✅ 푸시 초기화 (리스너 등록 + 권한/등록 처리)
 * - 로그인 이후(토큰이 세팅된 뒤)에 호출하는 것을 권장합니다.
 */
export async function initPushNotifications(options: InitPushOptions = {}) {
  if (!Capacitor.isNativePlatform()) return;

  activeHandlers = {
    onActionPerformed: options.onActionPerformed,
    onReceived: options.onReceived,
  };

  if (!initialized) {
    initialized = true;

    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: ANDROID_DEFAULT_CHANNEL_ID,
          name: '기본 알림',
          description: '온식구 기본 알림 채널',
          importance: 4,
          visibility: 1,
          vibration: true,
          lights: true,
        });
      } catch (e) {
        console.warn('[Push] failed to create default notification channel:', e);
      }
    }

    await FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
      console.log('[Push] FCM token received:', token);

      try {
        await syncPushToken({
          token,
          platform: Capacitor.getPlatform(),
          fcmToken: token,
        });
      } catch (e) {
        console.warn('[Push] failed to sync FCM token to server:', e);
      }
    });

    await FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('[Push] FCM notification received:', event);
      activeHandlers.onReceived?.(event.notification as unknown as PushNotificationSchema);
    });

    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('[Push] FCM notification action performed:', event);
      activeHandlers.onActionPerformed?.(event as unknown as ActionPerformed);
    });

    // 1) 토큰 등록 리스너
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[Push] registration token:', token.value);

      try {
        const platform = Capacitor.getPlatform();
        const isIOS = platform === 'ios';

        let syncToken = token.value;
        let fcmToken: string | undefined;

        if (isIOS) {
          const iosFcmToken = await getFcmTokenBestEffort();
          if (iosFcmToken) {
            syncToken = iosFcmToken;
            fcmToken = iosFcmToken;
          } else {
            console.warn('[Push] FCM token not ready yet; fallback to APNS token sync');
          }
        }

        await syncPushToken({ token: syncToken, platform, ...(fcmToken ? { fcmToken } : {}) });
      } catch (e) {
        console.warn('[Push] failed to persist token:', e);
      }
    });

    // 2) 토큰 등록 에러 리스너
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] registration error:', error);
    });

    // 3) 포그라운드 수신 리스너
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] received:', notification);
      activeHandlers.onReceived?.(notification);
    });

    // 4) 푸시 클릭/액션 리스너
    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      console.log('[Push] action performed:', event);
      activeHandlers.onActionPerformed?.(event);
    });
  }

  // ✅ 권한/등록 (필요 시)
  if (options.registerOnInit ?? true) {
    await ensurePushPermissionAndRegister(options.confirmBeforeRequest ?? true);
  }
}

/**
 * ✅ 권한 체크 → 필요하면 요청 → 등록
 * @returns permission granted 여부
 */
export async function ensurePushPermissionAndRegister(confirmBeforeRequest = true): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;

  let status = await PushNotifications.checkPermissions();

  // iOS/Android13+: receive 권한 필요
  if (status.receive !== 'granted') {
    if (confirmBeforeRequest) {
      const ok = window.confirm('온식구 알림을 허용하시겠어요?');
      if (!ok) return false;
    }

    status = await PushNotifications.requestPermissions();
  }

  if (status.receive !== 'granted') {
    console.warn('[Push] permission denied');
    return false;
  }

  await PushNotifications.register();
  console.log('[Push] register() called');

  try {
    const { token } = await FirebaseMessaging.getToken();
    if (token) {
      await syncPushToken({
        token,
        platform: Capacitor.getPlatform(),
        fcmToken: token,
      });
    }
  } catch (e) {
    console.warn('[Push] failed to get FCM token:', e);
  }

  return true;
}

/**
 * ✅ 푸시 등록 해제
 * - Android: FCM 토큰 삭제
 * - iOS: APNS unregister
 */
export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  const storedToken = await getStoredPushToken();

  try {
    await PushNotifications.unregister();
  } catch (e) {
    console.warn('[Push] unregister failed:', e);
  }

  try {
    await FirebaseMessaging.deleteToken();
  } catch (e) {
    console.warn('[Push] failed to delete FCM token:', e);
  }

  // 로컬 토큰 삭제
  await removeItem(PUSH_TOKEN_STORAGE_KEY);

  // (선택) 서버에서도 토큰 삭제 요청
  try {
    const accessToken = await getItem('accessToken');
    if (accessToken) {
      setAccessToken(accessToken);
    }

    await deletePushToken(
      storedToken
        ? {
            token: storedToken,
            platform: Capacitor.getPlatform(),
          }
        : undefined
    );
  } catch (e) {
    // 서버가 DELETE를 지원하지 않거나 엔드포인트가 다를 수 있음 → 무시
    console.warn('[Push] failed to delete token on server:', e);
  }
}

/**
 * 저장된 토큰(있으면)을 가져옵니다.
 */
export async function getStoredPushToken(): Promise<string | null> {
  return await getItem(PUSH_TOKEN_STORAGE_KEY);
}
