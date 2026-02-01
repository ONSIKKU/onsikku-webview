import type { QuestionDetails } from '@/utils/api';

const StatItem = ({
  value,
  label,
}: {
  value: number;
  label: string;
}) => (
  <div className="flex flex-row items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-xl">
    <span className="font-sans text-[11px] text-gray-500 font-medium">{label}</span>
    <span className="font-sans text-base font-bold text-onsikku-dark-orange leading-none">{value}</span>
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
  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => q.state === 'ANSWERED').length;

  const now = new Date();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const title = isCurrentMonth ? '이번 달 활동' : `${month}월 활동`;

  return (
    <div className="bg-white w-full px-5 py-3.5 rounded-3xl shadow-sm flex flex-row items-center justify-between">
      <div className="font-sans font-bold text-sm text-gray-900">
        {title}
      </div>
      <div className="flex flex-row gap-2">
        <StatItem
          value={totalQuestions}
          label="질문"
        />
        <StatItem
          value={answeredCount}
          label="완료"
        />
      </div>
    </div>
  );
}
