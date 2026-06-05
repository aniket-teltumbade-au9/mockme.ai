"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  logout: () => void;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Persist/load from local storage
    const storedUser = localStorage.getItem("auth_user_id");
    console.log("DEBUG: AuthContext initializing, storedUser:", storedUser);
    if (storedUser) setUserIdState(storedUser);
    setIsInitialized(true);
  }, []);

  const setUserId = (id: string | null) => {
    console.log("DEBUG: Setting userId:", id);
    if (id) localStorage.setItem("auth_user_id", id);
    else localStorage.removeItem("auth_user_id");
    setUserIdState(id);
  };

  const logout = () => {
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ userId, setUserId, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
