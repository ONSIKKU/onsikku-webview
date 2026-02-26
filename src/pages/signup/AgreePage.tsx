import { Browser } from '@capacitor/browser';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import SignUpHeader from '@/components/SignUpHeader';
import type { SignupAgreementKey } from '@/features/signup/signupStore';
import { useSignupStore } from '@/features/signup/signupStore';

const TERMS_URL =
  'https://vast-watchmaker-4b0.notion.site/302e26932b5480b88783f333370ee19d';

const REQUIRED_KEYS: SignupAgreementKey[] = [
  'age14',
  'terms',
  'privacy',
];

const ITEMS: Array<{
  key: SignupAgreementKey;
  label: string;
  required: boolean;
  reason: string;
  hasLink?: boolean;
}> = [
  {
    key: 'age14',
    label: '만 14세 이상입니다.',
    required: true,
    reason: '서비스 이용 연령 요건',
  },
  {
    key: 'terms',
    label: '서비스 이용약관 동의',
    required: true,
    reason: '운영자와 이용자 간의 계약',
    hasLink: true,
  },
  {
    key: 'privacy',
    label: '개인정보 수집 및 이용 동의',
    required: true,
    reason: '회원가입 및 서비스 제공을 위한 정보 처리',
    hasLink: true,
  },
  {
    key: 'marketing',
    label: '마케팅 알림(푸시) 수신 동의',
    required: false,
    reason: '광고 및 이벤트 알림 전송용',
  },
];

export default function AgreePage() {
  const navigate = useNavigate();
  const { agreements, setAgreement, setAllAgreements } = useSignupStore();

  const isRequiredDone = useMemo(
    () => REQUIRED_KEYS.every((key) => agreements[key]),
    [agreements],
  );

  const isAllChecked = useMemo(
    () => ITEMS.every((item) => agreements[item.key]),
    [agreements],
  );

  const openTerms = async () => {
    await Browser.open({ url: TERMS_URL, presentationStyle: 'fullscreen' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-5 pb-32 pt-2 scrollbar-hide">
        <SignUpHeader
          title="회원가입 동의"
          description="가입 전 필수 약관 동의가 필요해요."
          currentStep={1}
          totalSteps={4}
        />

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => setAllAgreements(!isAllChecked)}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={() => setAllAgreements(!isAllChecked)}
                className="h-5 w-5 accent-onsikku-dark-orange"
              />
              <span className="text-base font-bold text-gray-900">
                전체 동의
              </span>
            </div>
          </button>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="space-y-4">
              {ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={agreements[item.key]}
                      onChange={(e) => setAgreement(item.key, e.target.checked)}
                      className="mt-1 h-5 w-5 accent-onsikku-dark-orange"
                    />
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-900">
                        {item.label}{' '}
                        <span className="text-xs font-medium text-gray-500">
                          {item.required ? '(필수)' : '(선택)'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{item.reason}</p>
                    </div>
                  </label>

                  {item.hasLink && (
                    <button
                      type="button"
                      onClick={openTerms}
                      className="mt-0.5 inline-flex items-center text-xs font-semibold text-gray-500"
                    >
                      보기
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent pb-8 pt-4">
        <div className="mx-auto max-w-md px-5">
          <Button
            className="w-full py-4 text-lg shadow-xl shadow-orange-100/50"
            disabled={!isRequiredDone}
            onClick={() => navigate('/signup/role')}
          >
            다음으로
          </Button>
        </div>
      </div>
    </div>
  );
}
