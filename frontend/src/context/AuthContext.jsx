import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { setAccessToken, clearAccessToken } from '../api/tokenStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // isLoading covers the initial "try to silently refresh on app load" check
  const [isLoading, setIsLoading] = useState(true);

  // On first mount, try to use the httpOnly refresh cookie (if the user was
  // already logged in from a previous visit) to get a fresh access token
  // and load their profile, without forcing them to log in again.
  //
  // The refresh token itself is httpOnly (JS can't read it), so we check a
  // small non-sensitive "hasSession" cookie the server sets alongside it.
  // If that hint isn't present, there's no session to restore, so we skip
  // the network call entirely instead of firing a guaranteed 401.
  useEffect(() => {
    const hasSessionHint = document.cookie
      .split('; ')
      .some((cookie) => cookie.startsWith('hasSession='));

    if (!hasSessionHint) {
      setIsLoading(false);
      return;
    }

    const tryRestoreSession = async () => {
      try {
        const { data: refreshData } = await api.post('/auth/refresh-token');
        setAccessToken(refreshData.accessToken);

        const { data: meData } = await api.get('/auth/me');
        setUser(meData.user);
      } catch (error) {
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    tryRestoreSession();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, confirmPassword) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
    });
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
