import { useEffect } from 'react';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY as
  | string
  | undefined;
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI as
  | string
  | undefined;

export default function KakaoLoginStart() {
  useEffect(() => {
    if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
      alert(
        'Kakao env가 설정되지 않았습니다. VITE_KAKAO_REST_API_KEY / VITE_KAKAO_REDIRECT_URI 를 확인하세요.',
      );
      return;
    }
    const url =
      'https://kauth.kakao.com/oauth/authorize' +
      `?client_id=${encodeURIComponent(KAKAO_REST_API_KEY)}` +
      `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
      `&response_type=code`;
    console.log(url);
    window.location.replace(url);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-600">카카오 로그인으로 이동 중...</p>
    </div>
  );
}
