export type UserRole = 'admin' | 'editor' | 'viewer';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface User {
  id: string;
  uid?: string; // Útil si usas Firebase o Auth0
  username: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  
  // Configuración de la aplicación
  settings: UserSettings;
  
  // Metadatos para gestión multimedia
  usage: UserUsageStats;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notificationsEnabled: boolean;
  defaultExportFormat: 'mp4' | 'gif' | 'webm';
}

export interface UserUsageStats {
  tier: SubscriptionTier;
  animationsCreated: number;
  storageUsedBytes: number; // Para controlar el peso de los assets multimedia
  maxStorageLimit: number;
}