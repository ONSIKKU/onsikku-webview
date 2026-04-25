import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";
import { getItem, setItem } from "@/utils/AsyncStorage";
import { setAccessToken, signup } from "@/utils/api";
import type { SignupRequest } from "@/utils/api";
import { getApiFamilyRole } from "@/utils/labels";
import { useModalStore } from "@/features/modal/modalStore";

const normalizeInvitationCode = (value: string) =>
  value.replace(/\s/g, "").toUpperCase().slice(0, 8);

export default function FamilyCodePage() {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!role || !gender || !birthDate || !nickname) {
      navigate("/signup/agree", { replace: true });
    }
  }, [birthDate, gender, navigate, nickname, role]);

  const canSubmit = useMemo(() => {
    if (!role || !gender || !birthDate || !nickname.trim()) return false;
    if (familyMode === "CREATE") return !!familyName.trim();
    return normalizeInvitationCode(familyInvitationCode).length === 8;
  }, [familyMode, familyName, familyInvitationCode, role, gender, birthDate, nickname]);

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const registrationToken = await getItem("registrationToken");
      if (!registrationToken) throw new Error("registrationToken이 없습니다. 다시 로그인해주세요.");

      if (!role || !gender) throw new Error("필수 정보가 누락되었습니다.");

      const apiFamilyRole = getApiFamilyRole(role, gender);
      const trimmedNickname = nickname.trim();
      const trimmedFamilyName = familyName.trim();
      const normalizedInvitationCode = normalizeInvitationCode(familyInvitationCode);

      const payload: SignupRequest = {
        registrationToken,
        familyRole: apiFamilyRole,
        nickname: trimmedNickname,
        birthDate, 
        profileImageUrl: uri,
        familyName: familyMode === "CREATE" ? trimmedFamilyName : undefined,
        familyInvitationCode: familyMode === "JOIN" ? normalizedInvitationCode : undefined,
        familyMode,
      };

      const result = await signup(payload);

      if (result.accessToken) {
        await setItem("accessToken", result.accessToken);
        setAccessToken(result.accessToken);
      }
      if (result.refreshToken) {
        await setItem("refreshToken", result.refreshToken);
      }

      reset();
      navigate("/home", { replace: true });
    } catch (e: unknown) {
      openModal({
        content: e instanceof Error ? e.message : "회원가입에 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pt-safe">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-2 scrollbar-hide">
        <SignUpHeader
          title="가족에 합류할 시간이에요"
          description="새로운 가족 공간을 만들거나, 초대 코드로 기존 가족에 참여하세요."
          currentStep={5}
          totalSteps={5}
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
                onChange={(e) => setFamilyName(e.target.value.slice(0, 20))}
                maxLength={20}
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
                onChange={(e) => setFamilyInvitationCode(normalizeInvitationCode(e.target.value))}
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect="off"
                placeholder="전달받은 8자리 코드"
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-lg font-medium shadow-sm outline-none transition-all focus:border-onsikku-dark-orange focus:bg-white focus:ring-1 focus:ring-onsikku-dark-orange placeholder:text-gray-400"
              />
               <p className="text-xs text-gray-400 pl-2">가족 구성원에게 받은 코드를 입력해주세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="shrink-0 bg-white pb-safe pb-8 pt-4">
        <div className="mx-auto max-w-md px-5">
          <Button 
            className="w-full py-4 text-lg shadow-xl shadow-orange-100/50" 
            disabled={!canSubmit || isSubmitting}
            onClick={submit}
          >
            {isSubmitting ? "시작 중..." : "시작하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
