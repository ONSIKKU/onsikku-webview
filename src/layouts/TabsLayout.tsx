import { NavLink, Outlet } from "react-router-dom";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  "flex-1 py-3 text-center text-sm font-semibold " +
  (isActive ? "text-onsikku-dark-orange" : "text-gray-500");

export default function TabsLayout() {
  return (
    <div className="min-h-screen bg-onsikku-light-gray">
      <main className="mx-auto w-full max-w-md px-4 pb-20 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-md">
          <NavLink to="/home" className={tabClass}>홈</NavLink>
          <NavLink to="/history" className={tabClass}>기록</NavLink>
          <NavLink to="/notification" className={tabClass}>알림</NavLink>
          <NavLink to="/mypage" className={tabClass}>내정보</NavLink>
        </div>
      </nav>
    </div>
  );
}
