import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";
import { getItem, setItem } from "@/utils/AsyncStorage";
import { setAccessToken, signup } from "@/utils/api";
import { getApiFamilyRole } from "@/utils/labels";

export default function FamilyCodePage() {
  const navigate = useNavigate();
  const {
    familyMode,
    setFamilyMode,
    familyName,
    setFamilyName,
    familyInvitationCode,
    setFamilyInvitationCode,
    role,
    grandParentType,
    gender,
    birthDate,
    nickname,
    uri,
    reset,
  } = useSignupStore();

  useEffect(() => {
    // basic guard
    if (!role || !gender || !birthDate || !nickname) {
      // user jumped here directly
    }
  }, [role, gender, birthDate, nickname]);

  const canSubmit = useMemo(() => {
    if (!role || !gender || !birthDate || !nickname) return false;
    if (familyMode === "CREATE") return !!familyName.trim();
    return !!familyInvitationCode.trim();
  }, [familyMode, familyName, familyInvitationCode, role, gender, birthDate, nickname]);

  const submit = async () => {
    try {
      const registrationToken = await getItem("registrationToken");
      if (!registrationToken) throw new Error("registrationToken이 없습니다. 다시 로그인해주세요.");

      if (!role || !gender) throw new Error("필수 정보가 누락되었습니다.");

      const apiFamilyRole = getApiFamilyRole(role, gender);

      const payload = {
        registrationToken,
        familyRole: apiFamilyRole,
        nickname, // Use user-input nickname
        birthDate, // yyyy-MM-dd
        profileImageUrl: uri,
        familyName: familyMode === "CREATE" ? familyName : undefined,
        familyInvitationCode: familyMode === "JOIN" ? familyInvitationCode : undefined,
        familyMode,
      } as const;

      const result = await signup(payload as any);

      if (result.accessToken) {
        await setItem("accessToken", result.accessToken);
        setAccessToken(result.accessToken);
      }
      if (result.refreshToken) {
        await setItem("refreshToken", result.refreshToken);
      }

      reset();
      navigate("/home", { replace: true });
    } catch (e: any) {
      alert(e?.message || "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 pb-6">
      <SignUpHeader
        title="가족에 합류할 시간이에요"
        description="새로운 가족 공간을 만들거나, 초대 코드로 기존 가족에 참여하세요."
        currentStep={3}
        totalSteps={3}
        showBackButton
      />

      <div className="mt-8 flex-1 space-y-6">
        {/* Segmented Control */}
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
              familyMode === "CREATE"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFamilyMode("CREATE")}
          >
            새로 만들기
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
              familyMode === "JOIN"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setFamilyMode("JOIN")}
          >
            참여하기
          </button>
        </div>

        {familyMode === "CREATE" ? (
          <div className="space-y-3 animate-fade-in-up">
            <label className="block text-sm font-bold text-gray-900">가족 이름</label>
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="예) 행복한 우리집"
              className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-lg font-medium outline-none focus:border-onsikku-dark-orange focus:bg-white transition-colors"
            />
            <p className="text-xs text-gray-500 pl-1">나중에 언제든 변경할 수 있어요.</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in-up">
            <label className="block text-sm font-bold text-gray-900">초대코드 입력</label>
            <input
              value={familyInvitationCode}
              onChange={(e) => setFamilyInvitationCode(e.target.value)}
              placeholder="전달받은 6자리 코드"
              className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-lg font-medium outline-none focus:border-onsikku-dark-orange focus:bg-white transition-colors"
            />
             <p className="text-xs text-gray-500 pl-1">가족 구성원에게 받은 코드를 입력해주세요.</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button className="w-full py-4 text-lg" disabled={!canSubmit} onClick={submit}>
          시작하기
        </Button>
      </div>
    </div>
  );
}
