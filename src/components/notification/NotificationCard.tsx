import React from 'react';
import { IoTrashOutline } from 'react-icons/io5';

export interface Notification {
  id: string;
  type: 'comment' | 'reaction' | 'answer' | 'all_answered' | 'new_question';
  actor: string;
  actorAvatar: string;
  message: string;
  time: string;
  isRead: boolean;
}

const typeDetails: Record<
  Notification['type'],
  { title: string; icon: string }
> = {
  comment: { title: '새로운 댓글', icon: 'chatbubble-ellipses-outline' },
  reaction: { title: '새로운 반응', icon: 'heart-outline' },
  answer: { title: '새로운 답변', icon: 'pencil-outline' },
  all_answered: { title: '모든 답변 완료', icon: 'star-outline' },
  new_question: { title: '새로운 질문', icon: 'chatbox-outline' },
};

export default function NotificationCard({ item }: { item: Notification }) {
  const details = typeDetails[item.type];

  const borderColor = item.isRead
    ? 'border-transparent'
    : item.type === 'comment'
      ? 'border-green-300'
      : 'border-red-300';

  return (
    <div
      className={`w-full p-5 rounded-2xl shadow-sm bg-white border ${borderColor}`}
    >
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-row items-center flex-1">
          <span style={{ fontSize: 24 }}>{item.actorAvatar}</span>
          <div className="text-base font-bold text-gray-800 ml-3">
            {details.title}
          </div>
          {!item.isRead && (
            <div className="w-2 h-2 bg-red-500 rounded-full ml-2" />
          )}
        </div>

        {/* RN 원본도 onPress 없음(1:1 유지) */}
        <button type="button" className="active:opacity-70">
          <IoTrashOutline size={20} color="gray" />
        </button>
      </div>

      <div className="mt-3 ml-10">
        <div className="text-base text-gray-700">{item.message}</div>
        <div className="text-sm text-gray-400 mt-2">{item.time}</div>
      </div>
    </div>
  );
}
