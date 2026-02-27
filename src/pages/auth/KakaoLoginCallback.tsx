import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setItem } from "@/utils/AsyncStorage";
import { apiFetch, setAccessToken, type AuthResponse } from "@/utils/api";
import Skeleton from "@/components/Skeleton";

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

        const redirectRes = await fetch(
          `${API_BASE}/api/auth/kakao/redirect?code=${encodeURIComponent(code)}`,
          {
            method: "GET",
            redirect: "manual",
          },
        );

        let ticket: string | null = null;

        if (redirectRes.status >= 300 && redirectRes.status < 400) {
          const location = redirectRes.headers.get("location");
          if (location) {
            try {
              ticket = new URL(location, API_BASE).searchParams.get("ticket");
            } catch {
              ticket = null;
            }
          }
        } else if (redirectRes.status === 200 || redirectRes.status === 204) {
          const redirectText = await redirectRes.text().catch(() => "");
          if (redirectText) {
            try {
              const parsed = JSON.parse(redirectText);
              const payload = parsed?.result ?? parsed;
              ticket = payload?.ticket ?? null;
            } catch {
              // ignore
            }
          }
        }

        if (!ticket) {
          throw new Error("카카오 티켓을 발급받지 못했습니다.");
        }

        const payload = (await apiFetch<AuthResponse>(
          `/api/auth/exchange?ticket=${encodeURIComponent(ticket)}`,
          {
            method: "GET",
          },
        )) as AuthResponse;

        const { accessToken, refreshToken, registrationToken } = payload;
        const isRegistered =
          payload.isRegistered ??
          (payload as { registered?: boolean }).registered ??
          false;

        if (accessToken) {
          console.log("🔓 Kakao Access Token:", accessToken);
          await setItem("accessToken", accessToken);
          setAccessToken(accessToken);
        }

        if (refreshToken) {
          await setItem("refreshToken", refreshToken);
        }

        if (registrationToken) {
          await setItem("registrationToken", registrationToken);
        }

        if (!accessToken && !registrationToken) {
          throw new Error("토큰을 받지 못했습니다.");
        }

        if (isRegistered) {
          navigate("/home", { replace: true });
        } else {
          navigate("/signup/agree", { replace: true });
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
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="w-40 h-4 mt-4" />
        </>
      ) : null}
    </div>
  );
}
