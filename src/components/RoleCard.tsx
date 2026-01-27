interface RoleCardProps {
  icon: string;
  roleName: string;
  isSelected: boolean;
  isPending?: boolean;
  isProtagonist?: boolean;
}

function CrownIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#F59E0B"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M3 7l4.5 4L12 5l4.5 6L21 7l-2.5 12H5.5L3 7z" />
      <path
        d="M5.5 19h13"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function RoleCard({
  icon,
  roleName,
  isSelected,
  isPending,
  isProtagonist,
}: RoleCardProps) {
  return (
    <div className="flex-1 flex flex-col justify-start items-center gap-1">
      <div
        className={`w-16 h-16 rounded-full flex justify-center items-center box-border relative
        ${
          isSelected
            ? 'bg-orange-100 border-2 border-orange-500'
            : isPending
              ? 'bg-white border-2 border-orange-300'
              : 'bg-gray-100'
        }
        `}
      >
        <span className="font-sans text-2xl">{icon}</span>
        {isProtagonist && (
          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-orange-100">
            <CrownIcon size={14} />
          </div>
        )}
      </div>
      <div
        className={`font-sans text-xs mt-1 ${
          isSelected || isPending
            ? 'text-orange-600 font-bold'
            : 'text-gray-400'
        }`}
      >
        {roleName}
      </div>
    </div>
  );
}
