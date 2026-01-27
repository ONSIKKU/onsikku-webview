type Props = {
  value: "MALE" | "FEMALE" | null;
  onChange: (v: "MALE" | "FEMALE") => void;
};

export default function GenderSelector({ value, onChange }: Props) {
  const base = "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition";
  return (
    <div className="flex gap-3">
      <button
        type="button"
        className={`${base} ${value === "MALE" ? "border-onsikku-dark-orange bg-button-selected-light-orange" : "border-gray-200 bg-white"}`}
        onClick={() => onChange("MALE")}
      >
        남성
      </button>
      <button
        type="button"
        className={`${base} ${value === "FEMALE" ? "border-onsikku-dark-orange bg-button-selected-light-orange" : "border-gray-200 bg-white"}`}
        onClick={() => onChange("FEMALE")}
      >
        여성
      </button>
    </div>
  );
}
