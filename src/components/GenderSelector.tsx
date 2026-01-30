type Props = {
  value: "MALE" | "FEMALE" | null;
  onChange: (v: "MALE" | "FEMALE") => void;
};

export default function GenderSelector({ value, onChange }: Props) {
  const base =
    "flex-1 rounded-2xl border-2 py-4 text-base font-bold transition-all duration-200 outline-none";
  
  return (
    <div className="flex gap-4">
      <button
        type="button"
        className={`${base} ${
          value === "MALE"
            ? "border-onsikku-dark-orange bg-orange-50 text-onsikku-dark-orange ring-1 ring-onsikku-dark-orange"
            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50"
        }`}
        onClick={() => onChange("MALE")}
      >
        남성
      </button>
      <button
        type="button"
        className={`${base} ${
          value === "FEMALE"
            ? "border-onsikku-dark-orange bg-orange-50 text-onsikku-dark-orange ring-1 ring-onsikku-dark-orange"
            : "border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50"
        }`}
        onClick={() => onChange("FEMALE")}
      >
        여성
      </button>
    </div>
  );
}
