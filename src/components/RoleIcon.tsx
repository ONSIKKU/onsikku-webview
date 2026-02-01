interface RoleIconProps {
  icon: string;
  size?: number;
  className?: string;
}

export default function RoleIcon({ icon, size = 32, className = '' }: RoleIconProps) {
  // Simple heuristic: emojis are short, image paths are long/contain extension
  const isImage = icon.length > 5 || icon.includes('/') || icon.includes('.');

  if (isImage) {
    return (
      <img
        src={icon}
        alt="role icon"
        style={{ width: size, height: size }}
        className={`object-contain ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <span
      style={{ fontSize: size * 0.8, lineHeight: 1 }}
      className={`flex items-center justify-center ${className}`}
    >
      {icon}
    </span>
  );
}
