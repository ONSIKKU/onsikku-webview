import ActivitySummary from '@/components/history/ActivitySummary';
import DateSelector from '@/components/history/DateSelector';
import QuestionList from '@/components/history/QuestionList';
import { getQuestionsByMonth, setAccessToken } from '@/utils/api';
import type { QuestionDetails } from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowDownOutline, IoArrowUpOutline } from 'react-icons/io5';

export default function HistoryPage() {
  const navigate = useNavigate();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [questions, setQuestions] = useState<QuestionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false); // RN 유지(웹 UI에는 노출 X)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState(selectedMonth);

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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
        const dateA = new Date(a.sentAt || a.dueAt || '').getTime();
        const dateB = new Date(b.sentAt || b.dueAt || '').getTime();
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
        const dateA = new Date(a.sentAt || a.dueAt || '').getTime();
        const dateB = new Date(b.sentAt || b.dueAt || '').getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
      // Only update if order actually changed to avoid infinite loop
      // Simple check: compare first element IDs
      if (sorted[0]?.questionInstanceId !== questions[0]?.questionInstanceId) {
        setQuestions(sorted);
      }
    }
  }, [sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchQuestions();
    } catch (e) {
      console.error('새로고침 실패', e);
    } finally {
      setRefreshing(false);
    }
  }, [fetchQuestions]);
  void onRefresh; // RN pull-to-refresh 자리(웹 UI 변경 없이 유지)

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const maxYear = now.getFullYear();
    const maxMonth = now.getMonth() + 1;

    if (
      selectedYear > maxYear ||
      (selectedYear === maxYear && selectedMonth >= maxMonth)
    ) {
      return; // 미래로 이동 불가
    }

    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth(selectedMonth + 1);
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
    setSelectedYear(tempYear);
    setSelectedMonth(tempMonth);
    setShowDatePicker(false);
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 년도 범위: 2024년부터 현재 년도까지
  const years = Array.from(
    { length: currentYear - 2024 + 1 },
    (_, i) => 2024 + i,
  );

  // 월 범위: 선택된 년도가 현재 년도라면 현재 월까지, 아니면 12월까지
  const maxMonth = tempYear === currentYear ? currentMonth : 12;
  const months = Array.from({ length: maxMonth }, (_, i) => i + 1);

  const isPrevDisabled = selectedYear === 2024 && selectedMonth === 1;
  const isNextDisabled =
    selectedYear > currentYear ||
    (selectedYear === currentYear && selectedMonth >= currentMonth);

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="gap-5 px-5 pb-10">
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
          <div className="flex flex-row items-center justify-between mb-4">
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
              className="flex flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-200 active:opacity-70"
            >
              {sortOrder === 'newest' ? (
                <IoArrowDownOutline size={14} className="text-gray-600" />
              ) : (
                <IoArrowUpOutline size={14} className="text-gray-600" />
              )}
              <div className="font-sans text-xs font-medium text-gray-600 ml-1">
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
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full">
            <div className="flex flex-row justify-between items-center mb-4 border-b border-gray-100 pb-4">
              <button type="button" onClick={() => setShowDatePicker(false)}>
                <div className="text-gray-500 text-base">취소</div>
              </button>

              <div className="font-bold text-lg text-gray-800">날짜 선택</div>

              <button type="button" onClick={confirmDate}>
                <div className="text-orange-500 font-bold text-base">확인</div>
              </button>
            </div>

            <div className="flex flex-row justify-center items-center gap-4">
              <div className="flex-1">
                <select
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
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
                  className="w-full border border-gray-200 rounded-xl p-3 text-gray-800"
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

            {/* RN Picker의 높이감 유지용 여백(시각만) */}
            <div style={{ height: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
}
