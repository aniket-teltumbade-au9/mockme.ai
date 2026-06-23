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
    if (storedId) {
      setTimeout(() => setUserIdState(storedId), 0);
    }
    if (storedToken) {
      setTimeout(() => setAccessTokenState(storedToken), 0);
    }
    setTimeout(() => setIsInitialized(true), 0);
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
    let isRefreshing = false;
    let failedQueue: Array<(token: string) => void> = [];

    const processQueue = (token: string | null) => {
      failedQueue.forEach(prom => {
        if (token) prom(token);
      });
      failedQueue = [];
    };

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            // Wait for refresh to complete
            return new Promise((resolve) => {
              failedQueue.push((token: string) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                resolve(axios(originalRequest));
              });
            });
          }

          isRefreshing = true;
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const refreshRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/dropbox/refresh-token`, {}, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('dropbox_access_token')}`
              }
            });

            const newToken = refreshRes.data.access_token;
            localStorage.setItem('dropbox_access_token', newToken);

            // Update the failed request with new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

            isRefreshing = false;
            processQueue(newToken);

            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed - user needs to re-authenticate
            isRefreshing = false;
            processQueue(null);
            setSessionExpired(true);
            localStorage.removeItem('dropbox_access_token');
            localStorage.removeItem('auth_user_id');
            return Promise.reject(refreshError);
          }
        }

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
