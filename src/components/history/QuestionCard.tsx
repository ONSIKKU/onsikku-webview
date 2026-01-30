import React from 'react';
import { IoChevronForwardOutline } from 'react-icons/io5';

export interface Question {
  id: string;
  date: string;
  author: string;
  authorAvatar: string;
  question: string;
  status: 'answered' | 'pending';
  questionAssignmentId?: string;
  questionInstanceId?: string;
  reactions?: {
    heart: number;
    like: number;
    smile: number;
  };
}

const Reaction = ({ icon, count }: { icon: any; count: number }) => (
  <div className="flex flex-row items-center mr-3">
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span className="font-sans text-sm text-gray-500 ml-1">{count}</span>
  </div>
);

export default function QuestionCard({
  item,
  onPress,
}: {
  item: Question;
  onPress?: () => void;
}) {
  const isPending = item.status === 'pending';

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={isPending || !onPress}
      className={`w-full p-5 rounded-2xl shadow-sm border border-gray-100 text-left ${
        isPending ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-row items-center">
          <div className="font-sans text-base font-bold text-orange-500 mr-2">
            {item.date}
          </div>
          <span style={{ fontSize: 18 }}>{item.authorAvatar}</span>
          <div className="font-sans text-base text-gray-700 ml-1">
            {item.author}
          </div>
        </div>

        {!isPending && (
          <IoChevronForwardOutline size={20} className="text-gray-300" />
        )}
      </div>

      <div className="font-sans text-base text-gray-900 my-3 leading-relaxed">
        {item.question}
      </div>

      <div className="flex flex-row items-center justify-between mt-2">
        {isPending ? (
          <div className="font-sans text-base text-gray-500">답변 대기 중</div>
        ) : (
          <div className="font-sans text-base font-semibold text-onsikku-dark-orange">
            답변 완료
          </div>
        )}

        {!isPending && (
          <div className="flex flex-row">
            {!!item.reactions && (
              <>
                {item.reactions.heart > 0 && (
                  <Reaction icon="❤️" count={item.reactions.heart} />
                )}
                {item.reactions.like > 0 && (
                  <Reaction icon="👍" count={item.reactions.like} />
                )}
                {item.reactions.smile > 0 && (
                  <Reaction icon="😀" count={item.reactions.smile} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
