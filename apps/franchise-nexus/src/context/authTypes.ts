// User interface
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: UserRole;
    // Other user properties
  }
  
// Define UserRole type
export type UserRole = 'admin' | 'franchiseOwner' | 'storeManager' | 'kitchenStaff' | 'staff';
  
// Auth context interface
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    // Other auth methods
  }
