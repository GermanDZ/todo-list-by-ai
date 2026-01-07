import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Custom render function that includes common providers
 * Use this instead of the default render from @testing-library/react
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with our custom render
export { customRender as render };

/**
 * Mock window.location
 */
export function mockLocation(pathname: string) {
  delete (window as any).location;
  (window as any).location = { pathname };
}

/**
 * Wait for next tick
 */
export function waitForNextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a mock function that resolves after a delay
 */
export function createDelayedPromise<T>(value: T, delay = 0) {
  return vi.fn(() => new Promise<T>((resolve) => setTimeout(() => resolve(value), delay)));
}

/**
 * Create a mock function that rejects after a delay
 */
export function createDelayedReject(error: Error, delay = 0) {
  return vi.fn(() => new Promise((_, reject) => setTimeout(() => reject(error), delay)));
}

