import { useState, forwardRef, useImperativeHandle, useRef } from 'react';

interface AddTaskInputProps {
  onCreateTask: (title: string) => Promise<void>;
  disabled?: boolean;
}

export interface AddTaskInputRef {
  focus: () => void;
}

export const AddTaskInput = forwardRef<AddTaskInputRef, AddTaskInputProps>(
  ({ onCreateTask, disabled = false }, ref) => {
    const [title, setTitle] = useState('');
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
      await onCreateTask(trimmedTitle);
      setTitle('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
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
          className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-base"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </form>
  );
  }
);

