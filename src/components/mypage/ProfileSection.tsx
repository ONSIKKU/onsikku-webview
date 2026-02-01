import { getRoleIconAndText } from '@/utils/labels';
import RoleIcon from '@/components/RoleIcon';
import type { FamilyRole } from '@/utils/api';

interface Props {
  familyRole?: string | null;
  gender?: string | null;
}

export default function ProfileSection({
  familyRole,
  gender,
}: Props) {
  const { icon } = getRoleIconAndText(familyRole as FamilyRole, gender);

  return (
    <div className="flex items-center justify-center py-6">
      <RoleIcon icon={icon} size={100} />
    </div>
  );
}
