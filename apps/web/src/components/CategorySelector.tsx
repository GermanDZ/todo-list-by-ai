import { useState } from 'react';
import { DEFAULT_CATEGORIES, validateCategory, normalizeCategory } from '../utils/categories.js';

interface CategorySelectorProps {
  value: string | null;
  onChange: (category: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CategorySelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select or enter category',
}: CategorySelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === '') {
      // Clear category
      onChange(null);
      setIsCustom(false);
      setCustomValue('');
      setError(null);
    } else if (selectedValue === 'custom') {
      // Switch to custom input
      setIsCustom(true);
      setCustomValue(value && !DEFAULT_CATEGORIES.includes(value as any) ? value : '');
    } else {
      // Select default category
      onChange(selectedValue);
      setIsCustom(false);
      setCustomValue('');
      setError(null);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomValue(inputValue);
    setError(null);

    // Validate and update immediately
    if (inputValue.trim().length === 0) {
      onChange(null);
    } else {
      const validationError = validateCategory(inputValue);
      if (validationError) {
        setError(validationError);
      } else {
        onChange(normalizeCategory(inputValue));
      }
    }
  };

  const handleCustomInputBlur = () => {
    const normalized = normalizeCategory(customValue);
    if (normalized) {
      onChange(normalized);
      setCustomValue(normalized);
    } else {
      // If empty, switch back to dropdown
      setIsCustom(false);
      setCustomValue('');
      onChange(null);
    }
    setError(null);
  };

  // Determine if we should show custom input or dropdown
  const showCustomInput = isCustom || (value && !DEFAULT_CATEGORIES.includes(value as any));

  return (
    <div className="flex flex-col gap-1">
      {showCustomInput ? (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={customValue}
              onChange={handleCustomInputChange}
              onBlur={handleCustomInputBlur}
              placeholder="Enter custom category"
              disabled={disabled}
              maxLength={50}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => {
                setIsCustom(false);
                setCustomValue('');
                onChange(null);
                setError(null);
              }}
              disabled={disabled}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
              aria-label="Clear category"
            >
              Clear
            </button>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={handleSelectChange}
          disabled={disabled}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
        >
          <option value="">{placeholder}</option>
          {DEFAULT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="custom">Custom...</option>
        </select>
      )}
    </div>
  );
}

