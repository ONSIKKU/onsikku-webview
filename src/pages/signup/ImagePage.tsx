import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import ImageUploadBox from "@/components/ImageUploadBox";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";

export default function ImagePage() {
  const navigate = useNavigate();
  const { role, uri, setUri } = useSignupStore();

  const title = useMemo(() => {
    let roleText = '';
    if (role === 'PARENT') roleText = '부모님';
    else if (role === 'CHILD') roleText = '자녀';
    else if (role === 'GRANDPARENT') roleText = '조부모님';
    return roleText ? `${roleText} 프로필을 설정해요` : "프로필을 설정해요";
  }, [role]);

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 pb-6">
      <SignUpHeader
        title={title}
        description="사진을 등록하면 가족들이 나를 더 쉽게 알아볼 수 있어요."
        currentStep={3}
        totalSteps={4}
        showBackButton
      />

      <div className="mt-8 flex flex-1 flex-col items-center justify-center space-y-8">
        <ImageUploadBox uri={uri} onPick={(dataUrl) => setUri(dataUrl)} />
        <p className="text-center text-sm text-gray-500">
          터치하여 사진을 변경할 수 있어요
        </p>
      </div>

      <div className="mt-6 space-y-3">
        <Button className="w-full py-4 text-lg" onClick={() => navigate("/signup/family")}>
          {uri ? "다음으로" : "건너뛰기"}
        </Button>
      </div>
    </div>
  );
}
