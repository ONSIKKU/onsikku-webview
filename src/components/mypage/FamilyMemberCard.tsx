import React from 'react';
import { getRoleIconAndText } from '@/utils/labels';

export default function FamilyMemberCard({
  name,
  familyRole,
  gender,
}: {
  name: string;
  familyRole: any;
  gender: any;
}) {
  const { icon, text } = getRoleIconAndText(familyRole, gender);

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-row items-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center flex">
        <span className="text-xl">{icon}</span>
      </div>

      <div className="ml-3">
        <div className="font-sans text-base font-bold text-gray-900">
          {name}
        </div>
        <div className="font-sans text-xs text-gray-500 mt-0.5">{text}</div>
      </div>
    </div>
  );
}
