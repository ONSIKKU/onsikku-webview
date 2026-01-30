import { useEffect, useState, useCallback } from 'react';
import TodayQuestion from '@/components/TodayQuestion';
import TodayRespondent from '@/components/TodayRespondent';
import { getRoleIconAndText } from '@/utils/labels';
import type { Member, QuestionAssignment, QuestionResponse } from '@/utils/api';
import { apiFetch, getMyPage, setAccessToken } from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';

export default function NotAssignedPage() {
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<QuestionAssignment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
  const [questionContent, setQuestionContent] = useState<string>('');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      setAccessToken(token);

      // Fetch User Info
      try {
        const myPageData = await getMyPage();
        if (myPageData.member) {
          setCurrentUserId(myPageData.member.id);
          setCurrentUserRole(myPageData.member.familyRole);
          setCurrentUserGender(myPageData.member.gender);
        }
      } catch (e) {
        console.error('Failed to fetch user info', e);
      }

      // Fetch Questions
      try {
        const response = await apiFetch<QuestionResponse>('/api/questions', {
          method: 'GET',
        });
        const questionAssignments =
          response.questionDetails?.questionAssignments || [];
        setQuestions(questionAssignments);
        setFamilyMembers(response.familyMembers || []);

        if (response.questionDetails) {
          setQuestionContent(response.questionDetails.questionContent || '');
        }
      } catch (e) {
        console.error('Failed to fetch questions', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentUserQuestion = questions.find(
    (q) => q.member?.id === currentUserId,
  );
  const currentQuestion = currentUserQuestion || questions[0];

  const hasUserAssignment = false; // Intentionally false for this page
  const hasAnsweredToday = false;
  const isQuestionEmpty = !questionContent;
  const displayQuestionContent = questionContent;

  if (loading) {
    return (
      <div className="min-h-screen w-full px-4 bg-onsikku-main-orange flex flex-col items-center justify-center gap-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-onsikku-dark-orange" />
        <p className="font-sans text-gray-600">로딩 중...</p>
      </div>
    );
  }

  const greeting =
    getRoleIconAndText(currentUserRole as any, currentUserGender as any).text ||
    '가족';

  return (
    <div className="min-h-screen w-full bg-orange-50">
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
            반가워요, {greeting}님! 👋
          </h1>
        </div>

        <div className="gap-6 flex flex-col">
          <TodayRespondent
            members={familyMembers}
            assignments={questions}
            currentUserId={currentUserId}
          />

          <TodayQuestion
            question={displayQuestionContent}
            questionAssignmentId={currentQuestion?.id}
            questionInstanceId={undefined}
            isUserAssignment={hasUserAssignment} // ✅ false라서 버튼/상태가 비활성 흐름
            isAnswered={hasAnsweredToday}
            isEmpty={isQuestionEmpty}
          />

          <div>
            <div className="flex flex-row justify-between items-center mb-3 px-1">
              <h2 className="font-sans font-bold text-xl text-gray-800">
                지난 추억들
              </h2>
            </div>

            <div className="w-full flex items-center justify-center py-8">
              <p className="font-sans text-gray-500 text-sm">
                아직 답변이 없습니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
