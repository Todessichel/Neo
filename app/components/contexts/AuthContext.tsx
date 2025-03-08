import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserCredentials } from '../services/AuthService';

interface AuthContextType {
  user: UserCredentials | null;
  isLoading: boolean;
  loginEmail: string;
  loginPassword: string;
  showLoginModal: boolean;
  setLoginEmail: (email: string) => void;
  setLoginPassword: (password: string) => void;
  setShowLoginModal: (show: boolean) => void;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  loginEmail: '',
  loginPassword: '',
  showLoginModal: false,
  setLoginEmail: () => {},
  setLoginPassword: () => {},
  setShowLoginModal: () => {},
  loginUser: async () => {},
  logoutUser: async () => {},
});

// Context provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserCredentials | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Check for existing user on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Login function
  const loginUser = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await authService.login(email, password);
      setUser(userCredential);
      setShowLoginModal(false);
      // Clear form fields after successful login
      setLoginEmail('');
      setLoginPassword('');
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logoutUser = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginEmail,
        loginPassword,
        showLoginModal,
        setLoginEmail,
        setLoginPassword,
        setShowLoginModal,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);