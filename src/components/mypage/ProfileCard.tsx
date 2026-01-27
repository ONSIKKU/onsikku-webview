import React from 'react';
import { getRoleIconAndText } from '@/utils/labels';

export default function ProfileCard({
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
    <div className="bg-white p-6 rounded-3xl shadow-sm flex flex-row items-center">
      <div className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center flex">
        <span className="text-3xl">{icon}</span>
      </div>

      <div className="ml-4">
        <div className="font-sans text-xl font-bold text-gray-900">{name}</div>
        <div className="font-sans text-sm text-gray-500 mt-1">{text}</div>
      </div>
    </div>
  );
}
