import React from 'react';
import { IoCopyOutline, IoRefreshOutline } from 'react-icons/io5';

export default function InviteCodeCard({
  inviteCode,
  onCopy,
  onRefresh,
}: {
  inviteCode: string;
  onCopy: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm">
      <div className="font-sans font-bold text-gray-900 text-lg mb-3">
        가족 초대 코드
      </div>

      <div className="bg-gray-50 rounded-2xl px-4 py-4 flex flex-row items-center justify-between">
        <div className="font-mono text-xl font-bold text-gray-900">
          {inviteCode || '-'}
        </div>

        <div className="flex flex-row items-center gap-3">
          <button
            type="button"
            onClick={onCopy}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center flex active:opacity-70"
          >
            <IoCopyOutline size={18} className="text-gray-700" />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center flex active:opacity-70"
          >
            <IoRefreshOutline size={18} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="font-sans text-xs text-gray-500 mt-3 leading-relaxed">
        가족에게 초대 코드를 공유해서 온식구에 초대해보세요.
      </div>
    </div>
  );
}
