import RecentAnswers from '@/components/RecentAnswers';
import TodayQuestion from '@/components/TodayQuestion';
import TodayRespondent from '@/components/TodayRespondent';
import type {
  Answer,
  Member,
  QuestionAssignment,
  QuestionResponse,
} from '@/utils/api';
import {
  apiFetch,
  getMyPage,
  getRecentAnswers,
  setAccessToken,
  getTodayQuestions,
} from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { getRoleIconAndText } from '@/utils/labels';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionAssignment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string>('');
  const [questionContent, setQuestionContent] = useState<string>('');
  const [questionInstanceId, setQuestionInstanceId] = useState<string | null>(
    null,
  );
  const [recentAnswers, setRecentAnswers] = useState<Answer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(
    null,
  );

  const fetchTodayQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = await getItem('accessToken');
      if (!token) {
        // 토큰이 없으면 로그인 페이지로 이동하거나 에러 처리
        // 여기서는 에러 메시지만 설정
        // setError('로그인이 필요합니다');
        setQuestions([]);
        setFamilyMembers([]);
        setQuestionContent('');
        setQuestionInstanceId(null);
        return;
      }

      setAccessToken(token);
      
      const { questionDetails, familyMembers } = await getTodayQuestions();

      // questionDetails can be undefined/null if no question
      const assignments = questionDetails?.questionAssignments || [];

      setQuestions(assignments);
      setFamilyMembers(familyMembers);

      if (questionDetails) {
        setQuestionContent(questionDetails.questionContent || '');
        setQuestionInstanceId(questionDetails.questionInstanceId || null);
      }
    } catch (e: any) {
      console.error('[오늘의 질문 조회 에러]', e);
      // 404 등 질문이 없는 경우에 대한 처리도 필요할 수 있음
      setError(e?.message || '질문을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentAnswers = useCallback(async () => {
    try {
      setLoadingAnswers(true);

      const token = await getItem('accessToken');
      if (token) {
        setAccessToken(token);
        const answers = await getRecentAnswers(3, 10); // 최근 3개월, 10개
        setRecentAnswers(answers);
      }
    } catch (e) {
      console.error('[최근 답변 조회 에러]', e);
      setRecentAnswers([]);
    } finally {
      setLoadingAnswers(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = await getItem('accessToken');
      if (!token) return;
      setAccessToken(token);

      const myPageData = await getMyPage();
      if (myPageData.member) {
        setCurrentUserId(myPageData.member.id);
        setCurrentUserRole(myPageData.member.familyRole);
        setCurrentUserGender(myPageData.member.gender);
      }
    } catch (e) {
      console.error('[현재 사용자 조회 에러]', e);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchTodayQuestions();
    fetchRecentAnswers();
  }, [fetchCurrentUser, fetchTodayQuestions, fetchRecentAnswers]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
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

  const recentAnswersData = useMemo(() => {
    return recentAnswers.map((answer) => {
      const familyRole =
        answer.member?.familyRole || answer.familyRole || 'PARENT';
      const gender = answer.member?.gender || answer.gender;

      const qContent = answer.questionContent || '';
      const qInstanceId = answer.questionInstanceId || '';

      const { text: roleText, icon: roleIcon } = getRoleIconAndText(
        familyRole,
        gender,
      );

      return {
        roleName: roleText,
        date: formatDate(answer.createdAt),
        content: getContentText(answer.content),
        questionInstanceId: qInstanceId,
        question: qContent,
        roleIcon,
      };
    });
  }, [recentAnswers]);

  const currentUserQuestion = currentUserId
    ? questions.find((q) => q.member?.id === currentUserId)
    : null;

  const currentQuestion = currentUserQuestion || questions[0];

  const isQuestionEmpty = !questionContent || questionContent.trim() === '';

  const displayQuestionContent =
    questionContent && questionContent.trim() !== ''
      ? questionContent
      : '새로운 질문을 기다려 주세요';

  const hasUserAssignment = !!currentUserQuestion;

  const hasAnsweredToday =
    currentUserQuestion?.state === 'ANSWERED' ||
    currentQuestion?.state === 'ANSWERED';

  const displayQuestionInstanceId = questionInstanceId;

  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    setActiveIndex(idx);
  };

  if (loading) {
    return (
      <div className="-mx-4 -mt-4 min-h-screen bg-orange-50 flex flex-col items-center justify-center gap-6 px-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-onsikku-dark-orange" />
        <p className="font-sans text-gray-600">질문을 불러오는 중...</p>
      </div>
    );
  }

  // 에러가 있어도 질문이 없으면 빈 화면 표시 (혹은 에러 메시지)
  // 여기서는 질문 목록이 비어있고 에러가 있으면 에러 표시
  if (error && questions.length === 0) {
    return (
      <div className="-mx-4 -mt-4 min-h-screen bg-orange-50 flex items-center justify-center px-4">
        <p className="font-sans text-red-500 text-center">{error}</p>
      </div>
    );
  }

  const greetingRoleText =
    getRoleIconAndText(currentUserRole as any, currentUserGender as any).text ||
    '가족';

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-orange-50">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-3">
        {/* Header Section */}
        <div className="mb-6 mt-2">
          <p className="font-sans text-gray-500 font-medium text-sm mb-1 ml-1">
            {new Date().toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <h1 className="font-sans text-2xl font-bold text-gray-900 ml-1">
            반가워요, {greetingRoleText}님! 👋
          </h1>
        </div>

        <div className="gap-6 flex flex-col">
          {!isQuestionEmpty && (
            <TodayRespondent
              members={familyMembers}
              assignments={questions}
              currentUserId={currentUserId}
            />
          )}

          <TodayQuestion
            question={displayQuestionContent}
            questionAssignmentId={currentQuestion?.id}
            questionInstanceId={displayQuestionInstanceId || undefined}
            isUserAssignment={hasUserAssignment}
            isAnswered={hasAnsweredToday}
            isEmpty={isQuestionEmpty}
          />

          {/* Recent Answers Section */}
          <div>
            <div className="flex flex-row justify-between items-center mb-3 px-1">
              <h2 className="font-sans font-bold text-xl text-gray-800">
                지난 추억들
              </h2>
            </div>

            {loadingAnswers ? (
              <div className="w-full flex flex-col items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-onsikku-dark-orange" />
                <p className="font-sans text-gray-500 mt-2 text-sm">
                  답변을 불러오는 중...
                </p>
              </div>
            ) : recentAnswersData.length === 0 ? (
              <div className="w-full flex items-center justify-center py-8">
                <p className="font-sans text-gray-500 text-sm">
                  아직 답변이 없습니다
                </p>
              </div>
            ) : (
              <>
                <div
                  onScroll={handleCarouselScroll}
                  className="w-full overflow-x-auto flex snap-x snap-mandatory scroll-smooth"
                >
                  {recentAnswersData.map((item, index) => (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 snap-start"
                    >
                      <RecentAnswers
                        roleName={item.roleName}
                        date={item.date}
                        content={item.content}
                        roleIcon={item.roleIcon}
                        onPress={() => {
                          if (!item.questionInstanceId) return;
                          navigate(
                            `/reply-detail?questionInstanceId=${encodeURIComponent(
                              item.questionInstanceId,
                            )}&question=${encodeURIComponent(item.question)}`,
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex-row justify-center items-center gap-2 mt-4 flex">
                  {recentAnswersData.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        activeIndex === index
                          ? 'bg-onsikku-dark-orange'
                          : 'bg-orange-200'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
