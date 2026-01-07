import { dateToInputValue, inputValueToISO } from '../utils/dateFormat.js';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
}: DatePickerProps) {
  const inputValue = dateToInputValue(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const isoDate = inputValueToISO(newValue);
    onChange(isoDate);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <input
        type="date"
        value={inputValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Due date"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center transition-colors"
          aria-label="Clear due date"
        >
          <svg
            className="w-5 h-5 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

