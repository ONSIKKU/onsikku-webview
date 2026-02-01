import RoleIcon from './RoleIcon';

interface RoleCardProps {
  icon: string;
  roleName: string;
  isSelected: boolean;
  isPending?: boolean;
  isProtagonist?: boolean;
  color?: string;
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
  color = '#FB923C', // Default orange
}: RoleCardProps) {
  // Border logic
  const hasBorder = isSelected || isPending;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 relative flex items-center justify-center">
        {/* Actual Icon */}
        <RoleIcon icon={icon} size={64} />

        {/* Highlight Ring (Overlaid on top of icon) */}
        {hasBorder && (
          <div
            className="absolute w-[60px] h-[60px] rounded-full pointer-events-none transition-all duration-300"
            style={{
              border: `2px solid ${color}`,
              opacity: isPending ? 0.6 : 1,
              zIndex: 5,
            }}
          />
        )}

        {/* Protagonist Crown */}
        {isProtagonist && (
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md border border-orange-100 z-10">
            <CrownIcon size={16} />
          </div>
        )}
      </div>

      <div
        className={`font-sans text-[11px] mt-1 text-center whitespace-nowrap transition-colors ${
          isSelected || isPending ? 'font-bold' : 'text-gray-400 font-medium'
        }`}
        style={{ color: hasBorder ? color : undefined }}
      >
        {roleName}
      </div>
    </div>
  );
}
