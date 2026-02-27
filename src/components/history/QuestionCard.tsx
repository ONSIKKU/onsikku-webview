import { IoChevronForwardOutline } from 'react-icons/io5';
import RoleIcon from '../RoleIcon';

export interface Question {
  id: string;
  date: string;
  author: string;
  authorAvatar: string;
  question: string;
  status: 'answered' | 'pending';
  isMine?: boolean;
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
      disabled={!onPress}
      className={`w-full p-5 rounded-3xl shadow-sm border border-gray-100 text-left active:scale-[0.98] transition-transform ${
        isPending ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-row items-center">
          <div className="font-sans text-base font-bold text-orange-500 mr-2">
            {item.date}
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden mr-1.5">
             <RoleIcon icon={item.authorAvatar} size={24} />
          </div>
          <div className="font-sans text-base text-gray-700">
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
          <>
            <div className="font-sans text-base text-gray-500">답변 대기 중</div>
            {item.isMine && onPress && (
              <div className="font-sans text-xs font-semibold text-onsikku-dark-orange bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
                답변하기
              </div>
            )}
          </>
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
