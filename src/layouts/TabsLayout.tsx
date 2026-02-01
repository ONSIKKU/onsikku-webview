import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  IoHome,
  IoHomeOutline,
  IoCalendar,
  IoCalendarOutline,
  IoNotifications,
  IoNotificationsOutline,
  IoPerson,
  IoPersonOutline,
} from "react-icons/io5";

export default function TabsLayout() {
  const location = useLocation();

  const tabs = [
    {
      path: "/home",
      label: "홈",
      ActiveIcon: IoHome,
      InactiveIcon: IoHomeOutline,
    },
    {
      path: "/history",
      label: "기록",
      ActiveIcon: IoCalendar,
      InactiveIcon: IoCalendarOutline,
    },
    {
      path: "/notification",
      label: "알림",
      ActiveIcon: IoNotifications,
      InactiveIcon: IoNotificationsOutline,
    },
    {
      path: "/mypage",
      label: "내정보",
      ActiveIcon: IoPerson,
      InactiveIcon: IoPersonOutline,
    },
  ];

  return (
    <div className="min-h-screen bg-onsikku-light-gray">
      {/* Content Area */}
      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="mx-auto w-full max-w-md pointer-events-auto">
          <nav className="bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-2 pb-6 pt-3">
            <div className="flex flex-row justify-around items-center">
              {tabs.map((tab) => {
                const isActive = location.pathname.startsWith(tab.path);
                const Icon = isActive ? tab.ActiveIcon : tab.InactiveIcon;

                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                        isActive
                          ? "text-onsikku-dark-orange"
                          : "text-gray-300 hover:text-gray-400"
                      }`
                    }
                  >
                    <div className="relative mb-1">
                      <Icon size={26} />
                      {tab.path === "/notification" && (
                        // Optional: Badge placeholder if needed later
                        // <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                        null
                      )}
                    </div>
                    <span className="text-[10px] font-medium font-sans">
                      {tab.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}