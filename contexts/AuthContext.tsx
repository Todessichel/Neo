import React, { createContext, useState, useEffect, ReactNode } from 'react';

// DatabaseService simulation for auth
class DatabaseService {
  private users: Record<string, any>;
  private documents: Record<string, any>;
  private projects: Record<string, any>;

  constructor() {
    // Initialize with empty objects
    this.users = {};
    this.documents = {};
    this.projects = {};
    
    // Initialize from localStorage if in browser
    if (typeof window !== 'undefined') {
      this.initializeData();
    }
  }
  
  /**
   * Initialize data from localStorage or create demo data if none exists
   */
  public initializeData(): void {
    // Simulate database with localStorage
    this.users = JSON.parse(localStorage.getItem('neoUsers') || '{}');
    this.documents = JSON.parse(localStorage.getItem('neoDocuments') || '{}');
    this.projects = JSON.parse(localStorage.getItem('neoProjects') || '{}');
    
    // Default demo user if none exists
    if (Object.keys(this.users).length === 0) {
      const demoUserId = 'demo-user-1';
      this.users[demoUserId] = {
        uid: demoUserId,
        email: 'demo@example.com',
        password: 'password123', // Not secure, just for demo
        projects: ['project-1', 'project-2']
      };
      
      this.projects['project-1'] = {
        id: 'project-1',
        name: 'NEO Strategy Demo',
        ownerId: demoUserId,
        created: new Date().toISOString()
      };
      
      this.projects['project-2'] = {
        id: 'project-2',
        name: 'Product Launch Strategy',
        ownerId: demoUserId,
        created: new Date().toISOString()
      };
      
      // Initialize document structure
      this.documents['project-1'] = {
        'canvas': { type: 'canvas', content: {}, inconsistencies: [], suggestions: [] },
        'strategy': { type: 'strategy', content: {}, inconsistencies: [], suggestions: [] },
        'financial': { type: 'financial', content: {}, inconsistencies: [], suggestions: [] },
        'okrs': { type: 'okrs', content: {}, inconsistencies: [], suggestions: [] }
      };
      
      this.saveToStorage();
    }
  }
  
  /**
   * Save current state to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('neoUsers', JSON.stringify(this.users));
    localStorage.setItem('neoDocuments', JSON.stringify(this.documents));
    localStorage.setItem('neoProjects', JSON.stringify(this.projects));
  }
  
  /**
   * Simulate login with email/password
   */
  public async login(email: string, password: string): Promise<{ uid: string; email: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userId = Object.keys(this.users).find(id => 
          this.users[id].email === email && this.users[id].password === password
        );
        
        if (userId) {
          resolve({ 
            uid: userId,
            email: this.users[userId].email
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500); // Simulate network delay
    });
  }
  
  /**
   * Get all projects for a user
   */
  public async getProjects(userId: string): Promise<any[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projectIds = this.users[userId]?.projects || [];
        const userProjects = projectIds
          .map(id => this.projects[id])
          .filter(project => project); // Filter out any undefined projects
          
        resolve(userProjects);
      }, 300);
    });
  }
  
  /**
   * Get all documents for a project
   */
  public async getDocuments(projectId: string): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projectDocs = this.documents[projectId] || {};
        resolve(projectDocs);
      }, 300);
    });
  }
  
  /**
   * Save document content
   */
  public async saveDocument(projectId: string, docType: string, content: any): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.documents[projectId]) {
          this.documents[projectId] = {};
        }
        
        this.documents[projectId][docType] = {
          ...(this.documents[projectId][docType] || {}),
          type: docType,
          content: content,
          lastModified: new Date().toISOString()
        };
        
        this.saveToStorage();
        resolve(true);
      }, 500);
    });
  }
  
  /**
   * Record when a suggestion has been implemented
   */
  public async recordImplementedSuggestion(projectId: string, docType: string, suggestionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.documents[projectId]?.[docType]) return resolve(false);
        
        if (!this.documents[projectId][docType].implementedSuggestions) {
          this.documents[projectId][docType].implementedSuggestions = [];
        }
        
        this.documents[projectId][docType].implementedSuggestions?.push({
          id: suggestionId,
          implementedAt: new Date().toISOString()
        });
        
        this.saveToStorage();
        resolve(true);
      }, 300);
    });
  }
}

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
  db: DatabaseService | null;
  loginEmail: string;
  loginPassword: string;
  setLoginEmail: React.Dispatch<React.SetStateAction<string>>;
  setLoginPassword: React.Dispatch<React.SetStateAction<string>>;
  showLoginModal: boolean;
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  loadProjects: (userId: string) => Promise<void>;
  projectList: any[];
  setProjectList: React.Dispatch<React.SetStateAction<any[]>>;
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
  const [db, setDb] = useState<DatabaseService | null>(null);
  const [projectList, setProjectList] = useState<any[]>([]);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Initialize the database service on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const database = new DatabaseService();
      setDb(database);
      setIsLoading(false);
    }
  }, []);
  
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
    
    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, []);
  
  /**
   * Handle user login
   */
  const login = async (email: string, password: string): Promise<User> => {
    if (!db) throw new Error('Database not initialized');
    
    setIsLoading(true);
    
    try {
      const userCredential = await db.login(email, password);
      
      // Format user data
      const userData: User = {
        uid: userCredential.uid,
        email: userCredential.email,
      };
      
      // Store user data
      setUser(userData);
      localStorage.setItem('neoUser', JSON.stringify(userData));
      
      // Load user's projects
      await loadProjects(userData.uid);
      
      // Close the login modal
      setShowLoginModal(false);
      
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
      setProjectList([]);
      localStorage.removeItem('neoUser');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Load projects for a user
   */
  const loadProjects = async (userId: string): Promise<void> => {
    if (!userId || !db) return;
    
    try {
      setIsLoading(true);
      const projects = await db.getProjects(userId);
      setProjectList(projects);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading projects:", error);
      setIsLoading(false);
    }
  };
  
  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    db,
    loginEmail,
    loginPassword,
    setLoginEmail,
    setLoginPassword,
    showLoginModal,
    setShowLoginModal,
    login,
    logout,
    loadProjects,
    projectList,
    setProjectList
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};