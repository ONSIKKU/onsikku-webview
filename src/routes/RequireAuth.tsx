import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      setOk(true);
    })();
  }, []);

  if (ok === null) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">로딩 중...</div>;
  if (!ok) return <Navigate to="/" replace />;
  return <Outlet />;
}
