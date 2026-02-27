type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton-base rounded-md ${className}`.trim()} />;
}
