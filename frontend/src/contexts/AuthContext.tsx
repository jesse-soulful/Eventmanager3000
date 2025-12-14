import { createContext, useContext, ReactNode } from 'react';
import { useSession } from '../lib/auth';

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  } | null;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const value: AuthContextType = {
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role || 'USER',
        }
      : null,
    session: session?.session
      ? {
          id: session.session.id,
          userId: session.user.id,
          expiresAt: session.session.expiresAt,
        }
      : null,
    isLoading: isPending,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

