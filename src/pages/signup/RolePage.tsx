import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import SignUpHeader from "@/components/SignUpHeader";
import { useSignupStore } from "@/features/signup/signupStore";

type Role = "PARENT" | "CHILD" | "GRANDPARENT";

const ROLE_ITEMS: { role: Role; label: string; desc: string }[] = [
  { role: "PARENT", label: "부모", desc: "엄마 또는 아빠예요" },
  { role: "CHILD", label: "자녀", desc: "아들 또는 딸이예요" },
  { role: "GRANDPARENT", label: "조부모", desc: "할머니 또는 할아버지예요" },
];

export default function RolePage() {
  const navigate = useNavigate();
  const { role, setRole, grandParentType, setGrandParentType } = useSignupStore();

  const isGrandparent = role === "GRANDPARENT";
  const canNext = useMemo(() => {
    if (!role) return false;
    if (role !== "GRANDPARENT") return true;
    return !!grandParentType;
  }, [role, grandParentType]);

  return (
    <div className="space-y-6">
      <BackButton />
      <SignUpHeader title="역할을 선택해주세요" description="가족 내 역할을 선택하면 맞춤 질문이 제공돼요." />

      <div className="space-y-3">
        {ROLE_ITEMS.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => setRole(r.role)}
            className={
              "w-full rounded-2xl border p-4 text-left transition " +
              (role === r.role
                ? "border-onsikku-dark-orange bg-button-selected-light-orange"
                : "border-gray-200 bg-white hover:bg-gray-50")
            }
          >
            <div className="text-base font-bold text-gray-900">{r.label}</div>
            <div className="mt-1 text-sm text-gray-600">{r.desc}</div>
          </button>
        ))}
      </div>

      {isGrandparent ? (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">조부모 유형</div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGrandParentType("PATERNAL")}
              className={
                "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold " +
                (grandParentType === "PATERNAL"
                  ? "border-onsikku-dark-orange bg-button-selected-light-orange"
                  : "border-gray-200 bg-white")
              }
            >
              친가
            </button>
            <button
              type="button"
              onClick={() => setGrandParentType("MATERNAL")}
              className={
                "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold " +
                (grandParentType === "MATERNAL"
                  ? "border-onsikku-dark-orange bg-button-selected-light-orange"
                  : "border-gray-200 bg-white")
              }
            >
              외가
            </button>
          </div>
        </div>
      ) : null}

      <Button className="w-full" disabled={!canNext} onClick={() => navigate("/signup/birth")}>
        다음
      </Button>
    </div>
  );
}
