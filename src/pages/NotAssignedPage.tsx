import { useEffect, useState } from 'react';
import TodayQuestion from '@/components/TodayQuestion';
import TodayRespondent from '@/components/TodayRespondent';
import { getRoleIconAndText } from '@/utils/labels';
import type { Member, QuestionAssignment } from '@/utils/api';

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

  // ✅ RN not-assigned.tsx 처럼 Mock 데이터 로드 (0.5초 로딩 시뮬)
  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockMeId = 'user-me';
        setCurrentUserId(mockMeId);
        setCurrentUserRole('CHILD');
        setCurrentUserGender('MALE');

        const mockMembers: Member[] = [
          {
            id: mockMeId,
            familyRole: 'CHILD',
            gender: 'MALE',
            profileImageUrl: '',
            role: 'MEMBER',
            birthDate: '',
            createdAt: '',
            updatedAt: '',
            alarmEnabled: true,
          } as any,
          {
            id: 'user-mom',
            familyRole: 'PARENT',
            gender: 'FEMALE',
            profileImageUrl: '',
            role: 'MEMBER',
            birthDate: '',
            createdAt: '',
            updatedAt: '',
            alarmEnabled: true,
          } as any,
          {
            id: 'user-dad',
            familyRole: 'PARENT',
            gender: 'MALE',
            profileImageUrl: '',
            role: 'MEMBER',
            birthDate: '',
            createdAt: '',
            updatedAt: '',
            alarmEnabled: true,
          } as any,
        ];
        setFamilyMembers(mockMembers);

        const mockAssignments: QuestionAssignment[] = [
          {
            id: 'assignment-1',
            member: mockMembers[1], // Mom
            state: 'SENT',
            dueAt: '',
            sentAt: '',
            readAt: null,
            answeredAt: null,
            expiredAt: null,
            reminderCount: 0,
            lastRemindedAt: null,
          } as any,
        ];
        setQuestions(mockAssignments);

        setQuestionContent('가족들과 함께 가고 싶은 여행지가 있나요?');
      } finally {
        setLoading(false);
      }
    };

    loadMockData();
  }, []);

  const currentUserQuestion = questions.find(
    (q) => q.member?.id === currentUserId,
  );
  const currentQuestion = currentUserQuestion || questions[0];

  const hasUserAssignment = !!currentUserQuestion; // ✅ RN에서는 false가 되게 설계(내가 배정 X)
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
                지난 추억들 (Mock)
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
