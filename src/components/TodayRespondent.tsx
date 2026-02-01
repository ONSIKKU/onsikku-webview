import type { Member, QuestionAssignment } from '@/utils/api';
import { getRoleIconAndText } from '@/utils/labels';
import RoleCard from './RoleCard';

interface TodayRespondentProps {
  members: Member[];
  assignments: QuestionAssignment[];
  currentUserId: string | null;
}

export default function TodayRespondent({
  members,
  assignments,
  currentUserId,
}: TodayRespondentProps) {
  return (
    <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
      <div className="font-sans font-bold text-gray-500 mb-4 ml-1">
        오늘의 주인공
      </div>

      <div className="flex flex-row justify-around items-start mb-2 gap-1 flex-wrap">
        {members.map((member) => {
          const assignment = assignments.find((a) => a.member.id === member.id);
          const isAnswered = assignment?.state === 'ANSWERED';
          const isAssigned = !!assignment;
          const isMe = member.id === currentUserId;
          const { icon, text, color } = getRoleIconAndText(
            member.familyRole,
            member.gender,
          );

          return (
            <div key={member.id} className="flex flex-col items-center min-w-[72px] mb-4 px-1">
              <RoleCard
                icon={icon}
                roleName={`${text}${isMe ? ' (나)' : ''}`}
                isSelected={!!isAnswered}
                isPending={isAssigned && !isAnswered}
                isProtagonist={isAssigned}
                color={color}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
