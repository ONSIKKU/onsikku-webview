import { IoLogOutOutline } from 'react-icons/io5';

interface Props {
  onPress?: () => void;
}

export default function LogoutButton({ onPress }: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="bg-white w-full p-4 rounded-3xl shadow-sm flex flex-row items-center justify-center gap-2 active:opacity-70"
    >
      <IoLogOutOutline size={20} color="#F97315" />
      <span className="text-base font-medium text-orange-500">로그아웃</span>
    </button>
  );
}
