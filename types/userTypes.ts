// src/types/userTypes.ts
export interface User {
  uid: string;
  email: string;
  projects?: string[]; // Optional array of project IDs
}