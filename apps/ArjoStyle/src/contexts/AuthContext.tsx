// src/contexts/AuthContext.tsx
import React, { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient"; // Adjust path if needed
import type { Session, User } from "@supabase/supabase-js";

// --- Import the Context object and Type from the new file ---
import { AuthContext, AuthContextType } from "./AuthContextDefinition"; // Adjust path as needed

// Props interface remains the same
interface AuthProviderProps {
  children: ReactNode;
}

// --- Export ONLY the AuthProvider component ---
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        // TODO: Check user role/metadata here if needed
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting initial session:", error);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth State Change:", _event, session);
        setSession(session);
        setUser(session?.user ?? null);
        // TODO: Check user role/metadata here if needed
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Context value structure remains the same
  const value: AuthContextType = {
    session,
    user,
    loading,
    // isAdmin,
  };

  // Use the imported AuthContext here
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- The useAuth hook is now REMOVED from this file ---
// --- The AuthContext definition is now REMOVED from this file ---
// --- The AuthContextType interface is now REMOVED from this file ---
