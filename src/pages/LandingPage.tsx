import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { IoLogoApple } from 'react-icons/io5';
import kakaoLogin from '@/assets/images/kakao_login_large_wide.png';
import mainLogo from '@/assets/images/onsikku-main-logo.png';
import { getItem } from '@/utils/AsyncStorage';

export default function LandingPage() {
  const navigate = useNavigate();

  const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

  const goToKakaoWebView = () => {
    navigate('/auth/kakao');
  };

  const goToAppleLogin = () => {
    navigate('/auth/apple');
  };

  useEffect(() => {
    (async () => {
      const token = await getItem('accessToken');
      if (token) navigate('/home', { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-between px-6 py-12 pb-20">
      {/* Top Spacer */}
      <div className="flex-1" />

      {/* Brand Section */}
      <div className="flex-col items-center flex gap-6 mb-12">
        <div className="relative">
          <div className="absolute -inset-4 bg-orange-100/50 rounded-full blur-xl" />
          <img
            src={mainLogo}
            className="w-32 h-32 object-contain relative z-10 drop-shadow-sm"
            alt="온식구 로고"
          />
        </div>

        <div className="text-center">
          <h1 className="font-bold text-4xl text-gray-900 mb-3 tracking-tight">온식구</h1>
          <p className="font-sans text-lg text-gray-600 leading-relaxed">
            매일 9분,
            <br />
            가족과 더 가까워지는 시간
          </p>
        </div>
      </div>

      {/* Middle Spacer */}
      <div className="flex-1" />

      {/* Action Section */}
      <div className="w-full max-w-xs flex flex-col items-center gap-4">
        <button
          className="w-full transition-transform active:scale-95 duration-200 hover:opacity-90 shadow-sm rounded-xl overflow-hidden"
          onClick={goToKakaoWebView}
          type="button"
        >
          <img src={kakaoLogin} className="w-full h-[50px] object-cover" alt="카카오 로그인" />
        </button>

        {/* ✅ iOS 네이티브에서만 애플 로그인 버튼 노출 */}
        {isIOS && (
          <button
            className="w-full transition-transform active:scale-95 duration-200 hover:opacity-95 shadow-sm rounded-xl overflow-hidden"
            onClick={goToAppleLogin}
            type="button"
          >
            <div className="w-full h-[50px] bg-black text-white flex items-center justify-center gap-2">
              <IoLogoApple size={18} />
              <span className="font-sans text-sm font-semibold">Apple로 계속하기</span>
            </div>
          </button>
        )}

        <div className="text-center">
          <p className="font-sans text-sm text-gray-400 leading-snug">
            카카오톡 계정으로 간편하게
            <br />
            가족과의 소중한 시간을 시작해보세요
          </p>
        </div>
      </div>
    </div>
  );
}
