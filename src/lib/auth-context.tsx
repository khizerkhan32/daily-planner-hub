import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUser, login as storeLogin, logout as storeLogout, register as storeRegister } from './store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<string | true>;
  register: (email: string, name: string, password: string) => Promise<string | true>;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refresh = () => setUser(getUser());

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string): Promise<string | true> => {
    const result = await storeLogin(email, password);
    if (typeof result === 'string') return result;
    setUser(result);
    return true;
  };

  const register = async (email: string, name: string, password: string): Promise<string | true> => {
    const result = await storeRegister(email, name, password);
    if (typeof result === 'string') return result;
    setUser(result);
    return true;
  };

  const logout = () => {
    storeLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
