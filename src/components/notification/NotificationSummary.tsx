import { IoNotificationsOutline } from 'react-icons/io5';

export default function NotificationSummary() {
  return (
    <div className="bg-white w-full p-6 rounded-2xl shadow-sm">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center">
          <IoNotificationsOutline size={24} color="#F97315" />
          <div className="text-lg font-bold text-gray-800 ml-2">알림</div>
          <div className="bg-red-500 rounded-full w-5 h-5 justify-center items-center ml-1 flex">
            <div className="text-white text-xs font-bold">2</div>
          </div>
        </div>

        {/* RN 원본도 onPress 없음(1:1 유지) */}
        <button type="button">
          <div className="text-sm text-orange-500">✓ 모두 읽음</div>
        </button>
      </div>

      <div className="text-sm text-gray-500 mt-2">총 5개의 알림이 있어요</div>
    </div>
  );
}
