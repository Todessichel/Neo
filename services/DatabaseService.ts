// Types for database entities
export interface User {
  uid: string;
  email: string;
  projects: string[];
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  created: string;
  lastModified?: string;
}

export interface DocumentData {
  type: string;
  content: any;
  inconsistencies?: Array<{ id: string; text: string; severity: string }>;
  suggestions?: Array<{ id: string; text: string }>;
  implementedSuggestions?: Array<{ id: string; implementedAt: string }>;
  lastModified?: string;
}

export interface DatabaseServiceInterface {
  login(email: string, password: string): Promise<{ uid: string; email: string }>;
  getProjects(userId: string): Promise<Project[]>;
  getDocuments(projectId: string): Promise<Record<string, DocumentData>>;
  saveDocument(projectId: string, docType: string, content: any): Promise<boolean>;
  recordImplementedSuggestion(projectId: string, docType: string, suggestionId: string): Promise<boolean>;
}

/**
 * Service for database operations using browser localStorage for persistence
 */
export class DatabaseService implements DatabaseServiceInterface {
  private users: Record<string, User>;
  private documents: Record<string, Record<string, DocumentData>>;
  private projects: Record<string, Project>;

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
        'canvas': { 
          type: 'canvas', 
          content: {}, 
          inconsistencies: [], 
          suggestions: [] 
        },
        'strategy': { 
          type: 'strategy', 
          content: {}, 
          inconsistencies: [], 
          suggestions: [] 
        },
        'financial': { 
          type: 'financial', 
          content: {}, 
          inconsistencies: [], 
          suggestions: [] 
        },
        'okrs': { 
          type: 'okrs', 
          content: {}, 
          inconsistencies: [], 
          suggestions: [] 
        }
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
          this.users[id].email === email && password === 'password123' // Simple demo password check
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
  public async getProjects(userId: string): Promise<Project[]> {
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
  public async getDocuments(projectId: string): Promise<Record<string, DocumentData>> {
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
  
  /**
   * Create a new project
   */
  public async createProject(userId: string, projectName: string): Promise<Project> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projectId = `project-${Date.now()}`;
        
        // Create the project
        const newProject: Project = {
          id: projectId,
          name: projectName,
          ownerId: userId,
          created: new Date().toISOString()
        };
        
        this.projects[projectId] = newProject;
        
        // Add project to user's projects
        if (!this.users[userId]) {
          throw new Error('User not found');
        }
        
        this.users[userId].projects.push(projectId);
        
        // Initialize empty document structure
        this.documents[projectId] = {
          'canvas': { type: 'canvas', content: {}, inconsistencies: [], suggestions: [] },
          'strategy': { type: 'strategy', content: {}, inconsistencies: [], suggestions: [] },
          'financial': { type: 'financial', content: {}, inconsistencies: [], suggestions: [] },
          'okrs': { type: 'okrs', content: {}, inconsistencies: [], suggestions: [] }
        };
        
        this.saveToStorage();
        resolve(newProject);
      }, 500);
    });
  }
}

// Create singleton instance for use across the application
export const databaseService = new DatabaseService();