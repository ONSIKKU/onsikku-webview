import ActivitySummary from '@/components/history/ActivitySummary';
import DateSelector from '@/components/history/DateSelector';
import QuestionList from '@/components/history/QuestionList';
import { getQuestionsByMonth, setAccessToken } from '@/utils/api';
import type { QuestionDetails } from '@/utils/api';
import { getItem } from '@/utils/AsyncStorage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IoArrowDownOutline,
  IoArrowUpOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from 'react-icons/io5';

type WeekGroup = {
  key: string;
  label: string;
  week: number;
  items: QuestionDetails[];
};

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  // Temp state for modal remains local
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempMonth, setTempMonth] = useState(selectedMonth);

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [answeredOnly, setAnsweredOnly] = useState(false);
  const [expandedWeekKeys, setExpandedWeekKeys] = useState<Set<string>>(
    new Set(),
  );
  const [showScrollTop, setShowScrollTop] = useState(false);

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
  const getDateValue = (q: QuestionDetails): number => {
    const dateStr = q.sentAt || q.answeredAt;
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getItem('accessToken');
      if (token) setAccessToken(token);

      const data = await getQuestionsByMonth(selectedYear, selectedMonth);
      const fetchedQuestions = data.questionDetails || [];

      // Sort questions
      const sortedQuestions = [...fetchedQuestions].sort((a, b) => {
        const dateA = getDateValue(a);
        const dateB = getDateValue(b);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });

      setQuestions(sortedQuestions);
    } catch (e: any) {
      console.error('[월별 질문 조회 에러]', e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, sortOrder]);

  // Re-sort when sortOrder changes without re-fetching if data exists
  useEffect(() => {
    if (questions.length > 0) {
      const sorted = [...questions].sort((a, b) => {
        const dateA = getDateValue(a);
        const dateB = getDateValue(b);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
      
      // Compare by ID order to see if it actually changed
      const currentIds = questions.map(q => q.questionInstanceId).join(',');
      const sortedIds = sorted.map(q => q.questionInstanceId).join(',');
      
      if (currentIds !== sortedIds) {
        setQuestions(sorted);
      }
    }
  }, [sortOrder]);

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

  const displayedQuestions = answeredOnly
    ? questions.filter((q) => q.state === 'ANSWERED')
    : questions;

  const getWeekMeta = (question: QuestionDetails) => {
    const source = question.sentAt || question.answeredAt;
    if (!source) return { week: 0, ts: 0 };
    const date = new Date(source);
    if (isNaN(date.getTime())) return { week: 0, ts: 0 };
    const week = Math.ceil(date.getDate() / 7);
    return { week, ts: date.getTime() };
  };

  const weekGroups = useMemo<WeekGroup[]>(() => {
    const grouped = new Map<number, QuestionDetails[]>();

    displayedQuestions.forEach((q) => {
      const { week } = getWeekMeta(q);
      const safeWeek = week <= 0 ? 1 : week;
      if (!grouped.has(safeWeek)) grouped.set(safeWeek, []);
      grouped.get(safeWeek)!.push(q);
    });

    const groups: WeekGroup[] = Array.from(grouped.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([week, items]) => ({
        key: `${selectedYear}-${selectedMonth}-${week}`,
        label: `${selectedMonth}월 ${week}주`,
        week,
        items,
      }));

    return groups;
  }, [displayedQuestions, selectedMonth, selectedYear]);

  useEffect(() => {
    if (weekGroups.length === 0) {
      setExpandedWeekKeys(new Set());
      return;
    }

    const available = new Set(weekGroups.map((g) => g.key));
    let hasAny = false;
    expandedWeekKeys.forEach((key) => {
      if (available.has(key)) hasAny = true;
    });

    if (!hasAny) {
      setExpandedWeekKeys(new Set([weekGroups[0].key]));
    }
  }, [weekGroups]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 460);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleWeek = (key: string) => {
    setExpandedWeekKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
          <div className="flex flex-row items-center justify-between mb-3 px-1">
            <div className="font-sans font-bold text-xl text-gray-900">
              지난 질문들
            </div>
          </div>

          <div className="sticky top-0 z-20 -mx-1 mb-4 bg-orange-50/95 px-1 py-2 backdrop-blur">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setAnsweredOnly((prev) => !prev)}
                className={`whitespace-nowrap flex flex-row items-center px-3 py-1.5 rounded-xl border shadow-sm active:scale-95 transition-transform ${
                  answeredOnly
                    ? 'bg-onsikku-dark-orange text-white border-onsikku-dark-orange'
                    : 'bg-white text-gray-600 border-gray-100'
                }`}
              >
                <div className="font-sans text-sm font-medium">
                  답변 완료만
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === 'newest' ? 'oldest' : 'newest',
                  )
                }
                className="whitespace-nowrap flex flex-row items-center bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform"
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
          </div>

          {loading ? (
            <QuestionList
              questions={displayedQuestions}
              loading={loading}
              onQuestionPress={handleQuestionPress}
            />
          ) : weekGroups.length === 0 ? (
            <QuestionList
              questions={displayedQuestions}
              loading={false}
              onQuestionPress={handleQuestionPress}
            />
          ) : (
            <div className="space-y-3">
              {weekGroups.map((group) => {
                const isOpen = expandedWeekKeys.has(group.key);
                return (
                  <section key={group.key} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleWeek(group.key)}
                      className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {group.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {group.items.length}개
                        </span>
                      </div>
                      {isOpen ? (
                        <IoChevronUpOutline size={18} className="text-gray-500" />
                      ) : (
                        <IoChevronDownOutline size={18} className="text-gray-500" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 bg-gray-50/50">
                        <QuestionList
                          questions={group.items}
                          loading={false}
                          onQuestionPress={handleQuestionPress}
                        />
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-5 z-30 rounded-full bg-onsikku-dark-orange p-3 text-white shadow-lg active:scale-95"
          aria-label="scroll to top"
        >
          <IoArrowUpOutline size={20} />
        </button>
      )}

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
