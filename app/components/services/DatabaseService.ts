// services/DatabaseService.ts
// Mock database service to replace Firebase
export class DatabaseService {
    users: any;
    documents: any;
    projects: any;
  
    constructor() {
      // Initialize with empty objects
      this.users = {};
      this.documents = {};
      this.projects = {};
    }
    
    initializeData() {
      // Only run in browser environment
      if (typeof window === 'undefined') return;
      
      // Simulate database with localStorage
      this.users = JSON.parse(localStorage.getItem('neoUsers') || '{}');
      this.documents = JSON.parse(localStorage.getItem('neoDocuments') || '{}');
      this.projects = JSON.parse(localStorage.getItem('neoProjects') || '{}');
      
      // Default demo user
      if (Object.keys(this.users).length === 0) {
        const demoUserId = 'demo-user-1';
        this.users[demoUserId] = {
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
    
    saveToStorage() {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem('neoUsers', JSON.stringify(this.users));
      localStorage.setItem('neoDocuments', JSON.stringify(this.documents));
      localStorage.setItem('neoProjects', JSON.stringify(this.projects));
    }
    
    async login(email: string, password: string) {
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
    
    async getProjects(userId: string) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const projectIds = this.users[userId]?.projects || [];
          const userProjects = projectIds.map((id: string) => this.projects[id]);
          resolve(userProjects);
        }, 300);
      });
    }
    
    async getDocuments(projectId: string) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const projectDocs = this.documents[projectId] || {};
          resolve(projectDocs);
        }, 300);
      });
    }
    
    async saveDocument(projectId: string, docType: string, content: any) {
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
    
    async recordImplementedSuggestion(projectId: string, docType: string, suggestionId: string) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (!this.documents[projectId]?.[docType]) return resolve(false);
          
          if (!this.documents[projectId][docType].implementedSuggestions) {
            this.documents[projectId][docType].implementedSuggestions = [];
          }
          
          this.documents[projectId][docType].implementedSuggestions.push({
            id: suggestionId,
            implementedAt: new Date().toISOString()
          });
          
          this.saveToStorage();
          resolve(true);
        }, 300);
      });
    }
  }