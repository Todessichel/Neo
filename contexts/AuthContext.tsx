import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define the user type
interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for user and loading status
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if there's a user in localStorage on initial load
  useEffect(() => {
    const checkAuth = () => {
      try {
        // In a real app, this would check if the user is logged in with your auth provider
        // For now, just check localStorage
        const storedUser = localStorage.getItem('neoUser');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  /**
   * Handle user login
   */
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    
    try {
      // Simulate an API call to a database service
      const db = new DatabaseService();
      const userCredential = await db.login(email, password);
      
      // Format user data
      const userData: User = {
        uid: userCredential.uid,
        email: userCredential.email,
        displayName: userCredential.displayName || undefined,
        photoURL: userCredential.photoURL || undefined
      };
      
      // Store user data
      setUser(userData);
      localStorage.setItem('neoUser', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle user logout
   */
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear local state
      setUser(null);
      localStorage.removeItem('neoUser');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle user signup
   */
  const signup = async (
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<User> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would create a new user in your auth provider
      // For now, simulate a successful signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock user
      const userData: User = {
        uid: `user-${Date.now()}`,
        email,
        displayName: displayName || undefined
      };
      
      // Store user data
      setUser(userData);
      localStorage.setItem('neoUser', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Reset user password
   */
  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would send a password reset email
      // For now, just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Update user profile
   */
  const updateProfile = async (
    displayName?: string, 
    photoURL?: string
  ): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    
    setIsLoading(true);
    
    try {
      // In a real app, this would update the user's profile in your auth provider
      // For now, just update the local state
      const updatedUser = {
        ...user,
        displayName: displayName || user.displayName,
        photoURL: photoURL || user.photoURL
      };
      
      setUser(updatedUser);
      localStorage.setItem('neoUser', JSON.stringify(updatedUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    resetPassword,
    updateProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Simple DatabaseService class to simulate auth functionality
class DatabaseService {
  constructor() {
    // Ensure at least the demo user exists
    if (typeof window !== 'undefined') {
      const users = JSON.parse(localStorage.getItem('neoUsers') || '{}');
      
      if (Object.keys(users).length === 0) {
        const demoUserId = 'demo-user-1';
        users[demoUserId] = {
          uid: demoUserId,
          email: 'demo@example.com',
          password: 'password123', // Not secure, just for demo
          projects: ['project-1', 'project-2']
        };
        
        localStorage.setItem('neoUsers', JSON.stringify(users));
      }
    }
  }
  
  async login(email: string, password: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (typeof window === 'undefined') {
          reject(new Error('Cannot authenticate in server environment'));
          return;
        }
        
        const users = JSON.parse(localStorage.getItem('neoUsers') || '{}');
        
        const userId = Object.keys(users).find(id => 
          users[id].email === email && users[id].password === password
        );
        
        if (userId) {
          resolve({ 
            uid: userId,
            email: users[userId].email,
            displayName: users[userId].displayName || null,
            photoURL: users[userId].photoURL || null
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500); // Simulate network delay
    });
  }
}