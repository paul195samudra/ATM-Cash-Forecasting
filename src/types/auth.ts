export type UserRole =
  | 'Cash Operations Director'
  | 'Head of CIT Logistics'
  | 'Treasury Liquidity Analyst'
  | 'Branch Vault Officer'
  | 'Security & Compliance Auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  badgeId: string;
  createdAt: string;
  lastLogin?: string;
  avatarColor?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
