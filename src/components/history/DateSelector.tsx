import React from 'react';
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoTimeOutline,
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
    <div className="bg-white w-full p-6 rounded-2xl shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={disablePrev}
          className="p-2 active:opacity-50 disabled:opacity-50"
        >
          <IoChevronBackOutline
            size={24}
            className={disablePrev ? 'text-gray-300' : 'text-orange-500'}
          />
        </button>

        <button
          type="button"
          onClick={onDatePress}
          className="flex flex-row items-center p-2 active:opacity-50"
        >
          <IoTimeOutline size={20} className="text-orange-500" />
          <div className="font-sans text-lg font-bold text-gray-900 ml-2">
            {selectedYear}년 {selectedMonth}월
          </div>
        </button>

        <button
          type="button"
          onClick={onNextMonth}
          disabled={disableNext}
          className="p-2 active:opacity-50 disabled:opacity-50"
        >
          <IoChevronForwardOutline
            size={24}
            className={disableNext ? 'text-gray-300' : 'text-orange-500'}
          />
        </button>
      </div>
    </div>
  );
}
