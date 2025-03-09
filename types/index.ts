/**
 * Central export file for all types used in the application
 * This allows importing from '../types' instead of individual files
 */

// Re-export all types from individual type files
export * from './aiTypes';
export * from './fileTypes';
export * from './projectTypes';
export * from './userTypes';
export * from './suggestionTypes';

// Common shared types that don't fit elsewhere can be defined here
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Status = 'idle' | 'loading' | 'success' | 'error';