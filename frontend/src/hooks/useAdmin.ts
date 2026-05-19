'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useAdmin() {
  const { isAdmin, user } = useAuth();
  return { isAdmin: isAdmin ?? false, user };
}
