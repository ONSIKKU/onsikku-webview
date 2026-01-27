import { getRoleIconAndText } from '@/utils/labels';

interface Props {
  avatarUri: string;
  familyRole?: string | null;
  gender?: string | null;
}

export default function ProfileSection({
  avatarUri,
  familyRole,
  gender,
}: Props) {
  // RN 원본도 avatarUri 실제로 안 쓰고 icon만 표시함 (1:1 유지)
  const { icon } = getRoleIconAndText(familyRole, gender);

  return (
    <div className="items-center justify-center py-6">
      <div className="text-[100px] leading-none">{icon}</div>
    </div>
  );
}
