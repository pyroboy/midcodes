import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType, UserRole } from './authTypes';

// Context creation - not exported as a named export
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Only export the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        // Your authentication check logic here
        // Example: const user = await checkSession();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // Your login logic here
      // Example: const userData = await authService.login(email, password);
      
      // Mock login for example purposes
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: email,
        avatar: '',
        role: email.includes('admin') ? 'admin' as UserRole : 
              email.includes('owner') ? 'franchiseOwner' as UserRole : 
              email.includes('manager') ? 'storeManager' as UserRole : 
              email.includes('staff') ? 'kitchenStaff' as UserRole : 'staff' as UserRole
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (err) {
      console.error('Login failed:', err);
      setError(typeof err === 'string' ? err : 'Failed to login. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Your logout logic here
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export the Context object for use in the hook file
export { AuthContext };
