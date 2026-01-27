import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import GenderSelector from "@/components/GenderSelector";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";

export default function BirthGenderPage() {
  const navigate = useNavigate();
  const { gender, setGender, birthDate, setBirthDate } = useSignupStore();

  const [localBirth, setLocalBirth] = useState(birthDate || "");

  const canNext = useMemo(() => {
    return !!gender && !!localBirth;
  }, [gender, localBirth]);

  const saveAndNext = () => {
    setBirthDate(localBirth);
    navigate("/signup/image");
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <SignUpHeader title="생년월일과 성별을 알려주세요" />

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">생년월일</label>
        <input
          type="date"
          value={localBirth}
          onChange={(e) => setLocalBirth(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
        />
        <label className="block pt-4 text-sm font-semibold text-gray-900">성별</label>
        <GenderSelector value={gender} onChange={setGender} />
      </div>

      <Button className="w-full" disabled={!canNext} onClick={saveAndNext}>
        다음
      </Button>
    </div>
  );
}
