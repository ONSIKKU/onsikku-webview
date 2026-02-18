import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getItem, removeItem, setItem } from "@/utils/AsyncStorage";
import { refreshToken, setAccessToken } from "@/utils/api";

const getAccessTokenExp = (accessToken: string): number | null => {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(
      base64.length + (4 - (base64.length % 4)) % 4,
      "=",
    );
    const binary = atob(normalized);
    const decoded = decodeURIComponent(
      binary
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    const payloadJson = JSON.parse(decoded) as { exp?: number };
    if (typeof payloadJson.exp !== "number") return null;
    return payloadJson.exp * 1000;
  } catch {
    return null;
  }
};

const isExpiredToken = (accessToken: string) => {
  const exp = getAccessTokenExp(accessToken);
  if (exp === null) return false;
  return exp <= Date.now();
};

const clearAuthTokens = async () => {
  setAccessToken(null);
  await removeItem("accessToken");
  await removeItem("refreshToken");
};

const refreshWithFallback = async (refreshTokenValue: string) => {
  const newTokens = await refreshToken(refreshTokenValue);
  setAccessToken(newTokens.accessToken);
  await setItem("accessToken", newTokens.accessToken);
  if (newTokens.refreshToken) {
    await setItem("refreshToken", newTokens.refreshToken);
  }
};

export default function RequireAuth() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const access = await getItem("accessToken");
        const refresh = await getItem("refreshToken");

        if (!access) {
          if (!refresh) {
            await clearAuthTokens();
            setOk(false);
            return;
          }

          try {
            await refreshWithFallback(refresh);
            setOk(true);
          } catch {
            await clearAuthTokens();
            setOk(false);
          }
          return;
        }

        if (isExpiredToken(access)) {
          if (!refresh) {
            await clearAuthTokens();
            setOk(false);
            return;
          }

          try {
            await refreshWithFallback(refresh);
            setOk(true);
          } catch {
            await clearAuthTokens();
            setOk(false);
          }
          return;
        }

        setAccessToken(access);
        setOk(true);
      } catch {
        await clearAuthTokens();
        setOk(false);
      }
    })();
  }, []);

  if (ok === null) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">로딩 중...</div>;
  if (!ok) return <Navigate to="/" replace />;
  return <Outlet />;
}
