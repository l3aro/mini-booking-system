import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import BookingCreateForm from '@/components/BookingCreateForm';

const { createBooking } = vi.hoisted(() => ({
  createBooking: vi.fn(),
}));

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api');
  return {
    ...actual,
    createBooking,
  };
});

function toUTC(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

const defaultDate = '2026-01-01';

describe('BookingCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with start_time and end_time inputs', () => {
    render(<BookingCreateForm roomId={1} selectedDate={defaultDate} />);
    expect(screen.getByTestId('start-time-input')).toBeInTheDocument();
    expect(screen.getByTestId('end-time-input')).toBeInTheDocument();
  });

  it('shows validation error if end before start', async () => {
    const user = userEvent.setup();
    render(<BookingCreateForm roomId={1} selectedDate={defaultDate} />);

    await user.type(screen.getByTestId('start-time-input'), '12:00');
    await user.type(screen.getByTestId('end-time-input'), '11:00');
    await user.click(screen.getByTestId('submit-booking'));

    expect(await screen.findByText('End time must be after start time')).toBeInTheDocument();
  });

  it('calls createBooking on submit with UTC times', async () => {
    const user = userEvent.setup();
    createBooking.mockResolvedValue({ data: { id: 1 } });

    render(<BookingCreateForm roomId={7} selectedDate={defaultDate} />);
    await user.type(screen.getByTestId('start-time-input'), '10:00');
    await user.type(screen.getByTestId('end-time-input'), '11:00');
    await user.click(screen.getByTestId('submit-booking'));

    await waitFor(() => {
      expect(createBooking).toHaveBeenCalledWith({
        room_id: 7,
        start_time: toUTC('2026-01-01T10:00'),
        end_time: toUTC('2026-01-01T11:00'),
      });
    });
  });

  it('calls onSuccess on 201 with booking date', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    createBooking.mockResolvedValue({ data: { id: 2 } });

    render(<BookingCreateForm roomId={1} selectedDate={defaultDate} onSuccess={onSuccess} />);
    await user.type(screen.getByTestId('start-time-input'), '10:00');
    await user.type(screen.getByTestId('end-time-input'), '11:00');
    await user.click(screen.getByTestId('submit-booking'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(defaultDate));
  });

  it('shows overlap error on 409', async () => {
    const user = userEvent.setup();
    createBooking.mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Overlap booking' },
      },
    });

    render(<BookingCreateForm roomId={1} selectedDate={defaultDate} />);
    await user.type(screen.getByTestId('start-time-input'), '10:00');
    await user.type(screen.getByTestId('end-time-input'), '11:00');
    await user.click(screen.getByTestId('submit-booking'));

    expect(await screen.findByTestId('booking-error')).toHaveTextContent('This time slot overlaps with an existing booking');
  });
});
