import { useNavigate } from 'react-router-dom';

function MessageCircleIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.1 0-2.2-.2-3.2-.6L3 21l1.6-6.3c-.4-1-.6-2.1-.6-3.2A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"
        stroke="#FB923C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface TodayQuestionProps {
  question: string;
  questionAssignmentId?: string;
  questionInstanceId?: string;
  isUserAssignment?: boolean;
  isAnswered?: boolean;
  isEmpty?: boolean;
}

export default function TodayQuestion({
  question,
  questionAssignmentId,
  questionInstanceId,
  isUserAssignment = false,
  isAnswered = false,
  isEmpty = false,
}: TodayQuestionProps) {
  const navigate = useNavigate();

  const handlePress = () => {
    if (questionAssignmentId && isUserAssignment && !isAnswered) {
      navigate(
        `/reply?questionAssignmentId=${encodeURIComponent(
          questionAssignmentId,
        )}&question=${encodeURIComponent(question)}`,
      );
    }
  };

  const handleViewAnswer = () => {
    if (questionInstanceId) {
      navigate(
        `/reply-detail?questionInstanceId=${encodeURIComponent(
          questionInstanceId,
        )}&question=${encodeURIComponent(question)}`,
      );
    } else if (questionAssignmentId) {
      navigate(
        `/reply-detail?questionInstanceId=${encodeURIComponent(
          questionAssignmentId,
        )}&question=${encodeURIComponent(question)}`,
      );
    }
  };

  const hasNoQuestion =
    isEmpty ||
    !question ||
    question.trim() === '' ||
    question === '질문이 없습니다' ||
    question === '새로운 질문을 기다려 주세요';

  const isActive =
    !hasNoQuestion &&
    isUserAssignment &&
    !!question &&
    !!questionAssignmentId &&
    !isAnswered &&
    question !== '오늘 하루 어떠셨나요?\n위로받고 싶은 일이 있었나요?';

  if (hasNoQuestion) {
    return (
      <div className="bg-white w-full p-8 rounded-3xl shadow-sm flex flex-col items-center justify-center min-h-[280px] gap-4">
        <div className="bg-orange-50 p-6 rounded-full">
          <MessageCircleIcon size={40} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="font-bold text-xl text-gray-800 text-center">
            새로운 질문을 기다려 주세요
          </div>
          <div className="bg-gray-50 px-4 py-2 rounded-full mt-1">
            <div className="text-gray-500 text-center text-sm font-medium">
              매일 밤 9시 30분에 질문이 도착해요 🌙
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
      <div className="flex flex-col items-center mb-6 px-2">
        <div
          className={`font-sans text-xl font-bold leading-8 text-center ${
            hasNoQuestion ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          <span className="text-orange-500">Q. </span>
          {hasNoQuestion ? '질문이 없습니다' : question}
        </div>
      </div>

      <div className="flex flex-col items-center w-full">
        {hasNoQuestion ? (
          <div className="font-sans text-center text-base text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
            새로운 질문을 기다려주세요 🌙
          </div>
        ) : isAnswered ? (
          <>
            <button
              type="button"
              onClick={handleViewAnswer}
              className="bg-orange-100 px-6 py-3 rounded-full active:opacity-70"
            >
              <span className="font-sans font-bold text-orange-600 text-base">
                {isUserAssignment ? '내 답변 보기' : '답변 보기'}
              </span>
            </button>
            {isUserAssignment && (
              <div className="font-sans text-center text-sm text-gray-400 mt-3">
                오늘 답변을 완료했어요! 🎉
              </div>
            )}
          </>
        ) : isUserAssignment ? (
          <button
            type="button"
            onClick={handlePress}
            className="bg-onsikku-dark-orange px-10 py-3.5 rounded-full shadow-sm active:opacity-70"
            aria-disabled={!isActive}
          >
            <span className="font-sans font-bold text-white text-base">
              답변하기
            </span>
          </button>
        ) : (
          <div className="bg-gray-100 px-6 py-3 rounded-full">
            <div className="font-sans font-bold text-gray-400 text-base">
              답변을 기다리고 있어요 ⏳
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
