// useAuth.ts
import { useState, useEffect } from 'react';
import { DatabaseService } from '../services/DatabaseService';

export interface User {
  uid: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  loginEmail: string;
  loginPassword: string;
  showLoginModal: boolean;
}

export interface AuthActions {
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  setLoginEmail: (email: string) => void;
  setLoginPassword: (password: string) => void;
  setShowLoginModal: (show: boolean) => void;
}

export const useAuth = (db: DatabaseService | null): [AuthState, AuthActions] => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  
  // Check for existing session on load
  useEffect(() => {
    const checkExistingSession = () => {
      if (typeof window === 'undefined' || !db) return;
      
      const storedUser = localStorage.getItem('neoUser');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('neoUser');
        }
      }
    };
    
    checkExistingSession();
  }, [db]);
  
  const loginUser = async (email: string, password: string) => {
    if (!db) return;
    
    try {
      setIsLoading(true);
      const userCredential = await db.login(email, password);
      
      // Store user in state and localStorage for persistence
      setUser(userCredential);
      localStorage.setItem('neoUser', JSON.stringify(userCredential));
      
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logoutUser = async () => {
    try {
      setUser(null);
      localStorage.removeItem('neoUser');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return [
    { user, isLoading, loginEmail, loginPassword, showLoginModal },
    { loginUser, logoutUser, setLoginEmail, setLoginPassword, setShowLoginModal }
  ];
};