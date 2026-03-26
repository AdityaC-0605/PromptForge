import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/src/components/ToastProvider';

const TestComponent = () => {
  const { addToast } = useToast();
  return (
    <div>
      <button onClick={() => addToast('msg1', 'info')}>add msg1</button>
      <button onClick={() => addToast('msg2', 'success')}>add msg2</button>
      <button onClick={() => addToast('msg3', 'error')}>add msg3</button>
      <button onClick={() => addToast('msg4', 'info')}>add msg4</button>
    </div>
  );
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows toasts and auto-dismisses after 4s', async () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);

    await act(() => {
      fireEvent.click(screen.getByText('add msg1'));
    });

    expect(screen.getByText('msg1')).toBeInTheDocument();

    // Fast forward 4s for auto-dismiss
    await act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('msg1')).toBeNull();
  });

  it('dismisses on click', async () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);

    await act(() => {
      fireEvent.click(screen.getByText('add msg1'));
    });

    const toast = screen.getByText('msg1');
    expect(toast).toBeInTheDocument();

    await act(() => {
      fireEvent.click(toast);
    });

    expect(screen.queryByText('msg1')).toBeNull();
  });

  it('queues beyond 3 toasts', async () => {
    render(<ToastProvider><TestComponent /></ToastProvider>);

    await act(() => {
      fireEvent.click(screen.getByText('add msg1'));
      fireEvent.click(screen.getByText('add msg2'));
      fireEvent.click(screen.getByText('add msg3'));
      fireEvent.click(screen.getByText('add msg4'));
    });

    expect(screen.getByText('msg1')).toBeInTheDocument();
    expect(screen.getByText('msg2')).toBeInTheDocument();
    expect(screen.getByText('msg3')).toBeInTheDocument();
    expect(screen.queryByText('msg4')).toBeNull(); // queued

    // dismiss first toast
    await act(() => {
      fireEvent.click(screen.getByText('msg1'));
    });

    // msg4 should appear
    expect(screen.getByText('msg4')).toBeInTheDocument();
  });
});
