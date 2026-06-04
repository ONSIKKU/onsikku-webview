import { IoChevronForwardOutline } from "react-icons/io5";
import iconTodayTargetMember from "@/assets/icons/notifications/TODAY_TARGET_MEMBER.png";
import iconTodayTargetAnnounced from "@/assets/icons/notifications/TODAY_TARGET_MEMBER_ANNOUNCED.png";
import iconAnswerAdded from "@/assets/icons/notifications/ANSWER_ADDED.png";
import iconAllAnswered from "@/assets/icons/notifications/ALL_ANSWERED.png";
import iconKnockKnock from "@/assets/icons/notifications/KNOCK_KNOCK.png";
import iconReactionAdded from "@/assets/icons/notifications/REACTION_ADDED.png";
import iconCommentAdded from "@/assets/icons/notifications/COMMENT_ADDED.png";
import iconMemberJoined from "@/assets/icons/notifications/MEMBER_JOINED.png";
import iconWeeklyReport from "@/assets/icons/notifications/WEEKLY_REPORT.png";
import iconSystemNotice from "@/assets/icons/notifications/SYSTEM_NOTICE.png";

export interface Notification {
  id: string;
  type:
    | "comment"
    | "reaction"
    | "answer"
    | "all_answered"
    | "new_question"
    | "target_announced"
    | "knock_knock"
    | "member_joined"
    | "weekly_report"
    | "system_notice";
  title?: string;
  body?: string;
  time: string;
  publishedAt: string;
  isRead: boolean;
  relatedEntityId?: string;
}

const typeDetails: Record<
  Notification["type"],
  { icon: string; tone: string }
> = {
  comment: { icon: iconCommentAdded, tone: "bg-emerald-50" },
  reaction: { icon: iconReactionAdded, tone: "bg-rose-50" },
  answer: { icon: iconAnswerAdded, tone: "bg-sky-50" },
  all_answered: { icon: iconAllAnswered, tone: "bg-violet-50" },
  new_question: { icon: iconTodayTargetMember, tone: "bg-orange-50" },
  target_announced: { icon: iconTodayTargetAnnounced, tone: "bg-orange-50" },
  knock_knock: { icon: iconKnockKnock, tone: "bg-amber-50" },
  member_joined: { icon: iconMemberJoined, tone: "bg-lime-50" },
  weekly_report: { icon: iconWeeklyReport, tone: "bg-indigo-50" },
  system_notice: { icon: iconSystemNotice, tone: "bg-gray-100" },
};

export default function NotificationCard({
  item,
  onClick,
}: {
  item: Notification;
  onClick: (item: Notification) => void;
}) {
  const details = typeDetails[item.type];
  const displayTitle = item.title?.trim() || "알림 제목을 불러오지 못했습니다.";
  const displayBody = item.body?.trim() || "알림 내용을 불러오지 못했습니다.";

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`w-full rounded-[18px] bg-white px-4 py-3.5 text-left shadow-sm ring-1 transition duration-150 active:scale-[0.99] active:bg-orange-50/50 ${
        item.isRead ? "ring-gray-100" : "ring-orange-100 bg-orange-50/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${details.tone}`}
        >
          <img
            src={details.icon}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {!item.isRead && (
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-onsikku-dark-orange" />
            )}
            <div className="min-w-0 flex-1">
              <div
                className={`text-[15px] leading-5 ${
                  item.isRead
                    ? "font-semibold text-gray-800"
                    : "font-bold text-gray-950"
                }`}
              >
                {displayTitle}
              </div>
              <p className="mt-0.5 text-sm leading-5 text-gray-600">
                {displayBody}
              </p>
            </div>
            <span className="mt-0.5 shrink-0 text-xs font-medium text-gray-400">
              {item.time}
            </span>
          </div>
        </div>
        <IoChevronForwardOutline
          className="shrink-0 text-gray-300"
          size={16}
        />
      </div>
    </button>
  );
}
