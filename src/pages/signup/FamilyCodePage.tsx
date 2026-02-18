import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";
import { getItem, setItem } from "@/utils/AsyncStorage";
import { setAccessToken, signup } from "@/utils/api";
import { getApiFamilyRole } from "@/utils/labels";
import { useModalStore } from "@/features/modal/modalStore";

export default function FamilyCodePage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const {
    familyMode,
    setFamilyMode,
    familyName,
    setFamilyName,
    familyInvitationCode,
    setFamilyInvitationCode,
    role,
    gender,
    birthDate,
    nickname,
    uri,
    reset,
  } = useSignupStore();

  useEffect(() => {
    // Basic guard: if store is empty, user might have refreshed or accessed directly
    if (!role || !gender || !birthDate || !nickname) {
       // Ideally redirect to start of flow
       // navigate('/signup/role');
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
        nickname, 
        birthDate, 
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
      openModal({ content: e?.message || "회원가입에 실패했습니다." });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 pt-2 scrollbar-hide">
        <SignUpHeader
          title="가족에 합류할 시간이에요"
          description="새로운 가족 공간을 만들거나, 초대 코드로 기존 가족에 참여하세요."
          currentStep={3}
          totalSteps={3}
          showBackButton
        />

        <div className="mt-8 space-y-6">
          {/* Segmented Control */}
          <div className="flex rounded-2xl bg-gray-100 p-1.5 h-14 relative">
             {/* Animated Background for selected tab could be implemented here, but simplistic approach for now */}
            <button
              type="button"
              className={`flex-1 rounded-xl text-sm font-bold transition-all duration-200 z-10 ${
                familyMode === "CREATE"
                  ? "bg-white text-gray-900 shadow-sm scale-100"
                  : "text-gray-500 hover:text-gray-600 scale-95"
              }`}
              onClick={() => setFamilyMode("CREATE")}
            >
              새로 만들기
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl text-sm font-bold transition-all duration-200 z-10 ${
                familyMode === "JOIN"
                  ? "bg-white text-gray-900 shadow-sm scale-100"
                  : "text-gray-500 hover:text-gray-600 scale-95"
              }`}
              onClick={() => setFamilyMode("JOIN")}
            >
              참여하기
            </button>
          </div>

          {familyMode === "CREATE" ? (
            <div className="space-y-3 animate-fade-in-up">
              <label className="block text-sm font-bold text-gray-900 ml-1">가족 이름</label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="예) 행복한 우리집"
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-lg font-medium shadow-sm outline-none transition-all focus:border-onsikku-dark-orange focus:bg-white focus:ring-1 focus:ring-onsikku-dark-orange placeholder:text-gray-400"
              />
              {/* <p className="text-xs text-gray-400 pl-2">나중에 언제든 변경할 수 있어요.</p> */}
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-up">
              <label className="block text-sm font-bold text-gray-900 ml-1">초대코드 입력</label>
              <input
                value={familyInvitationCode}
                onChange={(e) => setFamilyInvitationCode(e.target.value.slice(0, 8))}
                maxLength={8}
                placeholder="전달받은 8자리 코드"
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-lg font-medium shadow-sm outline-none transition-all focus:border-onsikku-dark-orange focus:bg-white focus:ring-1 focus:ring-onsikku-dark-orange placeholder:text-gray-400"
              />
               <p className="text-xs text-gray-400 pl-2">가족 구성원에게 받은 코드를 입력해주세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent pb-8 pt-4">
        <div className="mx-auto max-w-md px-5">
          <Button 
            className="w-full py-4 text-lg shadow-xl shadow-orange-100/50" 
            disabled={!canSubmit} 
            onClick={submit}
          >
            시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}