import React, { useMemo } from 'react';

interface DateTimePickerProps {
  id?: string;
  dateValue: string;
  timeValue: string;
  onChange: (date: string, time: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
  disabled?: boolean;
}

export const DateTimePicker = ({
  id,
  dateValue,
  timeValue,
  onChange,
  minDate,
  maxDate,
  className = '',
  disabled = false,
}: DateTimePickerProps) => {
  const localVal = useMemo(() => {
    if (!dateValue || !timeValue) return '';
    return `${dateValue}T${timeValue}`;
  }, [dateValue, timeValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // Format: "YYYY-MM-DDTHH:mm"
    if (!val) {
      onChange('', '');
      return;
    }
    const [d, t] = val.split('T');
    onChange(d || '', t ? t.slice(0, 5) : '');
  };

  return (
    <input
      id={id}
      type="datetime-local"
      value={localVal}
      onChange={handleChange}
      min={minDate ? `${minDate}T00:00` : undefined}
      max={maxDate ? `${maxDate}T23:59` : undefined}
      className={`block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2.5 transition-colors bg-white hover:bg-gray-50 cursor-pointer ${className}`}
      disabled={disabled}
    />
  );
};
