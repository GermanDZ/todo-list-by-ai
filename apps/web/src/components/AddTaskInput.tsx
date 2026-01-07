import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner.js';
import { DatePicker } from './DatePicker.js';
import { CategorySelector } from './CategorySelector.js';

interface AddTaskInputProps {
  onCreateTask: (title: string, dueDate?: string | null, category?: string | null) => Promise<void>;
  disabled?: boolean;
}

export interface AddTaskInputRef {
  focus: () => void;
}

export const AddTaskInput = forwardRef<AddTaskInputRef, AddTaskInputProps>(
  ({ onCreateTask, disabled = false }, ref) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus method via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateTask(trimmedTitle, dueDate, category);
      setTitle('');
      setDueDate(null);
      setCategory(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder="Add a new task..."
            disabled={disabled || isSubmitting}
            className="flex-1 px-3 sm:px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || isSubmitting || !title.trim()}
            className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base flex items-center justify-center gap-2"
            aria-busy={isSubmitting}
          >
            {isSubmitting && <LoadingSpinner size="sm" className="text-white" />}
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          placeholder="Set due date (optional)"
          disabled={disabled || isSubmitting}
        />
        <CategorySelector
          value={category}
          onChange={setCategory}
          disabled={disabled || isSubmitting}
          placeholder="Select category (optional)"
        />
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </form>
  );
  }
);

