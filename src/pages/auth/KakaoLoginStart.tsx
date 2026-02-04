import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as
  | string
  | undefined;

// ✅ 앱 전용 Redirect URI (백엔드 엔드포인트로 고정)
const KAKAO_REDIRECT_URI_APP = import.meta.env.VITE_KAKAO_REDIRECT_URI_APP as
  | string
  | undefined;

export default function KakaoLoginStart() {
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
      // ✅ 앱(ios/android): SafariViewController로 열기
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
        return;
      }

      // (선택) 웹에서 열어도 되긴 하지만, "앱 전용"이면 사실 여기 올 일 없음
      window.location.replace(url);
    };

    open();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-600">카카오 로그인으로 이동 중...</p>
    </div>
  );
}
