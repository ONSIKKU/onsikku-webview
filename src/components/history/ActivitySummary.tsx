import React from 'react';
import type { QuestionDetails } from '@/utils/api';
import { IoChatbubblesOutline, IoCheckmarkDoneOutline } from 'react-icons/io5';

const StatCard = ({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-orange-50 rounded-2xl p-5 flex-1 items-center justify-center flex flex-col gap-2">
    <div className="bg-white p-2 rounded-full shadow-sm text-onsikku-dark-orange">
      {icon}
    </div>
    <div className="flex flex-col items-center">
      <div className="font-sans text-2xl font-bold text-gray-900">{value}</div>
      <div className="font-sans text-xs text-gray-500 font-medium">{label}</div>
    </div>
  </div>
);

interface ActivitySummaryProps {
  questions: QuestionDetails[];
  year: number;
  month: number;
}

export default function ActivitySummary({
  questions,
  year,
  month,
}: ActivitySummaryProps) {
  // 총 질문 수
  const totalQuestions = questions.length;

  // 답변 완료 수
  const answeredCount = questions.filter((q) => q.state === 'ANSWERED').length;

  // 제목 텍스트 (선택된 월 표시)
  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const title = isCurrentMonth ? '이번 달 활동' : `${year}년 ${month}월 활동`;

  return (
    <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
      <div className="font-sans font-bold text-lg text-gray-900 mb-5 ml-1">
        {title}
      </div>
      <div className="flex flex-row justify-between gap-4">
        <StatCard
          value={totalQuestions}
          label="총 질문"
          icon={<IoChatbubblesOutline size={20} />}
        />
        <StatCard
          value={answeredCount}
          label="답변 완료"
          icon={<IoCheckmarkDoneOutline size={20} />}
        />
      </div>
    </div>
  );
}