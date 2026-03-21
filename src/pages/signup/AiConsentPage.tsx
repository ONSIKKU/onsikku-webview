import { ChevronRight } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import SignUpHeader from '@/components/SignUpHeader';
import { useSignupStore } from '@/features/signup/signupStore';
import { saveConsentPreferences } from '@/utils/consentPreferences';
import { AI_VENDOR_NAME } from '@/utils/legal';

const DATA_ITEMS = [
  '가족 내 역할',
  '닉네임',
  '생년월일',
  '성별',
  '가족 이름',
  '가족 구성원 정보',
  '이전 답변 및 새로 작성한 답변',
] as const;

const PURPOSE_ITEMS = [
  '가족 구성원과 맥락에 맞는 질문 생성',
  '이전 답변을 반영한 개인화된 질문 추천',
  '가족 관계와 역할에 맞는 표현 조정',
] as const;

export default function AiConsentPage() {
  const navigate = useNavigate();
  const { agreements, setAgreement } = useSignupStore();

  const canNext = useMemo(() => agreements.aiDataUsage, [agreements.aiDataUsage]);

  useEffect(() => {
    saveConsentPreferences({
      aiDataUsage: agreements.aiDataUsage,
    });
  }, [agreements.aiDataUsage]);

  return (
    <div className="flex min-h-screen flex-col bg-white pt-safe">
      <div className="flex-1 overflow-y-auto px-5 pb-40 pt-2 scrollbar-hide">
        <SignUpHeader
          title="AI 정보 활용 동의"
          description={
            '맞춤형 질문 제공을 위해 일부 정보를 외부 AI 서비스에 전달할 수 있어요.\n전달 항목과 목적을 확인한 뒤 동의해주세요.'
          }
          currentStep={2}
          totalSteps={5}
          showBackButton
        />

        <div className="mt-8 space-y-4">
          <section className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <div className="text-sm font-bold text-onsikku-dark-orange">
              제공받는 자
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {AI_VENDOR_NAME}
            </p>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-base font-bold text-gray-900">
              AI 서비스에 전달될 수 있는 정보
            </div>
            <div className="mt-4 space-y-3">
              {DATA_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-onsikku-dark-orange" />
                  <p className="text-sm leading-6 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="text-base font-bold text-gray-900">활용 목적</div>
            <div className="mt-4 space-y-3">
              {PURPOSE_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <ChevronRight
                    size={16}
                    className="mt-1 shrink-0 text-onsikku-dark-orange"
                  />
                  <p className="text-sm leading-6 text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
            <div className="text-base font-bold text-gray-900">이용 안내</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
              <p>입력하신 정보는 맞춤형 질문 생성 및 추천에 필요한 범위 내에서만 활용됩니다.</p>
              <p>민감한 개인정보나 원치 않는 내용은 답변에 입력하지 않도록 주의해주세요.</p>
              <p>자세한 내용은 개인정보처리방침에서 확인할 수 있습니다.</p>
            </div>
          </section>

          <label className="flex cursor-pointer items-start gap-3 rounded-3xl border-2 border-gray-100 bg-white p-5 shadow-sm">
            <input
              type="checkbox"
              checked={agreements.aiDataUsage}
              onChange={(e) => setAgreement('aiDataUsage', e.target.checked)}
              className="mt-1 h-5 w-5 accent-onsikku-dark-orange"
            />
            <div>
              <div className="text-sm font-bold text-gray-900">
                AI 맞춤 질문 제공을 위한 정보 활용에 동의합니다.{' '}
                <span className="text-xs font-medium text-gray-500">(필수)</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                가족 역할, 프로필 정보, 가족 구성원 정보, 이전 답변 및 새 답변이
                외부 AI 서비스로 전달되어 질문 생성에 활용될 수 있음에 동의합니다.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent pb-safe pb-8 pt-4">
        <div className="mx-auto max-w-md px-5">
          <Button
            className="w-full py-4 text-lg shadow-xl shadow-orange-100/50"
            disabled={!canNext}
            onClick={() => navigate('/signup/role')}
          >
            다음으로
          </Button>
        </div>
      </div>
    </div>
  );
}
