import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setItem } from "@/utils/AsyncStorage";
import { setAccessToken } from "@/utils/api";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || "https://api.onsikku.xyz";

export default function KakaoLoginCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const [loading, setLoading] = useState(true);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    (async () => {
      try {
        if (!code || typeof code !== "string") {
          throw new Error("인가 코드가 없습니다.");
        }

        const res = await fetch(`${API_BASE}/api/auth/kakao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`로그인 실패(${res.status}) ${txt}`);
        }

        // { code, message, result: { accessToken, registrationToken, registered } }
        const json = await res.json();
        const result = json?.result ?? json; // 혹시 래핑 안 된 경우 대비
        const { accessToken, registered } = result;

        if (accessToken) {
          console.log("🔓 Kakao Access Token:", accessToken);
          await setItem("accessToken", accessToken);
          setAccessToken(accessToken); // 메모리상 토큰 즉시 업데이트
        }

        // 4) 라우팅 분기
        if (registered) {
          navigate("/home", { replace: true });
        } else {
          navigate("/signup/role", { replace: true });
        }
      } catch (e: any) {
        console.error("Kakao Login Error:", e);
        alert(e?.message || "로그인 처리 중 오류가 발생했습니다.");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [code, navigate]);

  return (
    <div className="flex-1 min-h-screen flex flex-col items-center justify-center">
      {loading ? (
        <>
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"
            aria-label="loading"
          />
          <p className="mt-4">카카오 로그인 처리 중...</p>
        </>
      ) : null}
    </div>
  );
}
