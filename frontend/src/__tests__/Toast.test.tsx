import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast from '@/components/Toast';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('renders success message', () => {
  render(<Toast type="success" message="Operation completed" onClose={() => {}} />);

  act(() => { vi.advanceTimersByTime(10); });

  expect(screen.getByText('Operation completed')).toBeInTheDocument();
});

it('renders error message', () => {
  render(<Toast type="error" message="Something failed" onClose={() => {}} />);

  act(() => { vi.advanceTimersByTime(10); });

  expect(screen.getByText('Something failed')).toBeInTheDocument();
});

it('renders info message', () => {
  render(<Toast type="info" message="Heads up" onClose={() => {}} />);

  act(() => { vi.advanceTimersByTime(10); });

  expect(screen.getByText('Heads up')).toBeInTheDocument();
});

it('auto-dismisses after timeout', () => {
  const onClose = vi.fn();

  render(<Toast type="success" message="Auto dismiss" onClose={onClose} />);

  // Advance past the 4000ms auto-dismiss timer (+ 300ms for close animation)
  act(() => { vi.advanceTimersByTime(4300); });

  expect(onClose).toHaveBeenCalledTimes(1);
});

it('close button dismisses the toast', () => {
  const onClose = vi.fn();

  render(<Toast type="info" message="Close me" onClose={onClose} />);

  act(() => { vi.advanceTimersByTime(10); });

  const closeButton = screen.getByLabelText('Close notification');
  fireEvent.click(closeButton);

  // Advance past the 300ms close animation
  act(() => { vi.advanceTimersByTime(300); });

  expect(onClose).toHaveBeenCalledTimes(1);
});
