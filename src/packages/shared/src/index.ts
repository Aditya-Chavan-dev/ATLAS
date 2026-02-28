export const VERSION = '2.0.0';

// Re-export all canonical shared types from the types module.
// SAFEGUARD: Always add new types to types.ts first, then re-export here.
// Never define ad-hoc interfaces in this file.
export * from './types';
