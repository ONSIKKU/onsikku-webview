import { useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-sm text-gray-700 hover:opacity-80"
    >
      <span aria-hidden>←</span>
      뒤로
    </button>
  );
}
