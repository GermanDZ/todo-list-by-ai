import { useEffect, useRef } from 'react';

interface UseKeyboardShortcutsOptions {
  onFocusTaskInput?: () => void;
  onShowHelp?: () => void;
}

/**
 * Hook to handle global keyboard shortcuts for TaskFlow
 * Supports Cmd/Ctrl+K to focus task input and ? to show help
 */
export function useKeyboardShortcuts({
  onFocusTaskInput,
  onShowHelp,
}: UseKeyboardShortcutsOptions = {}) {
  const isInputFocusedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Track if an input is focused
      if (isInputElement) {
        isInputFocusedRef.current = true;
      } else {
        isInputFocusedRef.current = false;
      }

      // Cmd/Ctrl+K: Focus task input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Don't prevent default if user is typing in an input (let browser handle it)
        if (!isInputElement) {
          e.preventDefault();
          onFocusTaskInput?.();
        }
      }

      // ?: Show keyboard shortcuts help
      if (e.key === '?' && !isInputElement && !e.shiftKey) {
        // Only trigger if not in an input and not holding shift
        e.preventDefault();
        onShowHelp?.();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onFocusTaskInput, onShowHelp]);
}

