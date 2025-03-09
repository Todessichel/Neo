import { DatabaseService } from './DatabaseService';

export interface UserCredentials {
  uid: string;
  email: string;
}

export interface AuthServiceInterface {
  login(email: string, password: string): Promise<UserCredentials>;
  logout(): Promise<void>;
  getCurrentUser(): UserCredentials | null;
}

/**
 * Service for handling authentication
 */
export class AuthService implements AuthServiceInterface {
  private currentUser: UserCredentials | null = null;
  private databaseService: DatabaseService;
  
  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.initializeUser();
  }
  
  /**
   * Initialize user from localStorage if available
   */
  private initializeUser(): void {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('neoCurrentUser');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (e) {
          this.currentUser = null;
          localStorage.removeItem('neoCurrentUser');
        }
      }
    }
  }
  
  /**
   * Get the current user
   */
  public getCurrentUser(): UserCredentials | null {
    return this.currentUser;
  }
  
  /**
   * Log in with email and password
   */
  public async login(email: string, password: string): Promise<UserCredentials> {
    try {
      const user = await this.databaseService.login(email, password);
      this.currentUser = user;
      
      // Save user to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('neoCurrentUser', JSON.stringify(user));
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Log out the current user
   */
  public async logout(): Promise<void> {
    this.currentUser = null;
    
    // Remove user from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('neoCurrentUser');
    }
  }
}

// Create singleton instance
import { databaseService } from './DatabaseService';
export const authService = new AuthService(databaseService);