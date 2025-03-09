import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for authentication functionality
 * @returns Auth context state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  const { 
    user, 
    isLoading, 
    login, 
    logout, 
    signup,
    resetPassword,
    updateProfile,
    isAuthenticated
  } = context;
  
  return { 
    user, 
    isLoading, 
    login, 
    logout, 
    signup,
    resetPassword,
    updateProfile,
    isAuthenticated
  };
};

export default useAuth;