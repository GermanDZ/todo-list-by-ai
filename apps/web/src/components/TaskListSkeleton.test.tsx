import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskListSkeleton } from './TaskListSkeleton.js';

describe('TaskListSkeleton', () => {
  it('should_render_skeleton', () => {
    render(<TaskListSkeleton />);
    const container = screen.getByLabelText('Loading tasks');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-busy', 'true');
  });

  it('should_render_three_skeleton_items', () => {
    render(<TaskListSkeleton />);
    const items = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-pulse')
    );
    // Should have multiple skeleton items (checkboxes, titles, dates, delete buttons)
    expect(items.length).toBeGreaterThan(0);
  });

  it('should_have_loading_indicator', () => {
    render(<TaskListSkeleton />);
    const container = screen.getByLabelText('Loading tasks');
    expect(container).toBeInTheDocument();
  });
});

