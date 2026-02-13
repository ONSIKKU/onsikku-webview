import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
  type Token,
} from '@capacitor/push-notifications';
import { getItem, removeItem, setItem } from '@/utils/AsyncStorage';
import { deletePushToken, upsertPushToken } from '@/utils/api';

const PUSH_TOKEN_STORAGE_KEY = 'pushToken';

/**
 * Push 관련 리스너를 "한 번만" 등록하기 위한 플래그
 */
let initialized = false;

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
};

/**
 * ✅ 푸시 초기화 (리스너 등록 + 권한/등록 처리)
 * - 로그인 이후(토큰이 세팅된 뒤)에 호출하는 것을 권장합니다.
 */
export async function initPushNotifications(options: InitPushOptions = {}) {
  if (!Capacitor.isNativePlatform()) return;
  if (initialized) return;

  initialized = true;

  // 1) 토큰 등록 리스너
  await PushNotifications.addListener('registration', async (token: Token) => {
    console.log('[Push] registration token:', token.value);

    try {
      const prev = await getItem(PUSH_TOKEN_STORAGE_KEY);
      await setItem(PUSH_TOKEN_STORAGE_KEY, token.value);

      // 토큰이 바뀐 경우에만 서버로 sync
      if (prev !== token.value) {
        try {
          await upsertPushToken({
            token: token.value,
            platform: Capacitor.getPlatform(),
          });
        } catch (e) {
          // 서버 엔드포인트가 아직 없거나 네트워크 문제여도 앱이 죽지 않게
          console.warn('[Push] failed to sync token to server:', e);
        }
      }
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
    options.onReceived?.(notification);
  });

  // 4) 푸시 클릭/액션 리스너
  await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    console.log('[Push] action performed:', event);
    options.onActionPerformed?.(event);
  });

  // ✅ 권한/등록 (필요 시)
  await ensurePushPermissionAndRegister(options.confirmBeforeRequest ?? true);
}

/**
 * ✅ 권한 체크 → 필요하면 요청 → 등록
 * @returns permission granted 여부
 */
export async function ensurePushPermissionAndRegister(confirmBeforeRequest = true): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

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
  return true;
}

/**
 * ✅ 푸시 등록 해제
 * - Android: FCM 토큰 삭제
 * - iOS: APNS unregister
 */
export async function unregisterPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await PushNotifications.unregister();
  } catch (e) {
    console.warn('[Push] unregister failed:', e);
  }

  // 로컬 토큰 삭제
  await removeItem(PUSH_TOKEN_STORAGE_KEY);

  // (선택) 서버에서도 토큰 삭제 요청
  try {
    await deletePushToken();
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
