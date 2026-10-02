export interface OperationalPolicy {
  refillNowPctThreshold: number; // e.g. 20 (%)
  refillSoonPctThreshold: number; // e.g. 40 (%)
  minDaysBuffer: number; // e.g. 1.0 (days)
  idleCashCostRate: number; // e.g. 5.5 (%) p.a.
  citCostPerStop: number; // e.g. 350 ($)
  truckCapacity: number; // e.g. 15,000,000 ($)
}

export const defaultOperationalPolicy: OperationalPolicy = {
  refillNowPctThreshold: 20,
  refillSoonPctThreshold: 40,
  minDaysBuffer: 1.0,
  idleCashCostRate: 5.5,
  citCostPerStop: 350,
  truckCapacity: 15000000,
};

export interface CassetteDenomination {
  cassetteNumber: number;
  noteValue: 100 | 50 | 20 | 10;
  billCount: number;
  totalValue: number;
  strapsCount: number; // 100 notes per strap
  capacityUsagePct: number;
}

export interface DayForecastPoint {
  date: string;
  dayName: string;
  isWeekend: boolean;
  isPayday: boolean;
  projectedDemand: number;
  projectedClosingCash: number;
  projectedPct: number;
  status: 'Refill Now' | 'Refill Soon' | 'OK';
}

export interface ForwardDepletionResult {
  atmId: string;
  startingBalance: number;
  capacity: number;
  dailyPoints: DayForecastPoint[];
  cashOutDate: string | null;
  criticalDate: string | null;
  total7DayDemand: number;
}

export interface RegionalCluster {
  id: string;
  name: string;
  shortName?: string;
  codePrefix: string;
  atmCount: number;
  totalCapacity: number;
  totalRemainingCash: number;
  utilizationPct: number;
  urgentCount: number;
  criticalCount: number;
  totalRefillNeeded: number;
}

export interface StressScenario {
  id: string;
  name: string;
  description: string;
  demandMultiplier: number; // e.g. 1.35 = +35%
  carrierDelayDays: number; // e.g. 2 days
  affectedClusters: 'all' | 'retail_transit' | 'commercial';
}
