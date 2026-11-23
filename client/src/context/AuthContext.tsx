import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { apiLogin, apiGetMe, apiFirebaseLogin, apiDemoLogin } from '../services/api';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  token: string | null;
  isLoading: boolean;
  role: Role | null;
  isAuthenticated: boolean;
  login: (phone: string, pass: string) => Promise<void>;
  quickLogin: (type: 'worker' | 'employer' | 'admin') => Promise<void>;
  loginWithFirebase: (firebaseUser: FirebaseUser) => Promise<void>;
  logout: () => void;
  updateLocalProfile: (newProfile: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('kaamsetu_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem('kaamsetu_token');
      if (storedToken) {
        try {
          const res = await apiGetMe();
          if (res.success) {
            setUser(res.user);
            setProfile(res.profile);
          } else {
            logout();
          }
        } catch {
          // Token expired or server unreachable
          console.warn('[Auth] Session restore skipped, please login.');
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (phone: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(phone, pass);
      if (!res.success || !res.token || !res.user) {
        throw new Error('Login was not completed. Please check the credentials and try again.');
      }
      sessionStorage.setItem('kaamsetu_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithFirebase = async (firebaseUser: FirebaseUser) => {
    setIsLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const res = await apiFirebaseLogin(idToken);
      if (!res.success || !res.token || !res.user) {
        throw new Error('Your Google or phone identity is verified, but it is not linked to a KAAMSETU account. Register first or verify the mobile number already on your account.');
      }
      sessionStorage.setItem('kaamsetu_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (type: 'worker' | 'employer') => {
    setIsLoading(true);
    try {
      const res = await apiDemoLogin(type);
      if (!res.success || !res.token || !res.user) {
        throw new Error('Demo login was not completed. Please try again.');
      }
      sessionStorage.setItem('kaamsetu_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('kaamsetu_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateLocalProfile = (newProfile: any) => {
    setProfile(newProfile);
    if (newProfile?.avatar) setUser(current => current ? { ...current, avatar: newProfile.avatar } : current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        login,
        quickLogin,
        loginWithFirebase,
        logout,
        updateLocalProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
