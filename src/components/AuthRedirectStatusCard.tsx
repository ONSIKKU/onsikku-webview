import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';

type Props = {
  icon: ReactNode;
  idleTitle: string;
  idleDescription: string;
  cancelledTitle: string;
  cancelledDescription: string;
  retryLabel: string;
  isCancelled: boolean;
  onRetry: () => void;
};

export default function AuthRedirectStatusCard({
  icon,
  idleTitle,
  idleDescription,
  cancelledTitle,
  cancelledDescription,
  retryLabel,
  isCancelled,
  onRetry,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-orange-50 pt-safe">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 pb-safe pb-10">
        <div className="w-full rounded-[32px] bg-white p-7 text-center shadow-[0_20px_60px_rgba(251,146,60,0.16)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(251,146,60,0.2)] ring-1 ring-orange-100">
            {icon}
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-gray-900">
            {isCancelled ? cancelledTitle : idleTitle}
          </h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-500">
            {isCancelled ? cancelledDescription : idleDescription}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {isCancelled ? (
              <Button
                className="w-full py-4 text-base shadow-xl shadow-orange-100/50"
                onClick={onRetry}
              >
                {retryLabel}
              </Button>
            ) : (
              <div className="rounded-2xl bg-orange-50 px-4 py-4 text-sm font-medium text-onsikku-dark-orange">
                잠시만 기다려주세요
              </div>
            )}

            <Button
              className="w-full py-4 text-base"
              onClick={() => navigate('/', { replace: true })}
              variant="secondary"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
