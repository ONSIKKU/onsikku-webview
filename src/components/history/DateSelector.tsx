import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
} from 'react-icons/io5';

interface DateSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDatePress?: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
}

export default function DateSelector({
  selectedYear,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  onDatePress,
  disablePrev = false,
  disableNext = false,
}: DateSelectorProps) {
  return (
    <div className="bg-white w-full p-6 rounded-3xl shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={disablePrev}
          className="p-3 bg-orange-50 rounded-full active:scale-90 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          <IoChevronBackOutline
            size={20}
            className={disablePrev ? 'text-gray-300' : 'text-onsikku-dark-orange'}
          />
        </button>

        <button
          type="button"
          onClick={onDatePress}
          className="flex flex-row items-center px-4 py-2 rounded-xl active:bg-gray-50 transition-colors"
        >
          <div className="font-sans text-xl font-bold text-gray-900">
            {selectedYear}년 {selectedMonth}월
          </div>
        </button>

        <button
          type="button"
          onClick={onNextMonth}
          disabled={disableNext}
          className="p-3 bg-orange-50 rounded-full active:scale-90 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          <IoChevronForwardOutline
            size={20}
            className={disableNext ? 'text-gray-300' : 'text-onsikku-dark-orange'}
          />
        </button>
      </div>
    </div>
  );
}