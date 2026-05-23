'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.is_admin ?? false;

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      import('@/lib/api').then(({ getUser }) => {
        getUser()
          .then((response) => {
            setUser(response.data);
            localStorage.setItem('auth_user', JSON.stringify(response.data));
          })
          .catch(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
          })
          .finally(() => setLoading(false));
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    const { login } = await import('@/lib/api');
    const response = await login(email, password);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  }, []);

  const registerUser = useCallback(async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const { register } = await import('@/lib/api');
    const response = await register({ name, email, password, password_confirmation: passwordConfirmation });
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      const { logout } = await import('@/lib/api');
      await logout();
    } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, isAuthenticated, loading, loginUser, registerUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
