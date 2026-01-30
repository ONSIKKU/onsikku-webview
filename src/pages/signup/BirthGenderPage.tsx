import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import GenderSelector from "@/components/GenderSelector";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";

export default function BirthGenderPage() {
  const navigate = useNavigate();
  const { gender, setGender, birthDate, setBirthDate, nickname, setNickname } = useSignupStore();

  const [localBirth, setLocalBirth] = useState(birthDate || "");
  const [localNickname, setLocalNickname] = useState(nickname || "");

  const canNext = useMemo(() => {
    return !!gender && !!localBirth && !!localNickname.trim();
  }, [gender, localBirth, localNickname]);

  const saveAndNext = () => {
    setBirthDate(localBirth);
    setNickname(localNickname);
    navigate("/signup/family");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 pb-6">
      <SignUpHeader
        title="기본 정보를 입력해주세요"
        description="가족들에게 보여질 이름과 생년월일, 성별을 알려주세요."
        currentStep={2}
        totalSteps={3}
        showBackButton
      />

      <div className="mt-8 flex-1 space-y-8">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            닉네임
          </label>
          <input
            type="text"
            value={localNickname}
            onChange={(e) => setLocalNickname(e.target.value)}
            placeholder="예) 귀염둥이 막내"
            className="w-full appearance-none rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-lg font-medium text-gray-900 outline-none focus:border-onsikku-dark-orange focus:bg-white transition-colors"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            생년월일
          </label>
          <input
            type="date"
            value={localBirth}
            onChange={(e) => setLocalBirth(e.target.value)}
            className="w-full appearance-none rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-lg font-medium text-gray-900 outline-none focus:border-onsikku-dark-orange focus:bg-white transition-colors"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            성별
          </label>
          <GenderSelector value={gender} onChange={setGender} />
        </div>
      </div>

      <div className="mt-6">
        <Button
          className="w-full py-4 text-lg"
          disabled={!canNext}
          onClick={saveAndNext}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}
