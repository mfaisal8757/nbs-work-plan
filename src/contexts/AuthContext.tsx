import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SystemSettings, Role } from '../types.js';
import { api, getStoredToken, setStoredToken } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialSetupNeeded: boolean;
  isLoading: boolean;
  systemSettings: SystemSettings | null;
  login: (email: string, pass: string, expectedRole?: Role) => Promise<void>;
  initAdmin: (data: { name: string; email: string; password: string; phone?: string; staff_id?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshSystemSettings: () => Promise<void>;
  isAdmin: boolean;
  isDeskOfficer: boolean;
  isManagement: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isInitialSetupNeeded, setIsInitialSetupNeeded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Initialize auth & check setup status
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const savedToken = getStoredToken();
        if (savedToken) {
          try {
            const meRes = await api.auth.me();
            setUser(meRes.user);
            setToken(savedToken);
            const setRes = await api.settings.get();
            setSystemSettings(setRes.settings);
            return;
          } catch {
            setStoredToken(null);
            setToken(null);
            setUser(null);
          }
        }

        const status = await api.auth.getStatus();
        setIsInitialSetupNeeded(status.isUninitialized);
        if (!status.isUninitialized) {
          try {
            const setRes = await api.settings.get();
            setSystemSettings(setRes.settings);
          } catch {
            // Settings can load after user signs in
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string, expectedRole?: Role) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      if (expectedRole && res.user.role !== expectedRole) {
        setStoredToken(null);
        setToken(null);
        setUser(null);
        throw new Error(
          `This account is registered as "${res.user.role}". Please switch role to proceed.`
        );
      }
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      const setRes = await api.settings.get();
      setSystemSettings(setRes.settings);
    } finally {
      setIsLoading(false);
    }
  };

  const initAdmin = async (data: { name: string; email: string; password: string; phone?: string; staff_id?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.auth.initAdmin(data);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setIsInitialSetupNeeded(false);
      const setRes = await api.settings.get();
      setSystemSettings(setRes.settings);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const meRes = await api.auth.me();
      setUser(meRes.user);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const refreshSettings = async () => {
    if (!token) return;
    try {
      const res = await api.settings.get();
      setSystemSettings(res.settings);
    } catch (err) {
      console.error('Failed to refresh settings:', err);
    }
  };

  const isAdmin = user?.role === 'Administrator';
  const isDeskOfficer = user?.role === 'Departmental Desk Officer';
  const isManagement = user?.role === 'Management Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isInitialSetupNeeded,
        isLoading,
        systemSettings,
        login,
        initAdmin,
        logout,
        refreshUser,
        refreshSettings,
        refreshSystemSettings: refreshSettings,
        isAdmin,
        isDeskOfficer,
        isManagement
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
