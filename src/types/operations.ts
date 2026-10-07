export interface OperationalPolicy {
  refillNowPctThreshold: number; // e.g. 20 (%)
  refillSoonPctThreshold: number; // e.g. 40 (%)
  minDaysBuffer: number; // e.g. 1.0 (days)
  idleCashCostRate: number; // e.g. 5.5 (%) p.a.
  citCostPerStop: number; // e.g. 3500 (BDT ৳)
  truckCapacity: number; // e.g. 25,000,000 (BDT ৳)
}

export const defaultOperationalPolicy: OperationalPolicy = {
  refillNowPctThreshold: 20,
  refillSoonPctThreshold: 40,
  minDaysBuffer: 1.0,
  idleCashCostRate: 5.5,
  citCostPerStop: 3500,
  truckCapacity: 25000000,
};

export interface CassetteDenomination {
  cassetteNumber: number;
  noteValue: 1000 | 500 | 200 | 100;
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
  demandMultiplier: number;
  carrierDelayDays: number;
  affectedClusters: 'all' | 'retail_transit' | 'commercial';
}

export interface CitCarrierContract {
  id: string;
  name: string;
  code: string;
  baseTruckRate: number;
  costPerStop: number;
  maxPayload: number;
  maxStops: number;
  armedGuardLevel: string;
  insuranceLimit: number;
  slaAvailabilityPct: number;
  badgeColor: string;
}

export const DEFAULT_CIT_CARRIERS: CitCarrierContract[] = [
  {
    id: 'brinks',
    name: "Brink's Bangladesh (BGS)",
    code: 'BGS',
    baseTruckRate: 15000,
    costPerStop: 3200,
    maxPayload: 25000000,
    maxStops: 10,
    armedGuardLevel: 'Level 4 Tactical Armed Escort',
    insuranceLimit: 100000000,
    slaAvailabilityPct: 99.8,
    badgeColor: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'g4s',
    name: 'G4S Cash Solutions Bangladesh',
    code: 'G4S',
    baseTruckRate: 12000,
    costPerStop: 3500,
    maxPayload: 20000000,
    maxStops: 8,
    armedGuardLevel: 'Level 3 Armed Transport',
    insuranceLimit: 75000000,
    slaAvailabilityPct: 99.5,
    badgeColor: 'from-red-600 to-rose-700',
  },
  {
    id: 'securex',
    name: 'Securex Vault & Logistics Ltd.',
    code: 'SCX',
    baseTruckRate: 10000,
    costPerStop: 3800,
    maxPayload: 18000000,
    maxStops: 8,
    armedGuardLevel: 'Level 3 Armed Guard',
    insuranceLimit: 50000000,
    slaAvailabilityPct: 99.2,
    badgeColor: 'from-amber-600 to-orange-700',
  },
  {
    id: 'loomis',
    name: 'Loomis Armored Transit BD',
    code: 'LMS',
    baseTruckRate: 13000,
    costPerStop: 3400,
    maxPayload: 22000000,
    maxStops: 9,
    armedGuardLevel: 'Level 4 Heavy Tactical Escort',
    insuranceLimit: 80000000,
    slaAvailabilityPct: 99.6,
    badgeColor: 'from-emerald-600 to-teal-700',
  },
];

export interface LiveSwitchTransaction {
  id: string;
  timestamp: string;
  atmId: string;
  location: string;
  amount: number;
  remainingCashAfter: number;
  pctAfter: number;
  statusAfter: 'Refill Now' | 'Refill Soon' | 'OK';
  isAlert: boolean;
}
