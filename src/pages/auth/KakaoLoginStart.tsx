import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as
  | string
  | undefined;

const KAKAO_REDIRECT_URI_WEB = import.meta.env.VITE_KAKAO_REDIRECT_URI_WEB as
  | string
  | undefined;

const KAKAO_REDIRECT_URI_APP = import.meta.env.VITE_KAKAO_REDIRECT_URI_APP as
  | string
  | undefined;

export default function KakaoLoginStart() {
  useEffect(() => {
    if (!KAKAO_REST_API_KEY) {
      alert('VITE_KAKAO_REST_API_KEY 가 없습니다.');
      return;
    }

    const isNative = Capacitor.isNativePlatform();
    const redirectUri = isNative
      ? KAKAO_REDIRECT_URI_APP
      : KAKAO_REDIRECT_URI_WEB;

    if (!redirectUri) {
      alert(
        isNative
          ? 'VITE_KAKAO_REDIRECT_URI_APP 가 없습니다.'
          : 'VITE_KAKAO_REDIRECT_URI_WEB 가 없습니다.',
      );
      return;
    }

    const url =
      'https://kauth.kakao.com/oauth/authorize' +
      `?client_id=${encodeURIComponent(KAKAO_REST_API_KEY)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;

    const open = async () => {
      if (isNative) {
        await Browser.open({ url });
      } else {
        window.location.replace(url);
      }
    };

    open();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-600">카카오 로그인으로 이동 중...</p>
    </div>
  );
}
