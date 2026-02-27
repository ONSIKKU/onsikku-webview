import { IoTrashOutline } from 'react-icons/io5';
import iconTodayTargetMember from '@/assets/icons/notifications/TODAY_TARGET_MEMBER.svg';
import iconTodayTargetAnnounced from '@/assets/icons/notifications/TODAY_TARGET_MEMBER_ANNOUNCED.svg';
import iconAnswerAdded from '@/assets/icons/notifications/ANSWER_ADDED.svg';
import iconAllAnswered from '@/assets/icons/notifications/ALL_ANSWERED.svg';
import iconKnockKnock from '@/assets/icons/notifications/KNOCK_KNOCK.svg';
import iconReactionAdded from '@/assets/icons/notifications/REACTION_ADDED.svg';
import iconCommentAdded from '@/assets/icons/notifications/COMMENT_ADDED.svg';
import iconMemberJoined from '@/assets/icons/notifications/MEMBER_JOINED.svg';
import iconWeeklyReport from '@/assets/icons/notifications/WEEKLY_REPORT.svg';
import iconSystemNotice from '@/assets/icons/notifications/SYSTEM_NOTICE.svg';

export interface Notification {
  id: string;
  type:
    | 'comment'
    | 'reaction'
    | 'answer'
    | 'all_answered'
    | 'new_question'
    | 'target_announced'
    | 'knock_knock'
    | 'member_joined'
    | 'weekly_report'
    | 'system_notice';
  actor: string;
  actorAvatar: string;
  message: string;
  time: string;
  isRead: boolean;
  relatedEntityId?: string;
}

const typeDetails: Record<
  Notification['type'],
  { title: string; icon: string }
> = {
  comment: { title: '새로운 댓글', icon: iconCommentAdded },
  reaction: { title: '새로운 반응', icon: iconReactionAdded },
  answer: { title: '새로운 답변', icon: iconAnswerAdded },
  all_answered: { title: '모든 답변 완료', icon: iconAllAnswered },
  new_question: { title: '새로운 질문', icon: iconTodayTargetMember },
  target_announced: { title: '오늘의 주인공 발표', icon: iconTodayTargetAnnounced },
  knock_knock: { title: '똑똑, 기다리고 있어요', icon: iconKnockKnock },
  member_joined: { title: '새 식구 합류', icon: iconMemberJoined },
  weekly_report: { title: '주간 리포트', icon: iconWeeklyReport },
  system_notice: { title: '온식구 공지', icon: iconSystemNotice },
};

export default function NotificationCard({
  item,
  onClick,
  onDelete,
}: {
  item: Notification;
  onClick: (item: Notification) => void;
  onDelete: (id: string) => void;
}) {
  const details = typeDetails[item.type];

  const borderColor = item.isRead
    ? 'border-transparent'
    : item.type === 'comment'
      ? 'border-green-300'
      : 'border-red-300';

  return (
    <div
      onClick={() => onClick(item)}
      className={`w-full p-4 rounded-2xl shadow-sm bg-white border cursor-pointer active:opacity-90 transition-all ${borderColor}`}
    >
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-row items-center flex-1">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
            <img src={details.icon} alt={details.title} className="w-5 h-5" />
          </div>
          <div className="text-base font-bold text-gray-800 ml-3">
            {details.title}
          </div>
          {!item.isRead && (
            <div className="w-2 h-2 bg-red-500 rounded-full ml-2" />
          )}
        </div>

        <button
          type="button"
          className="active:opacity-70 p-1"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <IoTrashOutline size={20} color="gray" />
        </button>
      </div>

      <div className="mt-2 ml-10">
        <div className="text-sm text-gray-500 mb-1">{item.actor}</div>
        <div className="text-base text-gray-700">{item.message}</div>
        <div className="text-sm text-gray-400 mt-1.5">{item.time}</div>
      </div>
    </div>
  );
}
