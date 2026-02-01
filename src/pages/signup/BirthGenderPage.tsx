import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/Button';
import GenderSelector from '@/components/GenderSelector';
import SignUpHeader from '@/components/SignUpHeader';
import { useSignupStore } from '@/features/signup/signupStore';
import { IoCalendarOutline } from 'react-icons/io5';

export default function BirthGenderPage() {
  const navigate = useNavigate();
  const { gender, setGender, birthDate, setBirthDate, nickname, setNickname } =
    useSignupStore();

  const [localBirth, setLocalBirth] = useState(birthDate || '');
  const [localNickname, setLocalNickname] = useState(nickname || '');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);

  const canNext = useMemo(() => {
    return !!gender && !!localBirth && !!localNickname.trim();
  }, [gender, localBirth, localNickname]);

  const saveAndNext = () => {
    setBirthDate(localBirth);
    setNickname(localNickname);
    navigate('/signup/family');
  };

  const openDatePicker = () => {
    let y = 2000,
      m = 1,
      d = 1;
    if (localBirth) {
      const parts = localBirth.split('-');
      if (parts.length === 3) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      }
    }
    setTempYear(y);
    setTempMonth(m);
    setTempDay(d);
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const y = tempYear;
    const m = String(tempMonth).padStart(2, '0');
    const d = String(tempDay).padStart(2, '0');
    setLocalBirth(`${y}-${m}-${d}`);
    setShowDatePicker(false);
  };

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 100 }, (_, i) => currentYear - i),
    [currentYear],
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  useEffect(() => {
    if (tempDay > daysInMonth) setTempDay(daysInMonth);
  }, [daysInMonth, tempDay]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 pt-2 scrollbar-hide">
        <SignUpHeader
          title="기본 정보를 입력해주세요"
          description="사용할 닉네임과 생년월일, 성별을 알려주세요."
          currentStep={2}
          totalSteps={3}
          showBackButton
        />

        <div className="mt-8 space-y-8">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900 ml-1">
              닉네임
            </label>
            <input
              type="text"
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value)}
              placeholder="예) 귀염둥이 막내"
              className="w-full appearance-none rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-lg font-medium text-gray-900 shadow-sm outline-none transition-all focus:border-onsikku-dark-orange focus:bg-white focus:ring-1 focus:ring-onsikku-dark-orange placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900 ml-1">
              생년월일
            </label>
            <button
              type="button"
              onClick={openDatePicker}
              className={`w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-5 py-4 text-left flex justify-between items-center shadow-sm outline-none transition-all active:bg-gray-100 ${
                localBirth ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              <span className="text-lg font-medium">
                {localBirth || 'YYYY-MM-DD'}
              </span>
              <IoCalendarOutline size={22} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-900 ml-1">
              성별
            </label>
            <GenderSelector value={gender} onChange={setGender} />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-white via-white to-transparent pb-8 pt-4">
        <div className="mx-auto max-w-md px-5">
          <Button
            className="w-full py-4 text-lg shadow-xl shadow-orange-100/50"
            disabled={!canNext}
            onClick={saveAndNext}
          >
            다음으로
          </Button>
        </div>
      </div>

      {/* Custom Bottom Sheet Date Picker */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-[60] animate-fade-in">
          <div className="bg-white rounded-t-[30px] p-6 w-full animate-slide-up pb-10">
            <div className="flex flex-row justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="active:opacity-70 p-2"
              >
                <div className="text-gray-500 text-base font-medium">취소</div>
              </button>

              <div className="font-bold text-lg text-gray-900">
                생년월일 선택
              </div>

              <button
                type="button"
                onClick={confirmDate}
                className="active:opacity-70 p-2"
              >
                <div className="text-onsikku-dark-orange font-bold text-base">
                  확인
                </div>
              </button>
            </div>

            <div className="flex flex-row justify-center items-center gap-2 h-[180px]">
              <div className="flex-1 h-full relative">
                <select
                  className="w-full h-full text-center text-lg font-medium appearance-none bg-transparent outline-none border border-gray-200 rounded-xl p-2 focus:border-onsikku-dark-orange overflow-y-auto"
                  value={tempYear}
                  onChange={(e) => setTempYear(Number(e.target.value))}
                  size={5}
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="py-2">
                      {y}년
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 h-full relative">
                <select
                  className="w-full h-full text-center text-lg font-medium appearance-none bg-transparent outline-none border border-gray-200 rounded-xl p-2 focus:border-onsikku-dark-orange overflow-y-auto"
                  value={tempMonth}
                  onChange={(e) => setTempMonth(Number(e.target.value))}
                  size={5}
                >
                  {months.map((m) => (
                    <option key={m} value={m} className="py-2">
                      {m}월
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 h-full relative">
                <select
                  className="w-full h-full text-center text-lg font-medium appearance-none bg-transparent outline-none border border-gray-200 rounded-xl p-2 focus:border-onsikku-dark-orange overflow-y-auto"
                  value={tempDay}
                  onChange={(e) => setTempDay(Number(e.target.value))}
                  size={5}
                >
                  {days.map((d) => (
                    <option key={d} value={d} className="py-2">
                      {d}일
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
