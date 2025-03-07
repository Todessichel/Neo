// src/types/index.ts

// Add any missing TypeScript definitions here
declare module 'mammoth' {
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}