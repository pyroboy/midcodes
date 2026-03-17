// src/contexts/AuthContextDefinition.ts
import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

// Define the shape of your context data
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  // Add isAdmin check later if needed based on roles/metadata
  // isAdmin: boolean;
}

// Define the default value explicitly matching the type
const defaultAuthContextValue: AuthContextType = {
  session: null,
  user: null,
  loading: true, // Start in loading state
  // isAdmin: false,
};

// Create and export the Context object itself
export const AuthContext = createContext<AuthContextType>(
  defaultAuthContextValue
);

// Create and export the custom hook to consume the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // The undefined check might be less necessary now with a proper default value,
  // but it's good practice to ensure the hook is used within the provider.
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  // If you used createContext<AuthContextType | undefined>(undefined),
  // you would need this check:
  // if (context === undefined) {
  // }
  return context;
};
