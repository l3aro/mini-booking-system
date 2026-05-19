import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BookingList from '@/components/BookingList';

const mockGetRoomBookings = vi.hoisted(() => vi.fn());
const mockDeleteBooking = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  getRoomBookings: mockGetRoomBookings,
  deleteBooking: mockDeleteBooking,
  getRooms: vi.fn(),
  getRoom: vi.fn(),
  createBooking: vi.fn(),
  createRoom: vi.fn(),
  getBookings: vi.fn(),
  getAvailability: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getUser: vi.fn(),
  updateRoom: vi.fn(),
  deleteRoom: vi.fn(),
  default: {},
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('BookingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { name: 'User' }, isAdmin: false });
  });

  it('renders booking items with times', async () => {
    mockGetRoomBookings.mockResolvedValue({
      data: [
        {
          id: 11,
          room_id: 1,
          user_name: 'User',
          start_time: '2026-01-01T01:00:00Z',
          end_time: '2026-01-01T02:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    render(<BookingList roomId={1} date="2026-01-01" />);

    expect(await screen.findByTestId('booking-item-11')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('shows empty state when no bookings', async () => {
    mockGetRoomBookings.mockResolvedValue({ data: [] });

    render(<BookingList roomId={1} date="2026-01-01" />);

    expect(await screen.findByText('No bookings for this date')).toBeInTheDocument();
  });

  it('admin sees delete button', async () => {
    mockUseAuth.mockReturnValue({ user: { name: 'Admin' }, isAdmin: true });
    mockGetRoomBookings.mockResolvedValue({
      data: [
        {
          id: 22,
          room_id: 1,
          user_name: 'Someone',
          start_time: '2026-01-01T01:00:00Z',
          end_time: '2026-01-01T02:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    render(<BookingList roomId={1} date="2026-01-01" />);

    expect(await screen.findByTestId('delete-booking-22')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockGetRoomBookings.mockImplementation(() => new Promise(() => {}));

    render(<BookingList roomId={1} date="2026-01-01" />);
    expect(screen.getByTestId('booking-list')).toBeInTheDocument();
    expect(screen.queryByText('No bookings for this date')).not.toBeInTheDocument();
  });

  it('shows error state when load fails', async () => {
    mockGetRoomBookings.mockRejectedValue(new Error('boom'));

    render(<BookingList roomId={1} date="2026-01-01" />);
    expect(await screen.findByText('Failed to load bookings')).toBeInTheDocument();
  });

  it('non owner non admin does not see delete', async () => {
    mockUseAuth.mockReturnValue({ user: { name: 'A' }, isAdmin: false });
    mockGetRoomBookings.mockResolvedValue({
      data: [
        {
          id: 33,
          room_id: 1,
          user_name: 'B',
          start_time: '2026-01-01T01:00:00Z',
          end_time: '2026-01-01T02:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
    });

    render(<BookingList roomId={1} date="2026-01-01" />);
    await waitFor(() => expect(screen.getByTestId('booking-item-33')).toBeInTheDocument());
    expect(screen.queryByTestId('delete-booking-33')).not.toBeInTheDocument();
  });
});
