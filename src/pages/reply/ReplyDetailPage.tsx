import {
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { IoRefreshOutline } from 'react-icons/io5';
import type { Answer, Comment } from '@/utils/api';
import {
  addReaction,
  blockUser,
  createComment,
  deleteReaction,
  deleteComment,
  getBlockedMembers,
  getMyPage,
  getQuestionInstanceDetails,
  reportContent,
  setAccessToken,
  updateAnswer,
  updateComment,
  unblockUser,
  type ReportReason,
  type ReportTargetType,
} from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { formatDateYMDKo, formatTimeAgoKo } from '@/utils/dates';
import { getRoleIconAndText } from '@/utils/labels';
import RoleIcon from '@/components/RoleIcon';
import Skeleton from '@/components/Skeleton';
import { useModalStore } from '@/features/modal/modalStore';

function ArrowBackIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon({
  size = 16,
  color = '#9CA3AF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 20h9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon({
  size = 16,
  color = '#EF4444',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 6V4h8v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 6l-1 14H6L5 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReplyTurnIcon({
  size = 16,
  color = '#9CA3AF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 6v7a5 5 0 0 0 5 5h9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m15 14 4 4-4 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseCircleIcon({
  size = 18,
  color = '#9CA3AF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 19V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M5 12l7-7 7 7"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreVerticalIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.8" fill={color} />
      <circle cx="12" cy="12" r="1.8" fill={color} />
      <circle cx="12" cy="19" r="1.8" fill={color} />
    </svg>
  );
}

function ReportIcon({
  size = 14,
  color = '#6B7280',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 3v18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 5h9l-1.5 3L16 11H7V5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BlockIcon({
  size = 14,
  color = '#DC2626',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      <path d="M8.5 15.5l7-7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const formatTimeAgo = (dateString: string) => formatTimeAgoKo(dateString);

const formatDateSimple = (dateString: string) => formatDateYMDKo(dateString);

const getContentText = (content: any): string => {
  if (typeof content === 'string') return content;
  if (content?.text) return content.text;
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
};

const REPORT_REASON_OPTIONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'SPAM', label: '스팸 및 홍보성 콘텐츠' },
  { value: 'INAPPROPRIATE_CONTENT', label: '부적절한 콘텐츠 (음란물 등)' },
  { value: 'ABUSIVE_LANGUAGE', label: '욕설 및 비방, 혐오 표현' },
  { value: 'PRIVACY_VIOLATION', label: '개인정보 노출' },
  { value: 'OTHER', label: '기타' },
];

type ReactionKind = 'LIKE' | 'ANGRY' | 'SAD' | 'FUNNY';

const ReactionIcon = ({
  kind,
  active,
}: {
  kind: ReactionKind;
  active: boolean;
}) => {
  const uid = useId();

  if (kind === 'LIKE') {
    const gradientId = `${uid}-orangeGrad`;
    return (
      <svg width="18" height="18" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: active ? 1 : 0.9 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB75E" />
            <stop offset="100%" stopColor="#FF8A4C" />
          </linearGradient>
        </defs>
        <path d="M32 55 C32 55 8 38 8 22 A13 13 0 0 1 32 15 A13 13 0 0 1 56 22 C56 38 32 55 32 55 Z" fill={`url(#${gradientId})`} />
      </svg>
    );
  }

  if (kind === 'FUNNY') {
    const gradientId = `${uid}-orangeGrad2`;
    return (
      <svg width="18" height="18" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: active ? 1 : 0.9 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC074" />
            <stop offset="100%" stopColor="#FF8A4C" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill={`url(#${gradientId})`} />
        <path d="M20 26 Q23 20 26 26" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M38 26 Q41 20 44 26" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M20 36 Q32 52 44 36 Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (kind === 'SAD') {
    const gradientId = `${uid}-grayGrad`;
    return (
      <svg width="18" height="18" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: active ? 1 : 0.9 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D9D9D9" />
            <stop offset="100%" stopColor="#A6A6A6" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill={`url(#${gradientId})`} />
        <circle cx="23" cy="26" r="3" fill="#666666" />
        <circle cx="41" cy="26" r="3" fill="#666666" />
        <path d="M23 42 Q32 36 41 42" stroke="#666666" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M46 34 C46 34 50 42 46 46 C42 42 46 34 46 34 Z" fill="#E6E6E6" />
      </svg>
    );
  }

  const gradientId = `${uid}-darkOrangeGrad`;
  return (
    <svg width="18" height="18" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: active ? 1 : 0.9 }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9B74" />
          <stop offset="100%" stopColor="#E85D34" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill={`url(#${gradientId})`} />
      <path d="M16 22 L26 28" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 22 L38 28" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="32" r="3" fill="#FFFFFF" />
      <circle cx="41" cy="32" r="3" fill="#FFFFFF" />
      <path d="M24 44 L40 44" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

type ReactionEvent =
  | MouseEvent<HTMLButtonElement>
  | TouchEvent<HTMLButtonElement>
  | PointerEvent<HTMLButtonElement>;

const menuItemBaseClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm active:bg-gray-50';
const menuItemNeutralClass = `${menuItemBaseClass} text-gray-700`;
const menuItemDangerClass = `${menuItemBaseClass} text-red-600 active:bg-red-50`;

const ReactionButton = ({
  kind,
  count,
  isActive,
  onPress,
  disabled,
}: {
  kind: ReactionKind;
  count: number;
  isActive: boolean;
  onPress: () => void;
  disabled: boolean;
}) => {
  const handlePress = (event: ReactionEvent) => {
    event.preventDefault();
    if (!disabled) {
      onPress();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      onTouchEnd={handlePress}
      onPointerUp={handlePress}
      style={{ pointerEvents: 'auto' }}
      disabled={disabled}
      className={`flex min-w-[68px] items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'active:scale-[0.97] active:opacity-95'
      } ${
        isActive
          ? 'border-orange-200 bg-orange-50/95 text-orange-600 shadow-[0_6px_14px_rgba(251,146,60,0.18)] -translate-y-[1px]'
          : 'border-gray-100 bg-gray-50/80 text-gray-500'
      }`}
    >
      <span
        className={`text-base transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive ? 'scale-110 -translate-y-[0.5px]' : 'scale-100'
        }`}
      >
        <ReactionIcon kind={kind} active={isActive} />
      </span>
      <span
        className={`font-sans text-sm font-medium transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isActive ? 'text-orange-600' : 'text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
};

const FeedCard = ({
  answer,
  isMyAnswer,
  onEdit,
  onReaction,
  onReport,
  onBlock,
  blockLabel,
  disableReaction,
  canReport,
  canBlock,
}: {
  answer: Answer;
  isMyAnswer: boolean;
  onEdit: () => void;
  onReaction: (type: ReactionKind) => void;
  onReport: () => void;
  onBlock: () => void;
  blockLabel: string;
  disableReaction: boolean;
  canReport: boolean;
  canBlock: boolean;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const role = answer.familyRole || answer.member?.familyRole;
  const gender = answer.gender || answer.member?.gender;

  const { icon: roleIcon, text: roleText } = getRoleIconAndText(role, gender);

  const reactions = [
    { type: 'LIKE' as const, count: answer.likeReactionCount },
    { type: 'FUNNY' as const, count: answer.funnyReactionCount },
    { type: 'SAD' as const, count: answer.sadReactionCount },
    { type: 'ANGRY' as const, count: answer.angryReactionCount },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
      {/* Header */}
      <div className="flex-row justify-between items-center mb-3 flex">
        <div className="flex-row items-center gap-3 flex">
          <div className="w-11 h-11 rounded-full items-center justify-center flex overflow-hidden">
            <RoleIcon icon={roleIcon} size={44} />
          </div>
          <div>
            <div className="font-sans font-bold text-gray-900 text-base">
              {roleText}
            </div>
            <div className="font-sans text-sm text-gray-400">
              {formatTimeAgo(answer.createdAt)}
            </div>
          </div>
        </div>

        {(isMyAnswer || canReport || canBlock) && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="p-2 active:opacity-70"
              aria-label="answer actions"
            >
              <MoreVerticalIcon size={18} color="#9CA3AF" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-10 min-w-[110px] rounded-xl border border-gray-100 bg-white p-1.5 shadow-md">
                {isMyAnswer && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit();
                    }}
                    className={menuItemNeutralClass}
                    aria-label="edit answer"
                  >
                    <PencilIcon size={14} color="#6B7280" />
                    수정
                  </button>
                )}
                {canReport && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onReport();
                    }}
                    className={menuItemNeutralClass}
                    aria-label="report answer"
                  >
                    <ReportIcon size={14} color="#6B7280" />
                    신고
                  </button>
                )}
                {canBlock && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onBlock();
                    }}
                    className={menuItemDangerClass}
                    aria-label="block user"
                  >
                    <BlockIcon size={14} color="#DC2626" />
                    {blockLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="font-sans text-gray-800 text-base leading-relaxed mb-4 whitespace-pre-wrap">
        {getContentText(answer.content)}
      </div>

      {/* Reactions */}
      <div className="flex flex-row flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
        {reactions.map((reaction) => (
          <ReactionButton
            key={reaction.type}
            kind={reaction.type}
            count={reaction.count || 0}
            isActive={answer.myReaction === reaction.type}
            disabled={disableReaction}
            onPress={() => onReaction(reaction.type)}
          />
        ))}
      </div>
    </div>
  );
};

const CommentCard = ({
  comment,
  isMyComment,
  isReply,
  onEdit,
  onDelete,
  onReply,
  onReport,
  onBlock,
  blockLabel,
  canReport,
  canBlock,
}: {
  comment: Comment;
  isMyComment: boolean;
  isReply: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  onReport: () => void;
  onBlock: () => void;
  blockLabel: string;
  canReport: boolean;
  canBlock: boolean;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const role = comment.member?.familyRole ?? comment.familyRole;
  const gender = comment.member?.gender ?? comment.gender;
  const { icon: roleIcon, text: roleText } = getRoleIconAndText(role, gender);

  return (
    <div className={`${isReply ? 'ml-8' : ''}`}>
      <div
        className={`relative flex-row items-start px-4 py-3 ${isReply ? 'bg-gray-50/50' : 'bg-white'} flex`}
      >
        {isReply && (
          <div className="absolute left-3 top-3.5">
            <ReplyTurnIcon size={16} color="#9CA3AF" />
          </div>
        )}

        <div className={`flex-1 ${isReply ? 'pl-6' : 'ml-0'}`}>
          <div className="flex-row justify-between items-start mb-2 flex">
            <div className="flex-row items-center gap-2 flex">
              <div className="w-8 h-8 rounded-full items-center justify-center flex overflow-hidden">
                <RoleIcon icon={roleIcon} size={32} />
              </div>
              <div>
                <div className="font-sans font-bold text-gray-900 text-sm">
                  {roleText}
                </div>
                <div className="font-sans text-sm text-gray-400">
                  {formatTimeAgo(comment.createdAt)}
                </div>
              </div>
            </div>

            {(isMyComment || canReport || canBlock) && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-2 active:opacity-70"
                  aria-label="comment actions"
                >
                  <MoreVerticalIcon size={18} color="#9CA3AF" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 z-10 min-w-[110px] rounded-xl border border-gray-100 bg-white p-1.5 shadow-md">
                    {canReport && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onReport();
                        }}
                        className={menuItemNeutralClass}
                        aria-label="report comment"
                      >
                        <ReportIcon size={14} color="#6B7280" />
                        신고
                      </button>
                    )}
                    {canBlock && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onBlock();
                        }}
                        className={menuItemDangerClass}
                        aria-label="block user"
                      >
                        <BlockIcon size={14} color="#DC2626" />
                        {blockLabel}
                      </button>
                    )}
                    {isMyComment && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onEdit();
                        }}
                        className={menuItemNeutralClass}
                        aria-label="edit comment"
                      >
                        <PencilIcon size={14} color="#6B7280" />
                        수정
                      </button>
                    )}
                    {isMyComment && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
                        className={menuItemDangerClass}
                        aria-label="delete comment"
                      >
                        <TrashIcon size={14} color="#DC2626" />
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="font-sans text-base text-gray-900 leading-relaxed mb-2 whitespace-pre-wrap">
            {comment.content}
          </div>

          {!isReply && (
            <button
              type="button"
              onClick={onReply}
              className="active:opacity-70"
            >
              <span className="font-sans text-sm font-medium text-gray-500">
                답글 달기
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReplyDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModalStore();
  const isIOS = Capacitor.getPlatform() === 'ios';

  const swipeBackRef = useRef({
    tracking: false,
    startX: 0,
    startY: 0,
    triggered: false,
  });

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const questionInstanceId = query.get('questionInstanceId') || '';
  const question = query.get('question') || '질문 정보가 없습니다.';

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [questionContent, setQuestionContent] = useState<string>('');

  const [questionSentAt, setQuestionSentAt] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [blockedMemberIds, setBlockedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [reactionLoadingIds, setReactionLoadingIds] = useState<Set<string>>(
    new Set(),
  );

  const [pendingReport, setPendingReport] = useState<{
    id: string;
    type: ReportTargetType;
    name: string;
  } | null>(null);
  const [selectedReportReason, setSelectedReportReason] =
    useState<ReportReason>('OTHER');

  // Edit Answer
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
  const [editText, setEditText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit Comment
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showEditCommentModal, setShowEditCommentModal] = useState(false);

  // New Comment
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(
    null,
  );
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const rootCommentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentsTopRef = useRef<HTMLDivElement | null>(null);
  const commentsBottomRef = useRef<HTMLDivElement | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const COMMENT_INPUT_MAX_HEIGHT = 96;

  const [startY, setStartY] = useState(0);
  const [startX, setStartX] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const PULL_MAX = 104;
  const PULL_TRIGGER = 58;
  const PULL_SNAP = 52;

  const fetchData = async (showLoading = true) => {
    if (!questionInstanceId) {
      setError('질문 정보가 없습니다.');
      if (showLoading) setLoading(false);
      return;
    }
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      try {
        const myPage = await getMyPage();
        setCurrentUserId(myPage.member?.id || null);
      } catch (e) {
        console.error('[사용자 정보 조회 에러]', e);
      }

      const questionData = await getQuestionInstanceDetails(questionInstanceId);

      const content = questionData.questionDetails?.questionContent || question;
      setQuestionContent(content);

      const assignments =
        questionData.questionDetails?.questionAssignments || [];

      if (assignments.length > 0 && (assignments as any)[0]?.sentAt) {
        setQuestionSentAt((assignments as any)[0].sentAt);
      } else {
        setQuestionSentAt(null);
      }

      const answerList = questionData.questionDetails?.answers || [];
      const convertedAnswers: Answer[] = answerList.map((ans: any) => ({
        ...ans,
        id: ans.answerId,
      }));
      setAnswers(convertedAnswers);

      const commentList = questionData.questionDetails?.comments || [];
      setComments(commentList as Comment[]);

      try {
        const blockedList = await getBlockedMembers();
        setBlockedMemberIds(new Set(blockedList.map((item) => item.blockedId)));
      } catch (error) {
        console.warn('[차단 목록 조회 에러]', error);
      }
    } catch (e: any) {
      console.error('[답변 조회 에러]', e);
      setError(e?.message || '답변을 불러오는데 실패했습니다.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionInstanceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isIOS) {
      const listeners: Array<{ remove: () => Promise<void> }> = [];
      let disposed = false;

      const setupIOSKeyboard = async () => {
        try {
          await Keyboard.setResizeMode({ mode: KeyboardResize.None });
        } catch (error) {
          console.warn('[Keyboard] iOS resize mode 설정 실패', error);
        }

        const showListener = await Keyboard.addListener(
          'keyboardWillShow',
          (info) => {
            if (disposed) return;
            setKeyboardInset(Math.max(0, info.keyboardHeight));
          },
        );

        const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          if (disposed) return;
          setKeyboardInset(0);
        });

        listeners.push(showListener, hideListener);
      };

      setupIOSKeyboard();

      return () => {
        disposed = true;
        listeners.forEach((listener) => {
          void listener.remove();
        });
      };
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardInset = () => {
      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardInset(inset);
    };

    updateKeyboardInset();
    viewport.addEventListener('resize', updateKeyboardInset);
    viewport.addEventListener('scroll', updateKeyboardInset);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset);
      viewport.removeEventListener('scroll', updateKeyboardInset);
    };
  }, []);

  useEffect(() => {
    const input = commentInputRef.current;
    if (!input) return;

    input.style.height = '0px';
    const nextHeight = Math.min(input.scrollHeight, COMMENT_INPUT_MAX_HEIGHT);
    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > COMMENT_INPUT_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [newCommentText]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPullY(PULL_SNAP);
    const startedAt = Date.now();

    try {
      await fetchData(false);
    } finally {
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, 420 - elapsed);
      if (remain > 0) {
        await new Promise((resolve) => setTimeout(resolve, remain));
      }
      setRefreshing(false);
      setPullY(0);
      setStartY(0);
      setStartX(0);
      setIsPulling(false);
    }
  };

  const scrollToCommentsBottom = () => {
    const run = () => {
      commentsBottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    };

    run();
    setTimeout(run, 160);
  };

  const scrollToCommentAnchor = (commentId: string) => {
    const COMMENT_TOP_OFFSET = 92;

    const run = () => {
      const target = rootCommentRefs.current[commentId];
      if (!target) return;

      const absoluteTop =
        window.scrollY + target.getBoundingClientRect().top - COMMENT_TOP_OFFSET;

      window.scrollTo({
        top: Math.max(0, absoluteTop),
        behavior: 'smooth',
      });
    };

    run();
    setTimeout(run, 140);
  };

  const handleEditAnswer = (answer: Answer) => {
    setEditingAnswer(answer);
    setEditText(getContentText(answer.content));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAnswer || !editText.trim()) {
      openModal({ content: '답변 내용을 입력해주세요.' });
      return;
    }

    // questionInstanceId is the memberQuestionId for this page context
    if (!questionInstanceId) {
      openModal({ content: '질문 정보를 찾을 수 없습니다.' });
      return;
    }

    try {
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      await updateAnswer({
        answerId: editingAnswer.answerId,
        questionAssignmentId: questionInstanceId,
        answerType: 'TEXT',
        content: editText.trim(),
      });

      await fetchData();
      setShowEditModal(false);
      setEditingAnswer(null);
      setEditText('');
      openModal({ content: '답변이 수정되었습니다.' });
    } catch (e: any) {
      console.error('[답변 수정 에러]', e);
      openModal({ content: e?.message || '답변 수정에 실패했습니다.' });
    }
  };

  const handleReaction = async (
    answer: Answer,
    reactionType: ReactionKind,
  ) => {
    const answerId = answer.answerId;
    try {
      if (!answerId) {
        openModal({ content: '반응을 처리할 답변 정보를 찾지 못했습니다.' });
        return;
      }
      if (reactionLoadingIds.has(answerId)) {
        return;
      }

      setReactionLoadingIds((prev) => {
        const next = new Set(prev);
        next.add(answerId);
        return next;
      });

      const currentFromState =
        answers.find((item) => item.answerId === answerId)?.myReaction || answer.myReaction;
      const optimisticReaction: ReactionKind | undefined =
        currentFromState === reactionType ? undefined : reactionType;

      setAnswers((prev) =>
        prev.map((item) =>
          item.answerId === answerId
            ? { ...item, myReaction: optimisticReaction }
            : item,
        ),
      );

      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      if (currentFromState) {
        await deleteReaction({ answerId });

        if (currentFromState !== reactionType) {
          await addReaction({ answerId, reactionType });
        }
      } else {
        await addReaction({ answerId, reactionType });
      }

      const questionData = await getQuestionInstanceDetails(questionInstanceId);
      const answerList = questionData.questionDetails?.answers || [];
      const convertedAnswers: Answer[] = answerList.map((ans: any) => ({
        ...ans,
        id: ans.answerId,
      }));
      setAnswers(convertedAnswers);
    } catch (e: any) {
      setAnswers((prev) =>
        prev.map((item) =>
          item.answerId === answer.answerId
            ? {
                ...item,
                myReaction: answer.myReaction,
              }
            : item,
        ),
      );
      console.error('[반응 추가 에러]', e);
      openModal({ content: e?.message || '반응을 남기지 못했습니다.' });
    } finally {
      setReactionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(answer.answerId);
        return next;
      });
    }
  };

  const getDisplayName = (memberRole?: string, gender?: string) =>
    getRoleIconAndText(memberRole as any, gender as any).text;

  const getBlockedLabel = (memberId: string | undefined) => {
    if (!memberId) return '차단';
    return blockedMemberIds.has(memberId) ? '차단 해제' : '차단';
  };

  const handleOpenReport = ({
    id,
    type,
    name,
  }: {
    id: string;
    type: ReportTargetType;
    name: string;
  }) => {
    setPendingReport({ id, type, name });
    setSelectedReportReason('OTHER');
  };

  const handleSubmitReport = async () => {
    if (!pendingReport) return;

    try {
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      await reportContent({
        targetId: pendingReport.id,
        targetType: pendingReport.type,
        reason: selectedReportReason,
      });

      openModal({ content: '신고가 접수되었습니다.' });
      setPendingReport(null);
    } catch (e: any) {
      console.error('[신고 에러]', e);
      openModal({ content: e?.message || '신고 처리에 실패했습니다.' });
    }
  };

  const handleCloseReport = () => {
    setPendingReport(null);
  };

  const handleToggleBlock = async (memberId: string, label: string) => {
    const isBlocked = blockedMemberIds.has(memberId);
    openModal({
      type: 'confirm',
      title: isBlocked ? '차단 해제' : '차단',
      content: isBlocked
        ? `${label} 님의 차단을 해제할까요?`
        : `${label} 님을 차단하면 이 사용자의 글이 안 보일 수 있어요.`,
      onConfirm: async () => {
        try {
          const token = await getItem('accessToken');
          if (token) setAccessToken(token);

          if (isBlocked) {
            await unblockUser({ blockedId: memberId });
            setBlockedMemberIds((prev) => {
              const next = new Set(prev);
              next.delete(memberId);
              return next;
            });
            openModal({ content: '차단을 해제했습니다.' });
          } else {
            await blockUser({ blockedId: memberId });
            setBlockedMemberIds((prev) => {
              const next = new Set(prev);
              next.add(memberId);
              return next;
            });
            setAnswers((prev) =>
              prev.filter(
                (answer) =>
                  answer.memberId !== memberId &&
                  answer.member?.id !== memberId,
              ),
            );
            setComments((prev) =>
              prev.filter(
                (comment) => comment.member?.id !== memberId,
              ),
            );
            openModal({ content: '차단했습니다.' });
          }
        } catch (e: any) {
          console.error('[차단 처리 에러]', e);
          openModal({ content: e?.message || '차단 처리에 실패했습니다.' });
        }
      },
    });
  };

  const handleCreateComment = async () => {
    if (!questionInstanceId || !newCommentText.trim()) {
      openModal({ content: '댓글 내용을 입력해주세요.' });
      return;
    }

    if (answers.length === 0) {
      openModal({ content: '답변이 없어 댓글을 작성할 수 없습니다.' });
      return;
    }

    const targetAnswerId = answers[0].id;
    const replyTargetCommentId =
      replyingToComment?.parent?.id || replyingToComment?.id || null;

    try {
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      await createComment({
        answerId: targetAnswerId,
        content: newCommentText.trim(),
        parentCommentId: replyingToComment?.id,
      });

      const questionData = await getQuestionInstanceDetails(questionInstanceId);
      const commentList = questionData.questionDetails?.comments || [];
      setComments(commentList as Comment[]);

      setNewCommentText('');
      setReplyingToComment(null);

      requestAnimationFrame(() => {
        if (replyTargetCommentId) {
          scrollToCommentAnchor(replyTargetCommentId);
          return;
        }

        commentsTopRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    } catch (e: any) {
      console.error('[댓글 생성 에러]', e);
      openModal({ content: e?.message || '댓글 작성에 실패했습니다.' });
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowEditCommentModal(true);
  };

  const handleStartReply = (comment: Comment) => {
    setReplyingToComment(comment);

    const parentId = comment.parent?.id || comment.id;
    scrollToCommentAnchor(parentId);

    setTimeout(() => {
      commentInputRef.current?.focus({ preventScroll: true });
    }, 320);
  };

  const handleSaveCommentEdit = async () => {
    if (!editingComment || !editCommentText.trim() || !questionInstanceId) {
      openModal({ content: '댓글 내용을 입력해주세요.' });
      return;
    }

    try {
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      await updateComment({
        questionInstanceId,
        commentId: editingComment.id,
        content: editCommentText.trim(),
      });

      const questionData = await getQuestionInstanceDetails(questionInstanceId);
      const commentList = questionData.questionDetails?.comments || [];
      setComments(commentList as Comment[]);

      setShowEditCommentModal(false);
      setEditingComment(null);
      setEditCommentText('');
      openModal({ content: '댓글이 수정되었습니다.' });
    } catch (e: any) {
      console.error('[댓글 수정 에러]', e);
      openModal({ content: e?.message || '댓글 수정에 실패했습니다.' });
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    openModal({
      type: 'confirm',
      title: '댓글 삭제',
      content: '정말 이 댓글을 삭제하시겠어요?',
      onConfirm: async () => {
        try {
          const token = await getItem('accessToken');
          if (token) setAccessToken(token);

          await deleteComment(comment.id);

          const questionData =
            await getQuestionInstanceDetails(questionInstanceId);
          const commentList = questionData.questionDetails?.comments || [];
          setComments(commentList as Comment[]);

          openModal({ content: '댓글이 삭제되었습니다.' });
        } catch (e: any) {
          console.error('[댓글 삭제 에러]', e);
          openModal({ content: e?.message || '댓글 삭제에 실패했습니다.' });
        }
      },
    });
  };

  const renderComments = () => {
    const rootComments = comments.filter((c) => !c.parent);

    return rootComments.map((rootComment) => {
      const isMyRootComment = currentUserId === rootComment.member?.id;

      const childComments = comments.filter(
        (c) => c.parent?.id === rootComment.id,
      );

      return (
        <div
          key={rootComment.id}
          ref={(el) => {
            rootCommentRefs.current[rootComment.id] = el;
          }}
        >
          <CommentCard
            comment={rootComment}
            isMyComment={isMyRootComment}
            isReply={false}
            onEdit={() => handleEditComment(rootComment)}
            onDelete={() => handleDeleteComment(rootComment)}
            onReply={() => handleStartReply(rootComment)}
            canReport={!isMyRootComment && Boolean(rootComment.id && rootComment.member?.id)}
            canBlock={
              !isMyRootComment && Boolean(rootComment.member?.id)
            }
            onReport={() => {
              if (!rootComment.id || !rootComment.member?.id) return;
              handleOpenReport({
                id: rootComment.id,
                type: 'COMMENT',
                name: getDisplayName(
                  rootComment.member?.familyRole,
                  rootComment.member?.gender,
                ),
              });
            }}
            onBlock={() => {
              if (!rootComment.member?.id) return;
              handleToggleBlock(
                rootComment.member.id,
                getDisplayName(
                  rootComment.member?.familyRole,
                  rootComment.member?.gender,
                ),
              );
            }}
            blockLabel={getBlockedLabel(rootComment.member?.id)}
          />

          {childComments.map((childComment) => {
            const isMyChildComment = currentUserId === childComment.member?.id;
              return (
                <CommentCard
                  key={childComment.id}
                  comment={childComment}
                  isMyComment={isMyChildComment}
                  isReply={true}
                  onEdit={() => handleEditComment(childComment)}
                  onDelete={() => handleDeleteComment(childComment)}
                  onReply={() => handleStartReply(childComment)}
                  canReport={
                    !isMyChildComment &&
                    Boolean(childComment.id && childComment.member?.id)
                  }
                  canBlock={
                    !isMyChildComment && Boolean(childComment.member?.id)
                  }
                  onReport={() => {
                    if (!childComment.id || !childComment.member?.id) return;
                    handleOpenReport({
                      id: childComment.id,
                      type: 'COMMENT',
                      name: getDisplayName(
                        childComment.member?.familyRole,
                        childComment.member?.gender,
                      ),
                    });
                  }}
                  onBlock={() => {
                    if (!childComment.member?.id) return;
                    handleToggleBlock(
                      childComment.member.id,
                      getDisplayName(
                        childComment.member?.familyRole,
                        childComment.member?.gender,
                      ),
                    );
                  }}
                  blockLabel={getBlockedLabel(childComment.member?.id)}
                />
              );
            })}
        </div>
      );
    });
  };

  const handleRootTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;

    if (isIOS) {
      swipeBackRef.current = {
        tracking: touch.clientX <= 24,
        startX: touch.clientX,
        startY: touch.clientY,
        triggered: false,
      };
    }

    if (window.scrollY <= 0 && !refreshing) {
      setStartY(touch.clientY);
      setStartX(touch.clientX);
      setIsPulling(true);
    }
  };

  const handleRootTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;

    if (isIOS) {
      const swipeState = swipeBackRef.current;
      if (swipeState.tracking && !swipeState.triggered) {
        const deltaX = touch.clientX - swipeState.startX;
        const deltaY = touch.clientY - swipeState.startY;

        if (Math.abs(deltaY) > 48 && deltaX < 40) {
          swipeBackRef.current.tracking = false;
        }

        if (deltaX > 90 && Math.abs(deltaY) < 80) {
          swipeBackRef.current.triggered = true;
          swipeBackRef.current.tracking = false;
          navigate(-1);
          return;
        }
      }
    }

    if (!isPulling || startY === 0 || refreshing) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) return;

    if (deltaY > 0 && window.scrollY <= 0) {
      const damped = Math.min(PULL_MAX, deltaY * 0.38);
      setPullY(damped);
      event.preventDefault();
      return;
    }

    setPullY(0);
  };

  const handleRootTouchEnd = async () => {
    swipeBackRef.current.tracking = false;

    if (refreshing) return;

    if (pullY >= PULL_TRIGGER) {
      await handleRefresh();
      return;
    }

    setPullY(0);
    setStartY(0);
    setStartX(0);
    setIsPulling(false);
  };

  return (
    <div
      className="min-h-screen bg-orange-50 pt-safe overflow-hidden relative"
      onTouchStart={handleRootTouchStart}
      onTouchMove={handleRootTouchMove}
      onTouchEnd={handleRootTouchEnd}
    >
      <div
        className="absolute top-0 left-0 right-0 z-10 flex justify-center items-center pointer-events-none"
        style={{
          height: '56px',
          transform: `translateY(${pullY - 56}px)`,
          opacity: pullY > 8 ? 1 : 0,
          transition: isPulling && !refreshing
            ? 'none'
            : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
        }}
      >
        <div className="p-2.5 rounded-full bg-white/95 shadow-md backdrop-blur-[1px]">
          <IoRefreshOutline
            size={22}
            className={`text-onsikku-dark-orange ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: refreshing ? undefined : `rotate(${pullY * 2.4}deg)` }}
          />
        </div>
      </div>

      {/* Header */}
      <div
        className="mx-auto w-full max-w-md px-4 pt-4"
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isPulling && !refreshing
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="px-0 py-2 flex-row items-center mb-2 flex">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm mr-4 flex"
          >
            <ArrowBackIcon size={24} />
          </button>
          <div className="font-sans text-xl font-bold text-gray-900">
            답변 상세
          </div>
        </div>
      </div>

      {/* Body scroll */}
      <div
        className="mx-auto w-full max-w-md px-5 pb-[180px]"
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isPulling && !refreshing
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Question */}
        <div className="relative items-center mb-6 mt-2 px-2 pt-8">
          {loading ? (
            <div className="absolute right-0 top-0">
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ) : questionSentAt && (
            <div className="absolute right-0 top-0 bg-orange-100 px-3 py-1 rounded-full">
              <div className="font-sans text-xs text-orange-600 font-medium">
                {formatDateSimple(questionSentAt)}
              </div>
            </div>
          )}
          {loading ? (
            <div className="space-y-3 w-full">
              <Skeleton className="h-7 w-4/5 mx-auto" />
              <Skeleton className="h-7 w-3/5 mx-auto" />
            </div>
          ) : (
            <div
              className="w-full min-w-0 font-sans text-2xl font-bold leading-9 text-center text-gray-900 break-words whitespace-pre-wrap"
              style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}
            >
              <span className="text-orange-500">Q. </span>
              {questionContent || question}
            </div>
          )}
        </div>

        {/* Answers */}
        <div>
          {loading ? (
            <div className="space-y-4 py-2">
              <div className="py-1 mb-1 flex-row justify-between items-center flex">
                <Skeleton className="h-6 w-24" />
              </div>
              {[...Array(2)].map((_, index) => (
                <div key={index} className="bg-white rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-11 h-11 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5 mb-4" />
                  <div className="pt-3 border-t border-gray-100 flex gap-4">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="py-2 mb-2 flex-row justify-between items-center flex">
                <div className="font-sans font-bold text-gray-800 text-lg">
                  답변{' '}
                  <span className="font-sans text-orange-500">
                    {answers.length}
                  </span>
                </div>
              </div>

              {answers.length === 0 ? (
                <div className="py-10 items-center flex justify-center">
                  <div className="font-sans text-gray-400">
                    아직 작성된 답변이 없습니다.
                  </div>
                </div>
              ) : (
                answers.map((answer) => {
                  const isMyAnswer = currentUserId === answer.memberId;
                  const answerMemberId = answer.memberId || answer.member?.id;
                  const authorLabel = getDisplayName(
                    answer.member?.familyRole,
                    answer.member?.gender,
                  );
                  return (
                    <FeedCard
                      key={answer.id || answer.answerId}
                      answer={answer}
                      isMyAnswer={isMyAnswer}
                      onEdit={() => handleEditAnswer(answer)}
                      onReaction={(type) => handleReaction(answer, type)}
                      disableReaction={answer.answerId
                        ? reactionLoadingIds.has(answer.answerId)
                        : false}
                      canReport={!isMyAnswer && Boolean(answer.answerId)}
                      canBlock={!isMyAnswer && Boolean(answerMemberId)}
                      onReport={() => {
                        if (!answer.answerId) return;
                        handleOpenReport({
                          id: answer.answerId,
                          type: 'ANSWER',
                          name: authorLabel,
                        });
                      }}
                      onBlock={() => {
                        if (!answerMemberId) return;
                        handleToggleBlock(answerMemberId, authorLabel);
                      }}
                      blockLabel={getBlockedLabel(answerMemberId)}
                    />
                  );
                })
              )}
            </>
          )}
        </div>

      {/* Comments */}
        {!loading && !error && (
          <div ref={commentsTopRef} className="mt-4 mb-5">
            <div className="py-2 mb-2">
              <div className="font-sans font-bold text-gray-800 text-lg">
                댓글{' '}
                <span className="font-sans text-gray-500">
                  {comments.length}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {comments.length === 0 ? (
                <div className="py-8 items-center bg-white flex justify-center">
                  <div className="font-sans text-gray-400 text-sm">
                    첫 번째 댓글을 남겨보세요!
                  </div>
                </div>
              ) : (
                renderComments()
              )}
              <div ref={commentsBottomRef} className="h-px w-full" />
            </div>
          </div>
        )}
        {pendingReport && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5">
            <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl">
              <div className="font-sans text-lg font-bold text-gray-900 mb-1">
                신고하기
              </div>
              <div className="font-sans text-sm text-gray-500 mb-4">
                대상:{' '}
                <span className="font-semibold text-gray-900">
                  {pendingReport.name}
                </span>
                {' '}
                {pendingReport.type === 'ANSWER' ? '답변' : '댓글'}
              </div>
              <div className="gap-2 flex flex-col">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setSelectedReportReason(option.value)}
                    className={`w-full text-left px-3 py-3 rounded-xl border text-sm ${
                      selectedReportReason === option.value
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex-row justify-end gap-3 mt-6 flex">
                <button
                  type="button"
                  onClick={handleCloseReport}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 active:opacity-70"
                >
                  <span className="font-sans text-gray-700 font-medium">
                    취소
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="px-4 py-2.5 rounded-lg bg-orange-500 active:opacity-70"
                >
                  <span className="font-sans text-white font-medium">신고</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom comment input */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-orange-100 bg-white"
        style={{
          transform: `translateY(-${keyboardInset}px)`,
          transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          className="mx-auto w-full max-w-md px-5 pt-1.5"
          style={{
            paddingBottom:
              keyboardInset > 0
                ? '0.4rem'
                : 'calc(env(safe-area-inset-bottom) + 0.4rem)',
          }}
        >
            {replyingToComment && (
              <div className="flex-row items-center justify-between bg-orange-50 px-3 py-2 rounded-lg mb-2 flex">
                <div className="font-sans text-sm text-gray-600">
                  <span className="font-sans font-bold">
                    {
                      getRoleIconAndText(
                        replyingToComment.member?.familyRole,
                        replyingToComment.member?.gender,
                      ).text
                    }
                  </span>
                  님에게 답글 작성 중...
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToComment(null)}
                  className="active:opacity-70"
                >
                  <CloseCircleIcon size={18} color="#9CA3AF" />
                </button>
              </div>
            )}

            <div className="flex-row items-end gap-2 flex">
              <textarea
                ref={commentInputRef}
                rows={1}
                className="flex-1 bg-transparent px-0 py-1.5 leading-6 font-sans text-base text-gray-900 max-h-24 min-h-[36px] resize-none outline-none"
                placeholder="댓글을 입력하세요..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onFocus={() => {
                  if (!replyingToComment) {
                    scrollToCommentsBottom();
                  }
                }}
              />
              <button
                type="button"
                className={`w-9 h-9 rounded-full items-center justify-center mb-0.5 flex ${
                  newCommentText.trim() ? 'bg-orange-500' : 'bg-gray-200'
                }`}
                disabled={!newCommentText.trim()}
                onClick={handleCreateComment}
              >
                <ArrowUpIcon size={20} />
              </button>
            </div>
        </div>
      </div>

      {/* Answer edit modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="font-sans text-lg font-bold text-gray-900 mb-4">
              답변 수정
            </div>
            <textarea
              className="bg-gray-50 rounded-xl p-4 font-sans text-base text-gray-900 min-h-[120px] w-full resize-none outline-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="내용을 입력하세요"
            />
            <div className="flex-row justify-end gap-3 mt-6 flex">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-gray-100 active:opacity-70"
                onClick={() => setShowEditModal(false)}
              >
                <span className="font-sans text-gray-600 font-medium">
                  취소
                </span>
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-orange-500 active:opacity-70"
                onClick={handleSaveEdit}
              >
                <span className="font-sans text-white font-medium">저장</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment edit modal */}
      {showEditCommentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="font-sans text-lg font-bold text-gray-900 mb-4">
              댓글 수정
            </div>
            <textarea
              className="bg-gray-50 rounded-xl p-4 font-sans text-base text-gray-900 min-h-[100px] w-full resize-none outline-none"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              placeholder="내용을 입력하세요"
            />
            <div className="flex-row justify-end gap-3 mt-6 flex">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-gray-100 active:opacity-70"
                onClick={() => setShowEditCommentModal(false)}
              >
                <span className="font-sans text-gray-600 font-medium">
                  취소
                </span>
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg bg-orange-500 active:opacity-70"
                onClick={handleSaveCommentEdit}
              >
                <span className="font-sans text-white font-medium">저장</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
