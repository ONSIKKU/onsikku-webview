import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import kakaoLogin from "@/assets/images/kakao_login_large_wide.png";
import mainLogo from "@/assets/images/onsikku-main-logo.png";
import { getItem } from "@/utils/AsyncStorage";

export default function LandingPage() {
  const navigate = useNavigate();

  const goToKakaoWebView = () => {
    // RN: router.push("/KakaoLoginWebView");
    // Web: 카카오 로그인 시작 라우트로 이동
    navigate("/auth/kakao");
  };

  // RN에는 없지만, "이미 로그인 상태면 홈으로" 흐름을 맞추기 위해 유지
  useEffect(() => {
    (async () => {
      const token = await getItem("accessToken");
      if (token) navigate("/home", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="flex-1">
      <div className="min-h-screen overflow-y-auto">
        <div className="min-h-screen flex flex-col justify-center items-center gap-4">
          <div className="px-2 flex flex-row gap-1 items-center justify-between">
            <img src={mainLogo} className="w-24 h-24 object-contain" alt="main logo" />
            <span className="font-bold text-6xl">온식구</span>
          </div>

          <p className="font-sans text-center text-xl text-gray-700">
            매일 5분,<br />
            가족과 더 가까워지는 시간
          </p>

          <button className="w-full px-4" onClick={goToKakaoWebView} type="button">
            <img
              src={kakaoLogin}
              className="w-full h-14 object-contain"
              alt="kakao login"
            />
          </button>

          <p className="font-sans text-center text-xl text-gray-700">
            카카오톡 계정으로 간편하게 <br />
            가족과의 소중한 시간을 시작해보세요
          </p>
        </div>
      </div>
    </div>
  );
}
