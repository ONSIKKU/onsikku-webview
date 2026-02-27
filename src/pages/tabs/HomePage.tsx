import RecentAnswers from '@/components/RecentAnswers';
import TodayQuestion from '@/components/TodayQuestion';
import TodayRespondent from '@/components/TodayRespondent';
import type {
  Answer,
  Member,
  QuestionAssignment,
} from '@/utils/api';
import {
  getMyPage,
  getRecentAnswers,
  setAccessToken,
  getTodayQuestions,
} from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { getRoleIconAndText } from '@/utils/labels';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoRefreshOutline } from 'react-icons/io5';
import Skeleton from '@/components/Skeleton';

export default function HomePage() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionAssignment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
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
  const [currentUserNickname, setCurrentUserNickname] = useState<string | null>(
    null,
  );

  // Pull to Refresh State
  const [startY, setStartY] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [carouselTouchStartX, setCarouselTouchStartX] = useState(0);
  const [carouselTouchStartY, setCarouselTouchStartY] = useState(0);
  const [carouselDragX, setCarouselDragX] = useState(0);
  const [isCarouselDragging, setIsCarouselDragging] = useState(false);

  const PULL_MAX = 104;
  const PULL_TRIGGER = 58;
  const PULL_SNAP = 52;

  const fetchTodayQuestions = useCallback(async () => {
    try {
      // Don't set global loading on refresh, just handle data update
      if (!refreshing) {
        // no-op
      }

      const token = await getItem('accessToken');
      if (!token) {
        setQuestions([]);
        setFamilyMembers([]);
        setQuestionContent('');
        setQuestionInstanceId(null);
        return;
      }

      setAccessToken(token);
      
      const { questionDetails, familyMembers } = await getTodayQuestions();

      const assignments = questionDetails?.questionAssignments || [];

      setQuestions(assignments);
      setFamilyMembers(familyMembers);

      if (questionDetails) {
        setQuestionContent(questionDetails.questionContent || '');
        setQuestionInstanceId(questionDetails.questionInstanceId || null);
      }
    } catch (e: any) {
      console.error('[오늘의 질문 조회 에러]', e);
      // Only show error if not existing data or if explicit error handling needed
      if (!questions.length) console.error(e?.message || '질문을 불러오지 못했습니다');
    }
  }, [refreshing, questions.length]);

  const fetchRecentAnswers = useCallback(async () => {
    try {
      if (!refreshing) setLoadingAnswers(true);

      const token = await getItem('accessToken');
      if (token) {
        setAccessToken(token);
        const answers = await getRecentAnswers(10);
        setRecentAnswers(answers);
      }
    } catch (e) {
      console.error('[최근 답변 조회 에러]', e);
      setRecentAnswers([]);
    } finally {
      if (!refreshing) setLoadingAnswers(false);
    }
  }, [refreshing]);

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
        setCurrentUserNickname(myPageData.member.nickname || '');
      }
    } catch (e) {
      console.error('[현재 사용자 조회 에러]', e);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchCurrentUser(),
      fetchTodayQuestions(),
      fetchRecentAnswers()
    ]);
  }, [fetchCurrentUser, fetchTodayQuestions, fetchRecentAnswers]);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await handleRefresh();
      setLoading(false);
    };
    init();
  }, []); // Run once on mount

  // Pull to Refresh Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || startY === 0 || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 0 && window.scrollY <= 0) {
      const damped = Math.min(PULL_MAX, diff * 0.38);
      setPullY(damped);
      e.preventDefault();
      return;
    }

    setPullY(0);
  };

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    setPullY(PULL_SNAP);
    const startedAt = Date.now();

    try {
      await handleRefresh();
    } finally {
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, 420 - elapsed);
      if (remain > 0) {
        await new Promise((resolve) => setTimeout(resolve, remain));
      }
      setRefreshing(false);
      setPullY(0);
      setStartY(0);
      setIsPulling(false);
    }
  }, [handleRefresh]);

  const onTouchEnd = async () => {
    if (refreshing) return;

    if (pullY >= PULL_TRIGGER) {
      await handlePullRefresh();
      return;
    }

    setPullY(0);
    setStartY(0);
    setIsPulling(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
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
        content: qContent,
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

  const onCarouselTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (recentAnswersData.length <= 1) return;
    const touch = e.touches[0];
    setCarouselTouchStartX(touch.clientX);
    setCarouselTouchStartY(touch.clientY);
    setCarouselDragX(0);
    setIsCarouselDragging(true);
  };

  const onCarouselTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCarouselDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - carouselTouchStartX;
    const deltaY = touch.clientY - carouselTouchStartY;

    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    e.preventDefault();
    e.stopPropagation();

    const clamped = Math.max(-72, Math.min(72, deltaX * 0.36));
    setCarouselDragX(clamped);
  };

  const onCarouselTouchEnd = () => {
    if (!isCarouselDragging) return;

    const threshold = 24;
    const lastIndex = Math.max(0, recentAnswersData.length - 1);
    let nextIndex = activeIndex;

    if (carouselDragX <= -threshold) {
      nextIndex = Math.min(activeIndex + 1, lastIndex);
    } else if (carouselDragX >= threshold) {
      nextIndex = Math.max(activeIndex - 1, 0);
    }

    setActiveIndex(nextIndex);
    setCarouselDragX(0);
    setIsCarouselDragging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 px-5 pt-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-9 w-64 rounded-xl" />
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex gap-3">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="w-10 h-10 rounded-full" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-4/6" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-7 w-28" />
            <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex justify-center gap-2">
              <Skeleton className="h-2 w-6 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const greetingRoleText =
    getRoleIconAndText(currentUserRole as any, currentUserGender as any).text ||
    '가족';

  const displayGreeting = currentUserNickname || greetingRoleText;

  return (
    <div 
      className="min-h-screen bg-orange-50 pb-10 overflow-hidden relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
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

      <div 
        className="mx-auto w-full px-5 pt-8"
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isPulling && !refreshing
            ? 'none'
            : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Header Section */}
        <div className="mb-8">
          <p className="font-sans text-gray-500 font-medium text-sm mb-1 ml-1">
            {new Date().toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <h1 className="font-sans text-2xl font-bold text-gray-900 ml-1">
            반가워요, <span className="text-onsikku-dark-orange">{displayGreeting}</span>님! 👋
          </h1>
        </div>

        <div className="flex flex-col gap-6">
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
          <div className="mt-2">
            <div className="flex flex-row justify-between items-center mb-4 px-1">
              <h2 className="font-sans font-bold text-xl text-gray-800">
                지난 추억들
              </h2>
            </div>

            {loadingAnswers ? (
              <div className="w-full py-3 space-y-3">
                <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="flex justify-center gap-2">
                  <Skeleton className="h-2 w-6 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                </div>
              </div>
            ) : recentAnswersData.length === 0 ? (
              <div className="w-full flex items-center justify-center py-12 bg-white rounded-3xl shadow-sm">
                <p className="font-sans text-gray-400 text-base">
                  아직 작성된 답변이 없습니다
                </p>
              </div>
            ) : (
              <>
                <div
                  className="w-full overflow-hidden pb-4 -mb-4"
                  onTouchStart={onCarouselTouchStart}
                  onTouchMove={onCarouselTouchMove}
                  onTouchEnd={onCarouselTouchEnd}
                >
                  <div
                    className="flex"
                    style={{
                      transform: `translate3d(calc(${-activeIndex * 100}% + ${carouselDragX}px), 0, 0)`,
                      transition: isCarouselDragging
                        ? 'none'
                        : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    {recentAnswersData.map((item, index) => (
                      <div
                        key={index}
                        className="w-full flex-shrink-0 px-1"
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
                </div>

                <div className="flex-row justify-center items-center gap-1.5 mt-4 flex">
                  {recentAnswersData.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeIndex === index
                          ? 'w-4 bg-onsikku-dark-orange'
                          : 'w-1.5 bg-orange-200'
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
