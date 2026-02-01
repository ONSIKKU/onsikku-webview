import React from 'react';
import type { QuestionDetails } from '@/utils/api';
import { getRoleIconAndText } from '@/utils/labels';
import QuestionCard, { type Question } from './QuestionCard';

interface QuestionListProps {
  questions: QuestionDetails[];
  loading: boolean;
  error: string | null;
  onQuestionPress?: (
    questionAssignmentId: string,
    question: string,
    questionInstanceId?: string,
  ) => void;
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
  error,
  onQuestionPress,
}: QuestionListProps) {
  const convertedQuestions: Question[] = questions.map((q) => {
    const { icon, text } = getRoleIconAndText(q.familyRole, q.gender);
    return {
      id: q.questionInstanceId,
      date: formatDate(q.sentAt || ''),
      author: text,
      authorAvatar: icon,
      question: q.questionContent,
      status: q.state === 'ANSWERED' ? 'answered' : 'pending',
      questionAssignmentId: q.questionAssignmentId,
      questionInstanceId: q.questionInstanceId,
    };
  });

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm items-center justify-center flex flex-col">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-onsikku-dark-orange" />
          <div className="font-sans text-gray-500 mt-4 text-base">
            질문을 불러오는 중...
          </div>
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
          <QuestionCard
            key={item.id}
            item={item}
            onPress={
              item.questionAssignmentId &&
              item.questionInstanceId &&
              onQuestionPress
                ? () =>
                    onQuestionPress(
                      item.questionAssignmentId!,
                      item.question,
                      item.questionInstanceId,
                    )
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
