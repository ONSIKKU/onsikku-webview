import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getItem } from '@/utils/AsyncStorage';
import { createAnswer, setAccessToken } from '@/utils/api';

const MAX_LEN = 500;

function ArrowBackIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="#374151"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22 2L11 13"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22l-4-9-9-4 20-7Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReplyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const questionAssignmentId = query.get('questionAssignmentId') || '';
  const question = query.get('question') || '질문 정보가 없습니다.';

  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // RN과 동일하게 별도 작업 없음
  }, []);

  const canSubmit = reply.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    try {
      if (!questionAssignmentId) {
        alert('질문 할당 정보가 없습니다.');
        return;
      }
      if (!reply.trim()) {
        alert('답변을 입력해주세요.');
        return;
      }
      setSubmitting(true);

      const token = await getItem('accessToken');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/', { replace: true });
        return;
      }
      setAccessToken(token);

      await createAnswer({
        questionAssignmentId,
        answerType: 'TEXT',
        content: reply.trim(),
      });

      alert('답변이 등록되었습니다.');
      navigate(-1);
    } catch (e: any) {
      console.error('[답변 등록 에러]', e);
      alert(e?.message || '답변 등록에 실패했습니다.');
      // RN 코드처럼 403/401 느낌이면 마이페이지로 유도
      navigate('/mypage', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="mx-auto w-full max-w-md px-5 pt-4 pb-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="px-0 py-2 flex-row items-center mb-4 flex">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm mr-4"
          >
            <ArrowBackIcon size={24} />
          </button>
          <div className="font-sans text-xl font-bold text-gray-900">
            답변 작성
          </div>
        </div>

        {/* Question */}
        <div className="relative items-center mb-6 mt-2 px-2">
          <div className="font-sans text-2xl font-bold leading-9 text-center text-gray-900">
            <span className="text-orange-500">Q. </span>
            {question}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white rounded-3xl p-5 shadow-sm flex-1 flex flex-col">
          <textarea
            className="w-full flex-1 min-h-[260px] resize-none bg-transparent font-sans text-base text-gray-900 outline-none"
            placeholder="답변을 입력해주세요..."
            value={reply}
            maxLength={MAX_LEN}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <div className="font-sans text-xs text-gray-400">
              {reply.length}/{MAX_LEN}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-4">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`w-full rounded-2xl py-4 flex items-center justify-center gap-2 shadow-sm ${
              canSubmit ? 'bg-onsikku-dark-orange' : 'bg-gray-200'
            }`}
          >
            <span className="font-sans font-bold text-white text-base">
              {submitting ? '등록 중...' : '답변 등록하기'}
            </span>
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
