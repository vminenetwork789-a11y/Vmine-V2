export interface PlanState {
  id: string; // e.g., '1', '2'
  name: string; // e.g., 'Rank 1', 'Rank 2'
  cost: number; // e.g., 5, 10, 20
  active: boolean;
  matrix: boolean[]; // Array of 4 booleans representing filled slots
  rebornSlots?: boolean[]; // Array of booleans indicating if slot was filled by Reborn ID
}

export interface User {
  id: number;
  walletAddress: string;
  referrerId: number | null;
  downlinesCount: number;
  totalIncome: number;
  planLevel: number;
  plans: { [planId: string]: { active: boolean; matrix: boolean[]; rebornSlots?: boolean[] } };
}

export interface SystemStats {
  totalAccounts: number;
  totalUsdtInvested: number;
}

export interface HistoryRecord {
  id: string;
  userId: number;
  planId: string;
  cost: number;
  type: 'register' | 'buy' | 'autoup';
  timestamp: string;
  txHash: string;
}

export type Language = 'EN' | 'TH' | 'ZH' | 'HI' | 'VI' | 'MY' | 'MS' | 'KM';
