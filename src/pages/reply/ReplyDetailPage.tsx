import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Answer, Comment } from '@/utils/api';
import {
  addReaction,
  createComment,
  deleteComment,
  getMyPage,
  getQuestionInstanceDetails,
  setAccessToken,
  updateAnswer,
  updateComment,
} from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { getRoleIconAndText } from '@/utils/labels';
import RoleIcon from '@/components/RoleIcon';
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
        d="M9 14l-4-4 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20v-3a7 7 0 0 0-7-7H5"
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

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const safe = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(safe);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

const formatDateSimple = (dateString: string) => {
  if (!dateString) return '';
  const safe = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(safe);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
};

const getContentText = (content: any): string => {
  if (typeof content === 'string') return content;
  if (content?.text) return content.text;
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
};

const ReactionButton = ({
  icon,
  count,
  onPress,
}: {
  icon: string;
  count: number;
  onPress: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex-row items-center gap-1 flex active:opacity-70"
    >
      <span className="text-base">{icon}</span>
      <span className="font-sans text-sm text-gray-500">{count}</span>
    </button>
  );
};

const FeedCard = ({
  answer,
  isMyAnswer,
  onEdit,
  onReaction,
}: {
  answer: Answer;
  isMyAnswer: boolean;
  onEdit: () => void;
  onReaction: (type: 'LIKE' | 'ANGRY' | 'SAD' | 'FUNNY') => void;
}) => {
  const role = answer.familyRole || answer.member?.familyRole;
  const gender = answer.gender || answer.member?.gender;

  const { icon: roleIcon, text: roleText } = getRoleIconAndText(role, gender);

  const reactions = [
    { type: 'LIKE' as const, icon: '👍', count: answer.likeReactionCount },
    { type: 'FUNNY' as const, icon: '😂', count: answer.funnyReactionCount },
    { type: 'SAD' as const, icon: '😢', count: answer.sadReactionCount },
    { type: 'ANGRY' as const, icon: '😡', count: answer.angryReactionCount },
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

        {isMyAnswer && (
          <div className="flex flex-row gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="p-2 active:opacity-70"
              aria-label="edit answer"
            >
              <PencilIcon size={18} color="#9CA3AF" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="font-sans text-gray-800 text-base leading-relaxed mb-4 whitespace-pre-wrap">
        {getContentText(answer.content)}
      </div>

      {/* Reactions */}
      <div className="flex-row items-center justify-between pt-4 border-t border-gray-100 flex">
        {reactions.map((reaction) => (
          <ReactionButton
            key={reaction.type}
            icon={reaction.icon}
            count={reaction.count || 0}
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
}: {
  comment: Comment;
  isMyComment: boolean;
  isReply: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
}) => {
  const role = comment.member?.familyRole ?? comment.familyRole;
  const gender = comment.member?.gender ?? comment.gender;
  const { icon: roleIcon, text: roleText } = getRoleIconAndText(role, gender);

  return (
    <div className={`${isReply ? 'ml-8' : ''}`}>
      <div
        className={`flex-row items-start px-4 py-3 ${isReply ? 'bg-gray-50/50' : 'bg-white'} flex`}
      >
        {isReply && (
          <div className="absolute left-5 top-4 mr-1">
            <ReplyTurnIcon size={16} color="#9CA3AF" />
          </div>
        )}

        <div className="flex-1 ml-0">
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

            <div className="flex-row items-center gap-3 flex">
              {isMyComment && (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="p-1 active:opacity-70"
                    aria-label="edit comment"
                  >
                    <PencilIcon size={16} color="#9CA3AF" />
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="p-1 active:opacity-70"
                    aria-label="delete comment"
                  >
                    <TrashIcon size={16} color="#EF4444" />
                  </button>
                </>
              )}
            </div>
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

  const fetchData = async () => {
    if (!questionInstanceId) {
      setError('질문 정보가 없습니다.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
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
    } catch (e: any) {
      console.error('[답변 조회 에러]', e);
      setError(e?.message || '답변을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionInstanceId]);

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
    reactionType: 'LIKE' | 'ANGRY' | 'SAD' | 'FUNNY',
  ) => {
    try {
      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      await addReaction({ answerId: answer.answerId, reactionType });

      const questionData = await getQuestionInstanceDetails(questionInstanceId);
      const answerList = questionData.questionDetails?.answers || [];
      const convertedAnswers: Answer[] = answerList.map((ans: any) => ({
        ...ans,
        id: ans.answerId,
      }));
      setAnswers(convertedAnswers);
    } catch (e: any) {
      console.error('[반응 추가 에러]', e);
      openModal({ content: e?.message || '반응을 남기지 못했습니다.' });
    }
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
        <div key={rootComment.id}>
          <CommentCard
            comment={rootComment}
            isMyComment={isMyRootComment}
            isReply={false}
            onEdit={() => handleEditComment(rootComment)}
            onDelete={() => handleDeleteComment(rootComment)}
            onReply={() => setReplyingToComment(rootComment)}
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
                onReply={() => setReplyingToComment(childComment)}
              />
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-orange-50 pt-safe">
      {/* Header */}
      <div className="mx-auto w-full max-w-md px-4 pt-4">
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
      <div className="mx-auto w-full max-w-md px-5 pb-[180px]">
        {/* Question */}
        <div className="relative items-center mb-6 mt-2 px-2 pt-8">
          {questionSentAt && (
            <div className="absolute right-0 top-0 bg-orange-100 px-3 py-1 rounded-full">
              <div className="font-sans text-xs text-orange-600 font-medium">
                {formatDateSimple(questionSentAt)}
              </div>
            </div>
          )}
          <div className="font-sans text-2xl font-bold leading-9 text-center text-gray-900">
            <span className="text-orange-500">Q. </span>
            {questionContent || question}
          </div>
        </div>

        {/* Answers */}
        <div>
          {loading ? (
            <div className="py-10 items-center flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-onsikku-dark-orange" />
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
                  return (
                    <FeedCard
                      key={answer.id || answer.answerId}
                      answer={answer}
                      isMyAnswer={isMyAnswer}
                      onEdit={() => handleEditAnswer(answer)}
                      onReaction={(type) => handleReaction(answer, type)}
                    />
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Comments */}
        {!loading && !error && (
          <div className="mt-4 mb-5">
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
            </div>
          </div>
        )}
      </div>

      {/* Bottom comment input */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="mx-auto w-full max-w-md px-5 pt-2 bg-transparent pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <div className="bg-white rounded-2xl px-2 py-2 shadow-lg border border-orange-100">
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
                className="flex-1 bg-transparent px-2 py-2 font-sans text-base text-gray-900 max-h-24 resize-none outline-none"
                placeholder="댓글을 입력하세요..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
              />
              <button
                type="button"
                className={`w-10 h-10 rounded-full items-center justify-center mb-0.5 flex ${
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
