import { useEffect, useState } from 'react';
import {
  IoCheckmarkCircle,
  IoChevronForward,
  IoClose,
  IoDocumentTextOutline,
  IoMailOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import {
  getConsentPreferences,
  type ConsentPreferences,
} from '@/utils/consentPreferences';
import {
  AI_VENDOR_NAME,
  CONTACT_EMAIL,
  PRIVACY_URL,
  TERMS_URL,
} from '@/utils/legal';
import { openSystemBrowser } from '@/utils/systemBrowser';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const DEFAULT_CONSENTS: ConsentPreferences = {
  terms: false,
  privacy: false,
  aiDataUsage: false,
  marketing: false,
};

function StatusChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {label}
    </span>
  );
}

export default function ConsentManagementModal({ isOpen, onClose }: Props) {
  const [consents, setConsents] = useState<ConsentPreferences>(DEFAULT_CONSENTS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    getConsentPreferences().then(setConsents);
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!isOpen) return null;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-4 animate-fade-in sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] animate-slide-up">
        <div className="flex items-center justify-between border-b border-orange-50 px-5 pb-4 pt-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">동의 및 약관 관리</h2>
            <p className="mt-1 text-sm text-gray-500">
              가입 시 동의한 항목과 관련 문서를 확인할 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100"
            aria-label="닫기"
          >
            <IoClose size={22} />
          </button>
        </div>

        <div className="max-h-[80vh] space-y-4 overflow-y-auto px-5 py-5">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <IoDocumentTextOutline
                size={18}
                className="text-onsikku-dark-orange"
              />
              <h3 className="text-base font-bold text-gray-900">필수 약관</h3>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => openSystemBrowser(TERMS_URL)}
                className="flex w-full items-center justify-between rounded-2xl bg-gray-50 px-4 py-4 text-left"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    서비스 이용약관
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    가입 시 필수 동의
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    active={consents.terms}
                    label={consents.terms ? '동의 완료' : '미확인'}
                  />
                  <IoChevronForward size={18} className="text-gray-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => openSystemBrowser(PRIVACY_URL)}
                className="flex w-full items-center justify-between rounded-2xl bg-gray-50 px-4 py-4 text-left"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    개인정보처리방침
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    수집 항목, 이용 목적, 보관 기간 확인
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    active={consents.privacy}
                    label={consents.privacy ? '동의 완료' : '미확인'}
                  />
                  <IoChevronForward size={18} className="text-gray-400" />
                </div>
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <IoShieldCheckmarkOutline
                size={18}
                className="text-onsikku-dark-orange"
              />
              <h3 className="text-base font-bold text-gray-900">
                AI 정보 활용 동의
              </h3>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/90 px-4 py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  제3자 AI 사업자
                </div>
                <div className="mt-1 text-xs leading-5 text-gray-500">
                  {AI_VENDOR_NAME}에 가족 역할, 닉네임, 생년월일, 성별, 가족
                  정보, 이전 답변 및 새 답변이 전달되어 맞춤 질문 생성에 활용될
                  수 있어요.
                </div>
              </div>
              <StatusChip
                active={consents.aiDataUsage}
                label={consents.aiDataUsage ? '동의 완료' : '미동의'}
              />
            </div>

            <div className="mt-3 rounded-2xl bg-white/80 px-4 py-4 text-xs leading-5 text-gray-600">
              동의 내용 변경이나 철회가 필요하면 문의 메일로 요청해주세요.
              요청이 접수되면 관련 절차에 따라 확인 후 안내해드려요. 회원 탈퇴 시에는
              소셜 로그인 연동도 함께 해제됩니다.
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <IoCheckmarkCircle
                size={18}
                className="text-onsikku-dark-orange"
              />
              <h3 className="text-base font-bold text-gray-900">선택 동의</h3>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  마케팅 알림(푸시)
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  이벤트 및 소식 안내에 대한 선택 동의 상태예요.
                </div>
              </div>
              <StatusChip
                active={consents.marketing}
                label={consents.marketing ? '수신 동의' : '미동의'}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <IoMailOutline size={18} className="text-onsikku-dark-orange" />
              <h3 className="text-base font-bold text-gray-900">
                문의 및 동의 변경 요청
              </h3>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-4">
              <div className="text-sm font-semibold text-gray-900">문의 메일</div>
              <div className="mt-1 break-all text-sm text-gray-600">
                {CONTACT_EMAIL}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs leading-5 text-gray-500">
                  개인정보 처리, AI 동의 철회, 삭제 요청은 위 메일로 접수할 수
                  있어요.
                </p>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-onsikku-dark-orange shadow-sm"
                >
                  {copied ? '복사됨' : '이메일 복사'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
