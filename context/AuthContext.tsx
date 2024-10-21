"use client"; // This is a client-side context

import { createContext, useContext, useState, ReactNode } from "react";

// Create AuthContext
const AuthContext = createContext({
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

// Create a Provider to wrap your app and provide the auth state
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}
