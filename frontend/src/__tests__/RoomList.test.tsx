import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RoomList from '@/components/RoomList';

const mockUseRooms = vi.fn();

vi.mock('@/contexts/RoomContext', () => ({
  useRooms: () => mockUseRooms(),
}));

describe('RoomList', () => {
  it('renders room items from context data', () => {
    const selectRoom = vi.fn();
    mockUseRooms.mockReturnValue({
      rooms: [
        { id: 1, name: 'Alpha', capacity: 8 },
        { id: 2, name: 'Beta', capacity: 12 },
      ],
      selectedRoom: null,
      selectRoom,
      loading: false,
      error: null,
    });

    render(<RoomList />);

    expect(screen.getByTestId('room-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('room-item-2')).toBeInTheDocument();
  });

  it('shows room name and capacity', () => {
    mockUseRooms.mockReturnValue({
      rooms: [{ id: 5, name: 'Orion', capacity: 20 }],
      selectedRoom: null,
      selectRoom: vi.fn(),
      loading: false,
      error: null,
    });

    render(<RoomList />);

    expect(screen.getByText('Orion')).toBeInTheDocument();
    expect(screen.getByText('Capacity: 20')).toBeInTheDocument();
  });

  it('shows empty state when no rooms', () => {
    mockUseRooms.mockReturnValue({
      rooms: [],
      selectedRoom: null,
      selectRoom: vi.fn(),
      loading: false,
      error: null,
    });

    render(<RoomList />);
    expect(screen.getByText('No rooms available')).toBeInTheDocument();
  });

  it('renders loading skeleton when rooms are loading', () => {
    mockUseRooms.mockReturnValue({
      rooms: [],
      selectedRoom: null,
      selectRoom: vi.fn(),
      loading: true,
      error: null,
    });

    render(<RoomList />);
    expect(screen.getByTestId('room-list')).toBeInTheDocument();
    expect(screen.queryByText('No rooms available')).not.toBeInTheDocument();
  });

  it('handles error state', () => {
    mockUseRooms.mockReturnValue({
      rooms: [],
      selectedRoom: null,
      selectRoom: vi.fn(),
      loading: false,
      error: 'Failed to load rooms',
    });

    render(<RoomList />);
    expect(screen.getByText('Failed to load rooms')).toBeInTheDocument();
  });

  it('calls selectRoom when clicking room item', async () => {
    const user = userEvent.setup();
    const selectRoom = vi.fn();
    const room = { id: 1, name: 'Alpha', capacity: 8 };

    mockUseRooms.mockReturnValue({
      rooms: [room],
      selectedRoom: null,
      selectRoom,
      loading: false,
      error: null,
    });

    render(<RoomList />);
    await user.click(screen.getByTestId('room-item-1'));
    expect(selectRoom).toHaveBeenCalledWith(room);
  });
});
