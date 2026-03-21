import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { InAppBrowser } from '@capacitor/inappbrowser';
import { RiKakaoTalkFill } from 'react-icons/ri';
import AuthRedirectStatusCard from '@/components/AuthRedirectStatusCard';
import { openSystemBrowser } from '@/utils/systemBrowser';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as
  | string
  | undefined;

// ✅ 앱 전용 Redirect URI (백엔드 엔드포인트로 고정)
const KAKAO_REDIRECT_URI_APP = import.meta.env.VITE_KAKAO_REDIRECT_URI_APP as
  | string
  | undefined;
console.log(KAKAO_REDIRECT_URI_APP);

export default function KakaoLoginStart() {
  const [browserClosed, setBrowserClosed] = useState(false);

  useEffect(() => {
    if (!KAKAO_REST_API_KEY) {
      alert('VITE_KAKAO_REST_API_KEY 가 없습니다.');
      return;
    }
    if (!KAKAO_REDIRECT_URI_APP) {
      alert('VITE_KAKAO_REDIRECT_URI_APP 가 없습니다.');
      return;
    }

    const url =
      'https://kauth.kakao.com/oauth/authorize' +
      `?client_id=${encodeURIComponent(KAKAO_REST_API_KEY)}` +
      `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI_APP)}` +
      `&response_type=code`;

    const open = async () => {
      setBrowserClosed(false);

      // ✅ 앱(ios/android): SafariViewController로 열기
      if (Capacitor.isNativePlatform()) {
        await openSystemBrowser(url);
        return;
      }

      // (선택) 웹에서 열어도 되긴 하지만, "앱 전용"이면 사실 여기 올 일 없음
      window.location.replace(url);
    };

    let isMounted = true;
    let browserClosedHandle: { remove: () => Promise<void> } | null = null;

    const init = async () => {
      if (Capacitor.isNativePlatform()) {
        browserClosedHandle = await InAppBrowser.addListener(
          'browserClosed',
          () => {
            if (isMounted) setBrowserClosed(true);
          },
        );
      }

      await open();
    };

    init();

    return () => {
      isMounted = false;
      browserClosedHandle?.remove();
    };
  }, []);

  return (
    <AuthRedirectStatusCard
      icon={<RiKakaoTalkFill size={30} className="text-[#3A1D1D]" />}
      idleTitle="카카오 로그인 진행 중"
      idleDescription={'카카오 인증 화면으로 안전하게 연결하고 있어요.\n잠시만 기다려주세요.'}
      cancelledTitle="카카오 로그인이 취소되었어요"
      cancelledDescription={
        '로그인 창을 닫아 이전 단계로 돌아왔어요.\n다시 시도하거나 첫 화면으로 돌아갈 수 있어요.'
      }
      retryLabel="카카오 로그인 다시 시도"
      isCancelled={browserClosed}
      onRetry={() => window.location.reload()}
    />
  );
}
