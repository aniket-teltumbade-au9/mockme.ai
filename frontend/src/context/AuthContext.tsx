"use client";
import { createContext, useContext, useCallback, useState, ReactNode, useEffect } from "react";
import axios from "axios";

interface AuthContextType {
  userId: string | null;
  accessToken: string | null;
  setUserId: (id: string | null) => void;
  setDropboxAuth: (id: string, accessToken: string) => void;
  logout: () => void;
  isInitialized: boolean;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem("auth_user_id");
    const storedToken = localStorage.getItem("dropbox_access_token");
    if (storedId) setUserIdState(storedId);
    if (storedToken) setAccessTokenState(storedToken);
    setIsInitialized(true);
  }, []);

  const setUserId = useCallback((id: string | null) => {
    if (id) localStorage.setItem("auth_user_id", id);
    else {
      localStorage.removeItem("auth_user_id");
      localStorage.removeItem("dropbox_access_token");
      setAccessTokenState(null);
    }
    setUserIdState(id);
    setSessionExpired(false);
  }, []);

  const setDropboxAuth = useCallback((id: string, token: string) => {
    localStorage.setItem("auth_user_id", id);
    localStorage.setItem("dropbox_access_token", token);
    setUserIdState(id);
    setAccessTokenState(token);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("dropbox_access_token");
    localStorage.removeItem("auth_user_id");
    setAccessTokenState(null);
    setUserIdState(null);
    setSessionExpired(false);
  }, []);

  return (
    <AuthContext.Provider value={{ userId, accessToken, setUserId, setDropboxAuth, logout, isInitialized, sessionExpired, setSessionExpired }}>
      <AxiosInterceptor setSessionExpired={setSessionExpired}>
        {children}
      </AxiosInterceptor>
    </AuthContext.Provider>
  );
};

function AxiosInterceptor({ children, setSessionExpired }: { children: ReactNode, setSessionExpired: (v: boolean) => void }) {
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setSessionExpired(true);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [setSessionExpired]);

  return <>{children}</>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
