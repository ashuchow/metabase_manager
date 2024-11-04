"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;       // Add id here
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  signIn: (userData: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAuth = localStorage.getItem("isAuthenticated");
    const expiry = localStorage.getItem("expiry");
  
    const now = new Date().getTime();
  
    if (!storedUser || storedAuth !== "true" || (expiry && now > parseInt(expiry))) {
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("expiry");
      setIsAuthenticated(false);
      setUser(null);
    } else {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  
    setLoading(false);
  }, []);
  
  const signIn = (userData: User) => {
    console.log("User signed in:", userData);
  
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("expiry", (new Date().getTime() + 15 * 60 * 1000).toString()); // 15 minute expiry
  };
  

  const signOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    router.push("/signin");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
