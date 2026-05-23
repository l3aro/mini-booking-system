import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

/** Detect browser's IANA timezone (fallback UTC if unavailable). */
export function getUserTimezone(): string {
  if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return 'UTC';
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
}

export interface Booking {
  id: number;
  room_id: number;
  room?: Room;
  user_name: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/login", { email, password });
  return response.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/register", data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/logout");
};

export const getUser = async (): Promise<{ data: User }> => {
  const response = await api.get<{ data: User }>("/user");
  return response.data;
};

export const getRooms = async (): Promise<{ data: Room[] }> => {
  const response = await api.get<{ data: Room[] }>("/rooms");
  return response.data;
};

export const getRoom = async (id: number): Promise<{ data: Room }> => {
  const response = await api.get<{ data: Room }>(`/rooms/${id}`);
  return response.data;
};

export const createRoom = async (data: { name: string; capacity: number; user_name?: string }): Promise<{ data: Room }> => {
  const response = await api.post<{ data: Room }>("/rooms", data);
  return response.data;
};

export const updateRoom = async (id: number, data: { name?: string; capacity?: number; user_name?: string }): Promise<{ data: Room }> => {
  const response = await api.put<{ data: Room }>(`/rooms/${id}`, data);
  return response.data;
};

export const deleteRoom = async (id: number): Promise<void> => {
  await api.delete(`/rooms/${id}`);
};

export const getBookings = async (params?: {
  filter?: string;
  room_id?: number;
  date?: string;
}): Promise<{ data: Booking[] }> => {
  const response = await api.get<{ data: Booking[] }>("/bookings", { params });
  return response.data;
};

export const createBooking = async (data: {
  room_id: number;
  start_time: string;
  end_time: string;
}): Promise<{ data: Booking }> => {
  const response = await api.post<{ data: Booking }>("/bookings", data);
  return response.data;
};

export const deleteBooking = async (id: number): Promise<void> => {
  await api.delete(`/bookings/${id}`);
};

export const getRoomBookings = async (roomId: number, date?: string): Promise<{ data: Booking[] }> => {
  const params: Record<string, string> = {};
  if (date) {
    const tz = getUserTimezone();
    params.date_from = dayjs.tz(date, tz).startOf('day').utc().toISOString();
    params.date_to = dayjs.tz(date, tz).endOf('day').utc().toISOString();
  }
  const response = await api.get<{ data: Booking[] }>(`/rooms/${roomId}/bookings`, { params });
  return response.data;
};

export const getAvailability = async (
  roomId: number,
  date?: string,
): Promise<{ data: AvailabilitySlot[] }> => {
  const response = await api.get<{ data: AvailabilitySlot[] }>(`/rooms/${roomId}/availability`, {
    params: { date },
  });
  return response.data;
};

// ── Room Status (derived from bookings) ──

export type RoomStatus = 'available' | 'occupied' | 'reserved';

export interface RoomStatusInfo {
  room: Room;
  status: RoomStatus;
  currentBooking: Booking | null;
  todayBookings: Booking[];
  nextBooking: Booking | null;
}

/** Fetch all rooms + today's bookings and derive status for each room. */
export async function getRoomStatuses(date?: string): Promise<RoomStatusInfo[]> {
  const [roomsRes, bookingsRes] = await Promise.all([
    getRooms(),
    getBookings({ filter: 'all' }),
  ]);

  const rooms = roomsRes.data;
  const allBookings = bookingsRes.data;

  const tz = getUserTimezone();
  const target = date ? dayjs.tz(date, tz) : dayjs().tz(tz);
  const targetStart = target.startOf('day');
  const targetEnd = target.endOf('day');

  const dayBookings = allBookings.filter((b) => {
    const start = dayjs.utc(b.start_time).tz(tz);
    return start.isBetween(targetStart, targetEnd, null, '[]');
  });

  const now = dayjs().tz(tz);

  const statuses: RoomStatusInfo[] = rooms.map((room) => {
    const roomBookings = dayBookings.filter((b) => b.room_id === room.id);

    roomBookings.sort(
      (a, b) => dayjs.utc(a.start_time).valueOf() - dayjs.utc(b.start_time).valueOf(),
    );

    const currentBooking =
      roomBookings.find((b) => {
        const start = dayjs.utc(b.start_time).tz(tz);
        const end = dayjs.utc(b.end_time).tz(tz);
        return now.isAfter(start) && now.isBefore(end);
      }) ?? null;

    const nextBooking =
      roomBookings.find((b) => {
        const start = dayjs.utc(b.start_time).tz(tz);
        return start.isAfter(now);
      }) ?? null;

    let status: RoomStatus = 'available';
    if (currentBooking) {
      status = 'occupied';
    } else if (nextBooking && nextBooking !== currentBooking) {
      const hoursUntilNext = dayjs.utc(nextBooking.start_time).tz(tz).diff(now, 'hour', true);
      if (hoursUntilNext <= 2) {
        status = 'reserved';
      }
    }

    return { room, status, currentBooking, todayBookings: roomBookings, nextBooking };
  });

  return statuses;
}

export default api;
