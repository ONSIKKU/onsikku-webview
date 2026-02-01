import ActivitySummary from '@/components/history/ActivitySummary';
import DateSelector from '@/components/history/DateSelector';
import QuestionList from '@/components/history/QuestionList';
import { getQuestionsByMonth, setAccessToken } from '@/utils/api';
import type { QuestionDetails } from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoArrowDownOutline, IoArrowUpOutline } from 'react-icons/io5';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Params as Source of Truth
  const paramYear = Number(searchParams.get('year'));
  const paramMonth = Number(searchParams.get('month'));

  const now = new Date();
  // Default to current date if params missing
  const selectedYear = paramYear > 0 ? paramYear : now.getFullYear();
  const selectedMonth = paramMonth > 0 ? paramMonth : now.getMonth() + 1;

  const [questions, setQuestions] = useState<QuestionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  // Temp state for modal remains local
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState(selectedMonth);

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Ensure URL always has params (for initial load consistency)
  useEffect(() => {
    if (!paramYear || !paramMonth) {
      setSearchParams({
        year: String(now.getFullYear()),
        month: String(now.getMonth() + 1),
      }, { replace: true });
    }
  }, [paramYear, paramMonth, setSearchParams]);

  // Helper to safely get date value for sorting
  const getDateValue = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const data = await getQuestionsByMonth(selectedYear, selectedMonth);
      const fetchedQuestions = data.questionDetails || [];

      // Sort questions
      const sortedQuestions = [...fetchedQuestions].sort((a, b) => {
        const dateA = getDateValue(a.sentAt || a.dueAt);
        const dateB = getDateValue(b.sentAt || b.dueAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

      setQuestions(sortedQuestions);
    } catch (e: any) {
      console.error('[월별 질문 조회 에러]', e);
      setError(e?.message || '질문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, sortOrder]);

  // Re-sort when sortOrder changes without re-fetching if data exists
  useEffect(() => {
    if (questions.length > 0) {
      const sorted = [...questions].sort((a, b) => {
        const dateA = getDateValue(a.sentAt || a.dueAt);
        const dateB = getDateValue(b.sentAt || b.dueAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
      if (sorted[0]?.questionInstanceId !== questions[0]?.questionInstanceId) {
        setQuestions(sorted);
      }
    }
  }, [sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const updateDate = (y: number, m: number) => {
    setSearchParams({ year: String(y), month: String(m) }, { replace: true });
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      updateDate(selectedYear - 1, 12);
    } else {
      updateDate(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const maxYear = now.getFullYear();
    const maxMonth = now.getMonth() + 1;

    if (
      selectedYear > maxYear ||
      (selectedYear === maxYear && selectedMonth >= maxMonth)
    ) {
      return; 
    }

    if (selectedMonth === 12) {
      updateDate(selectedYear + 1, 1);
    } else {
      updateDate(selectedYear, selectedMonth + 1);
    }
  };

  const handleQuestionPress = (
    questionAssignmentId: string,
    question: string,
    questionInstanceId?: string,
  ) => {
    if (!questionInstanceId) {
      console.warn(
        '[기록 페이지] questionInstanceId가 없어서 상세보기로 이동할 수 없습니다.',
      );
      return;
    }

    const params = new URLSearchParams({
      questionAssignmentId,
      question,
      questionInstanceId,
    });

    navigate(`/reply-detail?${params.toString()}`);
  };

  const openDatePicker = () => {
    setTempYear(selectedYear);
    setTempMonth(selectedMonth);
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    updateDate(tempYear, tempMonth);
    setShowDatePicker(false);
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const years = Array.from(
    { length: currentYear - 2024 + 1 },
    (_, i) => 2024 + i,
  );

  const maxMonth = tempYear === currentYear ? currentMonth : 12;
  const months = Array.from({ length: maxMonth }, (_, i) => i + 1);

  const isPrevDisabled = selectedYear === 2024 && selectedMonth === 1;
  const isNextDisabled =
    selectedYear > currentYear ||
    (selectedYear === currentYear && selectedMonth >= currentMonth);

  return (
    <div className="min-h-screen bg-orange-50 pb-10">
      <div className="mx-auto w-full px-5 pt-8 flex flex-col gap-6">
        <DateSelector
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDatePress={openDatePicker}
          disablePrev={isPrevDisabled}
          disableNext={isNextDisabled}
        />

        <ActivitySummary
          questions={questions}
          year={selectedYear}
          month={selectedMonth}
        />

        <div>
          <div className="flex flex-row items-center justify-between mb-4 px-1">
            <div className="font-sans font-bold text-xl text-gray-900">
              지난 질문들
            </div>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) =>
                  prev === 'newest' ? 'oldest' : 'newest',
                )
              }
              className="flex flex-row items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform"
            >
              {sortOrder === 'newest' ? (
                <IoArrowDownOutline size={14} className="text-gray-600" />
              ) : (
                <IoArrowUpOutline size={14} className="text-gray-600" />
              )}
              <div className="font-sans text-sm font-medium text-gray-600 ml-1.5">
                {sortOrder === 'newest' ? '최신순' : '오래된순'}
              </div>
            </button>
          </div>

          <QuestionList
            questions={questions}
            loading={loading}
            error={error}
            onQuestionPress={handleQuestionPress}
          />
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[60]">
          <div className="bg-white rounded-t-[30px] p-6 w-full animate-fade-in-up">
            <div className="flex flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <button type="button" onClick={() => setShowDatePicker(false)} className="active:opacity-70">
                <div className="text-gray-500 text-base font-medium">취소</div>
              </button>

              <div className="font-bold text-lg text-gray-900">날짜 선택</div>

              <button type="button" onClick={confirmDate} className="active:opacity-70">
                <div className="text-onsikku-dark-orange font-bold text-base">확인</div>
              </button>
            </div>

            <div className="flex flex-row justify-center items-center gap-4 mb-4">
              <div className="flex-1">
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 text-gray-900 text-lg font-medium outline-none focus:border-onsikku-dark-orange transition-colors"
                  value={tempYear}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTempYear(v);
                    if (v === currentYear && tempMonth > currentMonth) {
                      setTempMonth(currentMonth);
                    }
                  }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <select
                  className="w-full border border-gray-200 rounded-2xl p-4 text-gray-900 text-lg font-medium outline-none focus:border-onsikku-dark-orange transition-colors"
                  value={tempMonth}
                  onChange={(e) => setTempMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="h-6" /> 
          </div>
        </div>
      )}
    </div>
  );
}
