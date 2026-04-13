"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: {
    bio: string;
    avatar: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; first_name: string; password: string; password_confirm: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      api.setToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    api.setToken(data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    router.push("/dashboard");
  };

  const register = async (data: { username: string; email: string; first_name: string; password: string; password_confirm: string }) => {
    const result = await api.register(data);
    api.setToken(result.access_token);
    localStorage.setItem('refresh_token', result.refresh_token);
    localStorage.setItem('user', JSON.stringify(result.user));
    setUser(result.user);
    router.push("/dashboard");
  };

  const logout = () => {
    api.removeToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
