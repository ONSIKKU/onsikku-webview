import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function BackButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={`inline-flex items-center justify-center p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition ${className}`}
      aria-label="뒤로 가기"
    >
      <ChevronLeft size={24} />
    </button>
  );
}
