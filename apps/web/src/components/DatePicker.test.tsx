import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from './DatePicker.js';

describe('DatePicker', () => {
  it('should_render_date_input', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    const input = screen.getByLabelText('Due date');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  it('should_display_value_when_provided', () => {
    render(<DatePicker value="2026-01-15T00:00:00.000Z" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Due date') as HTMLInputElement;
    expect(input.value).toBe('2026-01-15');
  });

  it('should_display_empty_when_value_is_null', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    const input = screen.getByLabelText('Due date') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should_call_onChange_when_date_selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value={null} onChange={onChange} />);

    const input = screen.getByLabelText('Due date');
    await user.type(input, '2026-12-31');

    expect(onChange).toHaveBeenCalled();
    // The onChange should be called with an ISO string
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0]).toBeTruthy();
  });

  it('should_show_clear_button_when_value_exists', () => {
    render(<DatePicker value="2026-01-15T00:00:00.000Z" onChange={vi.fn()} />);
    const clearButton = screen.getByLabelText('Clear due date');
    expect(clearButton).toBeInTheDocument();
  });

  it('should_not_show_clear_button_when_value_is_null', () => {
    render(<DatePicker value={null} onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Clear due date')).not.toBeInTheDocument();
  });

  it('should_call_onChange_with_null_when_clear_button_clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="2026-01-15T00:00:00.000Z" onChange={onChange} />);

    const clearButton = screen.getByLabelText('Clear due date');
    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should_be_disabled_when_disabled_prop_is_true', () => {
    render(<DatePicker value={null} onChange={vi.fn()} disabled />);
    const input = screen.getByLabelText('Due date');
    expect(input).toBeDisabled();
  });

  it('should_apply_custom_class_name', () => {
    render(<DatePicker value={null} onChange={vi.fn()} className="custom-class" />);
    const input = screen.getByLabelText('Due date');
    const container = input.closest('.relative');
    expect(container).toHaveClass('custom-class');
  });

  it('should_use_custom_placeholder', () => {
    render(<DatePicker value={null} onChange={vi.fn()} placeholder="Select date" />);
    const input = screen.getByLabelText('Due date');
    expect(input).toHaveAttribute('placeholder', 'Select date');
  });
});

