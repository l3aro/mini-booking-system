import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md mx-4">
        <AuthProvider>
          {children}
        </AuthProvider>
      </div>
    </div>
  );
}
