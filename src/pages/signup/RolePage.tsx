import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import SignUpHeader from '@/components/SignUpHeader';
import type { SignupRole } from '@/features/signup/signupStore';
import { useSignupStore } from '@/features/signup/signupStore';
import { User, Baby, Heart } from 'lucide-react';

type RoleItem = {
  role: SignupRole;
  label: string;
  desc: string;
  Icon: React.ElementType;
};

const ROLE_ITEMS: RoleItem[] = [
  { role: 'PARENT', label: '부모', desc: '엄마 또는 아빠예요', Icon: User },
  { role: 'CHILD', label: '자녀', desc: '아들 또는 딸이예요', Icon: Baby },
  {
    role: 'GRANDPARENT',
    label: '조부모',
    desc: '할머니 또는 할아버지예요',
    Icon: Heart,
  },
];

export default function RolePage() {
  const navigate = useNavigate();
  const { role, setRole, grandParentType, setGrandParentType } =
    useSignupStore();

  const isGrandparent = role === 'GRANDPARENT';
  const canNext = useMemo(() => {
    if (!role) return false;
    if (role !== 'GRANDPARENT') return true;
    return !!grandParentType;
  }, [role, grandParentType]);

  return (
    <div className="flex min-h-screen flex-col bg-white px-5 pb-6">
      <SignUpHeader
        title="어떤 역할을 맡고 계신가요?"
        description="가족 내 역할을 선택하면 맞춤 질문이 제공돼요."
        currentStep={1}
        totalSteps={3}
        showBackButton
      />

      <div className="mt-8 flex-1 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {ROLE_ITEMS.map((r) => {
            const isSelected = role === r.role;
            const Icon = r.Icon;
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => setRole(r.role)}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-onsikku-dark-orange bg-orange-50 ring-1 ring-onsikku-dark-orange'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                    isSelected
                      ? 'bg-onsikku-dark-orange text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}
                >
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div
                    className={`text-lg font-bold ${isSelected ? 'text-onsikku-dark-orange' : 'text-gray-900'}`}
                  >
                    {r.label}
                  </div>
                  <div className="text-sm text-gray-500">{r.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {isGrandparent && (
          <div className="animate-fade-in-down mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="mb-3 text-sm font-bold text-gray-900">
              어느 쪽 조부모님이신가요?
            </div>
            <div className="flex gap-3">
              {(['PATERNAL', 'MATERNAL'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGrandParentType(type)}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                    grandParentType === type
                      ? 'border-onsikku-dark-orange bg-white text-onsikku-dark-orange'
                      : 'border-transparent bg-white text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {type === 'PATERNAL' ? '친가' : '외가'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          className="w-full py-4 text-lg"
          disabled={!canNext}
          onClick={() => navigate('/signup/birth')}
        >
          다음으로
        </Button>
      </div>
    </div>
  );
}
