import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getItem } from "@/utils/AsyncStorage";
import { setAccessToken } from "@/utils/api";

export default function RequireAuth() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getItem("accessToken");
      if (token) {
        setAccessToken(token);
        setOk(true);
      } else {
        setOk(false);
      }
    })();
  }, []);

  if (ok === null) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">로딩 중...</div>;
  if (!ok) return <Navigate to="/" replace />;
  return <Outlet />;
}
