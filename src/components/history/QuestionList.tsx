import type { QuestionDetails } from '@/utils/api';
import { getRoleIconAndText } from '@/utils/labels';
import QuestionCard, { type Question } from './QuestionCard';
import Skeleton from '@/components/Skeleton';

interface QuestionListProps {
  questions: QuestionDetails[];
  loading: boolean;
  onQuestionPress?: (
    questionAssignmentId: string,
    question: string,
    questionInstanceId?: string,
    status?: 'answered' | 'pending',
    isMine?: boolean,
  ) => void;
  currentUserId?: string | null;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

export default function QuestionList({
  questions,
  loading,
  onQuestionPress,
  currentUserId,
}: QuestionListProps) {
  const convertedQuestions: Question[] = questions.map((q) => {
    const { icon, text } = getRoleIconAndText(q.familyRole, q.gender);
    const status: 'answered' | 'pending' = q.state === 'ANSWERED' ? 'answered' : 'pending';
    const isMine = Boolean(currentUserId && q.member?.id && q.member.id === currentUserId);

    return {
      id: q.questionInstanceId,
      date: formatDate(q.sentAt || ''),
      author: text,
      authorAvatar: icon,
      question: q.questionContent,
      status,
      isMine,
      questionAssignmentId: q.questionAssignmentId,
      questionInstanceId: q.questionInstanceId,
    };
  });

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex flex-col" style={{ gap: 12 }}>
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-14" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5 mb-3" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (convertedQuestions.length === 0) {
    return (
      <div className="w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="font-sans text-gray-500 text-center text-base">
            이 기간에 질문이 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col" style={{ gap: 12 }}>
        {convertedQuestions.map((item) => (
          (() => {
            const canPressAnswered = item.status === 'answered';
            const canPressPendingMine = item.status === 'pending' && item.isMine;
            const canPress = canPressAnswered || canPressPendingMine;

            return (
              <QuestionCard
                key={item.id}
                item={item}
                onPress={
                  canPress &&
                  item.questionAssignmentId &&
                  item.questionInstanceId &&
                  onQuestionPress
                    ? () =>
                        onQuestionPress(
                          item.questionAssignmentId!,
                          item.question,
                          item.questionInstanceId,
                          item.status,
                          item.isMine,
                        )
                    : undefined
                }
              />
            );
          })()
        ))}
      </div>
    </div>
  );
}
