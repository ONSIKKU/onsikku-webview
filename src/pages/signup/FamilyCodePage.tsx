import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";
import { getItem, setItem } from "@/utils/AsyncStorage";
import { setAccessToken, signup } from "@/utils/api";

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
    uri,
    reset,
  } = useSignupStore();

  useEffect(() => {
    // basic guard
    if (!role || !gender || !birthDate) {
      // user jumped here directly
    }
  }, [role, gender, birthDate]);

  const canSubmit = useMemo(() => {
    if (!role || !gender || !birthDate) return false;
    if (familyMode === "CREATE") return !!familyName.trim();
    return !!familyInvitationCode.trim();
  }, [familyMode, familyName, familyInvitationCode, role, gender, birthDate]);

  const submit = async () => {
    try {
      const registrationToken = await getItem("registrationToken");
      if (!registrationToken) throw new Error("registrationToken이 없습니다. 다시 로그인해주세요.");

      const payload = {
        registrationToken,
        familyRole: role,
        grandParentType: role === "GRANDPARENT" ? grandParentType : null,
        gender,
        birthDate, // yyyy-MM-dd
        profileImageUrl: uri,
        familyName: familyMode === "CREATE" ? familyName : "",
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
    <div className="space-y-6">
      <BackButton />
      <SignUpHeader
        title="가족에 참여해요"
        description="새 가족을 만들거나, 초대코드로 기존 가족에 참여할 수 있어요."
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={
            "rounded-2xl border px-4 py-3 text-sm font-semibold " +
            (familyMode === "CREATE"
              ? "border-onsikku-dark-orange bg-button-selected-light-orange"
              : "border-gray-200 bg-white")
          }
          onClick={() => setFamilyMode("CREATE")}
        >
          가족 만들기
        </button>
        <button
          type="button"
          className={
            "rounded-2xl border px-4 py-3 text-sm font-semibold " +
            (familyMode === "JOIN"
              ? "border-onsikku-dark-orange bg-button-selected-light-orange"
              : "border-gray-200 bg-white")
          }
          onClick={() => setFamilyMode("JOIN")}
        >
          참여하기
        </button>
      </div>

      {familyMode === "CREATE" ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">가족 이름</label>
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="예) 우리집"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-900">초대코드</label>
          <input
            value={familyInvitationCode}
            onChange={(e) => setFamilyInvitationCode(e.target.value)}
            placeholder="6자리 코드"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
          />
        </div>
      )}

      <Button className="w-full" disabled={!canSubmit} onClick={submit}>
        완료
      </Button>
    </div>
  );
}
