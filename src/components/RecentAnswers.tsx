interface RecentAnswersProps {
  roleName: string;
  date: string;
  content: string;
  roleIcon: string;
  onPress?: () => void;
}

export default function RecentAnswers({
  roleName,
  date,
  content,
  roleIcon,
  onPress,
}: RecentAnswersProps) {
  return (
    <button
      type="button"
      className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 text-left w-full active:opacity-70"
      onClick={onPress}
    >
      <div className="flex flex-row items-center justify-between mb-3">
        <div className="flex flex-row items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-base">{roleIcon}</span>
          </div>
          <span className="font-medium text-gray-800">{roleName}</span>
        </div>
        <span className="text-xs text-gray-500">{date}</span>
      </div>

      <p
        className="font-sans text-sm text-gray-700 leading-5"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {content}
      </p>
    </button>
  );
}
