import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner.js';

describe('LoadingSpinner', () => {
  it('should_render_spinner', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });

  it('should_apply_small_size_class', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should_apply_medium_size_class', () => {
    render(<LoadingSpinner size="md" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-5', 'h-5');
  });

  it('should_apply_large_size_class', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('should_default_to_medium_size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('w-5', 'h-5');
  });

  it('should_apply_custom_class_name', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('custom-class');
  });

  it('should_have_animate_spin_class', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toHaveClass('animate-spin');
  });
});

