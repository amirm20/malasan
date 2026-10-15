import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AdminPermission } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<boolean>;
  register: (name: string, family: string, mobile: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: { name: string; family: string; addresses?: any[] }) => Promise<boolean>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (perm: AdminPermission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('malasban_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Token expired');
        })
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('malasban_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'ورود ناموفق بود', 'error');
        return false;
      }
      localStorage.setItem('malasban_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`خوش آمدید ${data.user.name} عزیز`, 'success');
      return true;
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
      return false;
    }
  };

  const register = async (
    name: string,
    family: string,
    mobile: string,
    email: string,
    pass: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, family, mobile, email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'ثبت‌نام ناموفق بود', 'error');
        return false;
      }
      localStorage.setItem('malasban_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('ثبت‌نام با موفقیت انجام شد.', 'success');
      return true;
    } catch {
      showToast('خطا در برقراری ارتباط با سرور', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('malasban_token');
    localStorage.removeItem('malasban_conv_id');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('malasban-auth-logout'));
    }
    showToast('با موفقیت از حساب خارج شدید', 'info');
  };

  const updateProfile = async (data: { name: string; family: string; addresses?: any[] }): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok) {
        setUser(resData.user);
        showToast(resData.message || 'پروفایل بروزرسانی شد', 'success');
        return true;
      }
      showToast(resData.message || 'خطا در بروزرسانی', 'error');
      return false;
    } catch {
      showToast('خطا در ارتباط با سرور', 'error');
      return false;
    }
  };

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const hasPermission = (perm: AdminPermission): boolean => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isSuperAdmin,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
