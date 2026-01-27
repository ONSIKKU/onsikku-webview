import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import ImageUploadBox from "@/components/ImageUploadBox";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";
import { getRoleIconAndText } from "@/utils/labels";

export default function ImagePage() {
  const navigate = useNavigate();
  const { role, uri, setUri } = useSignupStore();

  const title = useMemo(() => {
    const { roleText } = getRoleIconAndText(role);
    return roleText ? `${roleText} 프로필을 설정해요` : "프로필을 설정해요";
  }, [role]);

  return (
    <div className="space-y-6">
      <BackButton />
      <SignUpHeader title={title} description="선택은 선택사항이에요. 나중에 변경할 수도 있어요." />

      <ImageUploadBox uri={uri} onPick={(dataUrl) => setUri(dataUrl)} />

      <div className="space-y-2">
        <Button className="w-full" onClick={() => navigate("/signup/family")}>
          다음
        </Button>
        <button
          type="button"
          className="w-full text-sm text-gray-600 hover:opacity-80"
          onClick={() => navigate("/signup/family")}
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
