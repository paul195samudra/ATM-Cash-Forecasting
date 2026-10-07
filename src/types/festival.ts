export interface FestivalSurgePhase {
  id: string;
  name: string;
  daysToFestival: string;
  demandMultiplier: number;
  description: string;
  c1000Pct: number;
  c500Pct: number;
  c200Pct: number;
  c100Pct: number;
  keyAction: string;
}

export interface FestivalEvent {
  id: string;
  name: string;
  bengaliName: string;
  season: string;
  primaryZone: string;
  branchClosureDurationDays: number;
  historicalPeakMultiplier: number;
  description: string;
  phases: FestivalSurgePhase[];
}

export interface FestivalSurgeState {
  isActive: boolean;
  selectedFestivalId: string;
  selectedPhaseId: string;
  customMultiplier: number;
  targetCorridors: 'all' | 'cattle_markets_transit' | 'commercial_shopping' | 'rural_hubs';
  prioritize1000Notes: boolean;
}
