import { ATMRecord } from '../data/atmData';
import {
  CassetteDenomination,
  DayForecastPoint,
  ForwardDepletionResult,
  OperationalPolicy,
  RegionalCluster,
  StressScenario,
} from '../types/operations';

// Map of regional 2-3 letter branch prefixes to the 12 inter-district CIT corridors
export interface CorridorInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  division: string;
  description: string;
}

export const CORRIDORS: Record<string, CorridorInfo> = {
  DHA_CORE: {
    id: 'DHA_CORE',
    code: 'DHA_CORE',
    name: 'Dhaka Central & Motijheel Banking Core',
    shortName: 'Dhaka Core',
    division: 'Dhaka',
    description: 'Corporate HQs, Motijheel Financial District, Old Dhaka, and commercial arteries.',
  },
  DHA_NORTH: {
    id: 'DHA_NORTH',
    code: 'DHA_NORTH',
    name: 'Dhaka North & Airport Transit Hub',
    shortName: 'Dhaka North',
    division: 'Dhaka',
    description: 'Uttara, Mirpur, Cantonment, Tongi, and Gazipur industrial belt.',
  },
  DHA_DIPLO: {
    id: 'DHA_DIPLO',
    code: 'DHA_DIPLO',
    name: 'Dhaka Diplomatic & Financial Hub',
    shortName: 'Dhaka Diplomatic',
    division: 'Dhaka',
    description: 'Gulshan, Banani, Baridhara, Bashundhara, and Mohakhali tech corridor.',
  },
  DHA_WEST: {
    id: 'DHA_WEST',
    code: 'DHA_WEST',
    name: 'Dhaka South-West & Residential',
    shortName: 'Dhaka West',
    division: 'Dhaka',
    description: 'Mohammadpur, Dhanmondi, Elephant Road, and residential transit.',
  },
  CTG_PORT: {
    id: 'CTG_PORT',
    code: 'CTG_PORT',
    name: 'Chittagong Port & Maritime Corridor',
    shortName: 'Chittagong Port',
    division: 'Chittagong',
    description: 'Agrabad Commercial Core, Port Access, CEPZ, and CDA Avenue.',
  },
  COX_COAST: {
    id: 'COX_COAST',
    code: 'COX_COAST',
    name: 'Cox\'s Bazar Coastal Highway',
    shortName: 'Cox\'s Bazar',
    division: 'Chittagong',
    description: 'Tourist hotels, beach strip, and Teknaf border trade corridor.',
  },
  SYL_VALLEY: {
    id: 'SYL_VALLEY',
    code: 'SYL_VALLEY',
    name: 'Sylhet & Surma Valley Corridor',
    shortName: 'Sylhet Valley',
    division: 'Sylhet',
    description: 'Sylhet City commercial centers, Zindabazar, and Sreemangal tea estates.',
  },
  COM_FENI: {
    id: 'COM_FENI',
    code: 'COM_FENI',
    name: 'Comilla & Feni Highway Transit',
    shortName: 'Comilla-Feni',
    division: 'Chittagong',
    description: 'Grand Trunk highway link connecting Dhaka to Chittagong.',
  },
  MYM_TANGAIL: {
    id: 'MYM_TANGAIL',
    code: 'MYM_TANGAIL',
    name: 'Mymensingh & North-Central Gateway',
    shortName: 'Mymensingh',
    division: 'Mymensingh',
    description: 'Agricultural university belt and Tangail textile transit corridor.',
  },
  RAJ_BOGRA: {
    id: 'RAJ_BOGRA',
    code: 'RAJ_BOGRA',
    name: 'Rajshahi & North-West Agricultural Hub',
    shortName: 'Rajshahi-Bogra',
    division: 'Rajshahi',
    description: 'Rajshahi Silk City, Bogra transit gateway, Dinajpur, and Pabna.',
  },
  KHU_JESSORE: {
    id: 'KHU_JESSORE',
    code: 'KHU_JESSORE',
    name: 'Khulna & South-West Land Port',
    shortName: 'Khulna-Jessore',
    division: 'Khulna',
    description: 'Mongla Port hinterland, Jessore border, and Benapole customs point.',
  },
  BAR_PADMA: {
    id: 'BAR_PADMA',
    code: 'BAR_PADMA',
    name: 'Barisal Riverine & Padma Transit',
    shortName: 'Barisal-Padma',
    division: 'Barisal',
    description: 'Padma Bridge southern corridor, Barisal river ports, and Faridpur.',
  },
};

const PREFIX_TO_CORRIDOR: Record<string, string> = {
  // Dhaka North & Airport
  UTR: 'DHA_NORTH', MIR: 'DHA_NORTH', POL: 'DHA_NORTH', CAN: 'DHA_NORTH', ROK: 'DHA_NORTH',
  TON: 'DHA_NORTH', GAZ: 'DHA_NORTH', SVR: 'DHA_NORTH', JOY: 'DHA_NORTH', BNN: 'DHA_NORTH',
  ASH: 'DHA_NORTH', GAR: 'DHA_NORTH', BSK: 'DHA_NORTH',

  // Dhaka Diplomatic & Tech
  GUL: 'DHA_DIPLO', BAN: 'DHA_DIPLO', BRD: 'DHA_DIPLO', BSN: 'DHA_DIPLO', BAD: 'DHA_DIPLO',
  MOH: 'DHA_DIPLO', MDH: 'DHA_DIPLO', KLM: 'DHA_DIPLO', TAJ: 'DHA_DIPLO', BOK: 'DHA_DIPLO',
  BON: 'DHA_DIPLO',

  // Dhaka West & Residential
  ELP: 'DHA_WEST', LMH: 'DHA_WEST', ZIN: 'DHA_WEST', JIN: 'DHA_WEST', SAH: 'DHA_WEST',
  ATI: 'DHA_WEST', PRL: 'DHA_WEST', PRA: 'DHA_WEST', PRI: 'DHA_WEST', RON: 'DHA_WEST',

  // Dhaka Central & Commercial Core
  DHA: 'DHA_CORE', MOT: 'DHA_CORE', SHY: 'DHA_CORE', WAR: 'DHA_CORE', JTR: 'DHA_CORE',
  MAL: 'DHA_CORE', KAR: 'DHA_CORE', BIJ: 'DHA_CORE', PTL: 'DHA_CORE', BDT: 'DHA_CORE',
  SAN: 'DHA_CORE', CHW: 'DHA_CORE', ISL: 'DHA_CORE', PLZ: 'DHA_CORE', NAY: 'DHA_CORE',
  VIP: 'DHA_CORE', SAI: 'DHA_CORE', KHI: 'DHA_CORE', STR: 'DHA_CORE', MOG: 'DHA_CORE',
  NAR: 'DHA_CORE',

  // Chittagong Port & Maritime
  CTG: 'CTG_PORT', AGR: 'CTG_PORT', CEP: 'CTG_PORT', CDA: 'CTG_PORT', NSR: 'CTG_PORT',
  CHT: 'CTG_PORT', SIT: 'CTG_PORT', PAH: 'CTG_PORT', CHM: 'CTG_PORT', CCB: 'CTG_PORT',
  KHA: 'CTG_PORT', DAR: 'CTG_PORT', CHA: 'CTG_PORT', SED: 'CTG_PORT', KAD: 'CTG_PORT',
  HAT: 'CTG_PORT', EST: 'CTG_PORT', RDS: 'CTG_PORT', PCR: 'CTG_PORT', IMM: 'CTG_PORT',
  JUB: 'CTG_PORT',

  // Cox's Bazar Coastal
  COX: 'COX_COAST', TEK: 'COX_COAST', LOH: 'COX_COAST', CHO: 'COX_COAST',

  // Sylhet & Surma Tea
  SYL: 'SYL_VALLEY', SRE: 'SYL_VALLEY', HOB: 'SYL_VALLEY', MOU: 'SYL_VALLEY',

  // Comilla & Feni Transit
  COM: 'COM_FENI', FEN: 'COM_FENI', BRA: 'COM_FENI', KLT: 'COM_FENI', NSA: 'COM_FENI',

  // Mymensingh & North-Central
  MYM: 'MYM_TANGAIL', TAN: 'MYM_TANGAIL', DEW: 'MYM_TANGAIL', BHA: 'MYM_TANGAIL',

  // Rajshahi & North-West
  RAJ: 'RAJ_BOGRA', BOG: 'RAJ_BOGRA', DIN: 'RAJ_BOGRA', PAB: 'RAJ_BOGRA', NAO: 'RAJ_BOGRA',
  SIR: 'RAJ_BOGRA', KMR: 'RAJ_BOGRA', GOL: 'RAJ_BOGRA', LUC: 'RAJ_BOGRA', MOM: 'RAJ_BOGRA',
  BOL: 'RAJ_BOGRA', AST: 'RAJ_BOGRA', PAG: 'RAJ_BOGRA', AND: 'RAJ_BOGRA', PAN: 'RAJ_BOGRA',
  BOR: 'RAJ_BOGRA',

  // Khulna & South-West
  KHU: 'KHU_JESSORE', JES: 'KHU_JESSORE', BEN: 'KHU_JESSORE', KUS: 'KHU_JESSORE',
  SAT: 'KHU_JESSORE', JHE: 'KHU_JESSORE', KAZ: 'KHU_JESSORE', SGN: 'KHU_JESSORE',
  GAN: 'KHU_JESSORE', DOH: 'KHU_JESSORE', KUL: 'KHU_JESSORE',

  // Barisal & Padma Riverine
  BAR: 'BAR_PADMA', MAD: 'BAR_PADMA', FAR: 'BAR_PADMA', PAT: 'BAR_PADMA', FRD: 'BAR_PADMA',
  BHL: 'BAR_PADMA', CHP: 'BAR_PADMA', MON: 'BAR_PADMA', NAZ: 'BAR_PADMA',
  SHI: 'BAR_PADMA', KAK: 'BAR_PADMA'
};

/**
 * Extracts clean regional identification from ATM ID
 */
export function getAtmRegion(atmId: string): { code: string; name: string; shortName: string } {
  const clean = atmId.replace(/^ABB/, '');
  const prefix = clean.slice(0, 3).toUpperCase();
  const corridorKey = PREFIX_TO_CORRIDOR[prefix] || 'DHA_CORE';
  const corridor = CORRIDORS[corridorKey] || CORRIDORS.DHA_CORE;

  return {
    code: corridor.code,
    name: corridor.name,
    shortName: corridor.shortName,
  };
}

/**
 * Evaluates dynamic status for an ATM given configurable policy thresholds
 * Follows exact bank rounding: percentage is rounded to 1 decimal place first
 * Refill suggestion rounds up to CASH_UNIT = 500
 */
export function evaluateAtmPolicyStatus(
  atm: ATMRecord,
  policy: OperationalPolicy
): { status: 'Refill Now' | 'Refill Soon' | 'OK'; refillSuggestion: number } {
  // Round percentage to 1 decimal place matching bank reporting standard
  const pct = Math.round((atm.Estimated_Cash_Remaining / (atm.ATM_Capacity || 1)) * 1000) / 10;

  let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';

  if (pct <= policy.refillNowPctThreshold) {
    status = 'Refill Now';
  } else if (pct <= policy.refillSoonPctThreshold) {
    status = 'Refill Soon';
  }

  // Refill suggestion rounds up to CASH_UNIT = 500
  const rawNeeded = Math.max(0, atm.ATM_Capacity - atm.Estimated_Cash_Remaining);
  const refillSuggestion = Math.ceil(rawNeeded / 500) * 500;

  return { status, refillSuggestion };
}

/**
 * Aggregates all ATMs into geographical regional clusters
 */
export function groupAtmsByRegion(
  atms: ATMRecord[],
  policy: OperationalPolicy
): RegionalCluster[] {
  const clusterMap: Record<string, ATMRecord[]> = {};

  atms.forEach((a) => {
    const { code } = getAtmRegion(a.ATMID);
    if (!clusterMap[code]) clusterMap[code] = [];
    clusterMap[code].push(a);
  });

  return Object.entries(clusterMap)
    .map(([code, list]) => {
      const corridor = CORRIDORS[code] || {
        name: `Regional Corridor ${code}`,
        shortName: code,
      };
      const name = corridor.name;
      const shortName = corridor.shortName;
      const totalCapacity = list.reduce((sum, item) => sum + item.ATM_Capacity, 0);
      const totalRemainingCash = list.reduce(
        (sum, item) => sum + item.Estimated_Cash_Remaining,
        0
      );
      const totalRefillNeeded = list.reduce(
        (sum, item) => sum + item.Refill_Suggestion_Amount,
        0
      );

      const criticalCount = list.filter((item) => {
        const pct =
          Math.round((item.Estimated_Cash_Remaining / (item.ATM_Capacity || 1)) * 1000) / 10;
        return pct <= policy.refillNowPctThreshold;
      }).length;

      const urgentCount = list.filter((item) => {
        const pct =
          Math.round((item.Estimated_Cash_Remaining / (item.ATM_Capacity || 1)) * 1000) / 10;
        return pct <= policy.refillSoonPctThreshold && pct > policy.refillNowPctThreshold;
      }).length;

      const utilizationPct =
        totalCapacity > 0 ? (totalRemainingCash / totalCapacity) * 100 : 0;

      return {
        id: code,
        name,
        shortName,
        codePrefix: code,
        atmCount: list.length,
        totalCapacity,
        totalRemainingCash,
        utilizationPct,
        criticalCount,
        urgentCount,
        totalRefillNeeded,
      };
    })
    .sort((a, b) => b.criticalCount - a.criticalCount || b.atmCount - a.atmCount);
}

/**
 * Forward 7-Day Depletion Trajectory Projector
 */
export function calculateForwardDepletion(
  atm: ATMRecord,
  policy: OperationalPolicy,
  demandMultiplier: number = 1.0,
  startDateStr: string = '2024-10-28'
): ForwardDepletionResult {
  const startDate = new Date(startDateStr);
  const baseDemand = atm.Predicted_Demand || (atm.ATM_Capacity * 0.18);
  const capacity = atm.ATM_Capacity;
  let runningCash = atm.Estimated_Cash_Remaining;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyPoints: DayForecastPoint[] = [];

  let cashOutDate: string | null = null;
  let criticalDate: string | null = null;
  let total7DayDemand = 0;

  for (let i = 0; i < 7; i++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + i);

    const dayOfWeek = curDate.getDay();
    const dayName = dayNames[dayOfWeek];
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday in commercial week
    const dayOfMonth = curDate.getDate();
    const isPayday = dayOfMonth >= 28 || dayOfMonth <= 2 || dayOfMonth === 15;

    // Day of week seasonality factors
    let dayMultiplier = 1.0;
    if (dayOfWeek === 5) dayMultiplier = 1.35; // Friday shopping peak
    else if (dayOfWeek === 6) dayMultiplier = 1.25; // Saturday retail draw
    else if (dayOfWeek === 0) dayMultiplier = 1.10; // Sunday
    else if (dayOfWeek === 1) dayMultiplier = 0.90; // Monday low
    else if (dayOfWeek === 4) dayMultiplier = 1.15; // Thursday ramp

    if (isPayday) dayMultiplier *= 1.20;

    const projectedDayDemand = Math.round(baseDemand * dayMultiplier * demandMultiplier);
    total7DayDemand += projectedDayDemand;

    runningCash = Math.max(0, runningCash - projectedDayDemand);
    const projectedPct = Math.round((runningCash / (capacity || 1)) * 1000) / 10;

    let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
    if (projectedPct <= policy.refillNowPctThreshold || runningCash <= 0) {
      status = 'Refill Now';
      if (!criticalDate) {
        criticalDate = curDate.toISOString().slice(0, 10);
      }
    } else if (projectedPct <= policy.refillSoonPctThreshold) {
      status = 'Refill Soon';
    }

    if (runningCash <= 0 && !cashOutDate) {
      cashOutDate = curDate.toISOString().slice(0, 10);
    }

    dailyPoints.push({
      date: curDate.toISOString().slice(0, 10),
      dayName,
      isWeekend,
      isPayday,
      projectedDemand: projectedDayDemand,
      projectedClosingCash: runningCash,
      projectedPct,
      status,
    });
  }

  return {
    atmId: atm.ATMID,
    startingBalance: atm.Estimated_Cash_Remaining,
    capacity,
    dailyPoints,
    cashOutDate,
    criticalDate,
    total7DayDemand,
  };
}

/**
 * Commercial 4-Cassette Mechanical Denomination Calculator
 * Dynamically assigns appropriate note denominations based on vault capacity and load,
 * respecting physical cassette caps (max 3,000 notes per cassette) and ensuring
 * the sum of the 4 cassettes EXACTLY matches the authorized load.
 */
export function calculateCassetteBreakdown(refillAmount: number): CassetteDenomination[] {
  // Round to CASH_UNIT = 500
  const target = Math.max(0, Math.round(refillAmount / 500) * 500);
  const MAX_NOTES_PER_CASSETTE = 3000;

  // Standard Bangladesh Bank ATM denominations: ৳1,000, ৳500, ৳200, ৳100
  let denoms: [1000 | 500 | 200 | 100, 1000 | 500 | 200 | 100, 1000 | 500 | 200 | 100, 1000 | 500 | 200 | 100];
  let shares: [number, number, number];

  if (target >= 1200000) {
    denoms = [1000, 1000, 500, 500];
    shares = [0.40, 0.35, 0.15];
  } else if (target >= 600000) {
    denoms = [1000, 500, 500, 200];
    shares = [0.45, 0.30, 0.15];
  } else {
    denoms = [1000, 500, 200, 100];
    shares = [0.50, 0.30, 0.12];
  }

  let remaining = target;
  const result: CassetteDenomination[] = [];

  // Distribute across first 3 cassettes rounded to straps of 100 notes
  for (let i = 0; i < 3; i++) {
    const d = denoms[i];
    const desired = target * shares[i];
    // Round to nearest 100 notes
    let notes = Math.min(MAX_NOTES_PER_CASSETTE, Math.round(desired / (d * 100)) * 100);
    let val = notes * d;
    if (val > remaining) {
      val = Math.floor(remaining / (d * 100)) * (d * 100);
      notes = val / d;
    }
    const straps = Math.floor(notes / 100);
    remaining -= val;

    result.push({
      cassetteNumber: i + 1,
      noteValue: d,
      billCount: notes,
      totalValue: val,
      strapsCount: straps,
      capacityUsagePct: Math.min(100, Math.round((notes / MAX_NOTES_PER_CASSETTE) * 100)),
    });
  }

  // Cassette 4 receives the exact remaining balance
  const d4 = denoms[3];
  let notes4 = Math.floor(remaining / d4);
  let val4 = notes4 * d4;
  let straps4 = Math.floor(notes4 / 100);
  remaining -= val4;

  // If there is any remaining Taka balance (e.g. from smaller bill values),
  // allocate notes to make the sum EXACTLY match target
  if (remaining > 0) {
    for (let i = result.length - 1; i >= 0; i--) {
      const d = result[i].noteValue;
      const addNotes = Math.floor(remaining / d);
      if (addNotes > 0) {
        result[i].billCount += addNotes;
        result[i].totalValue += addNotes * d;
        result[i].strapsCount = Math.floor(result[i].billCount / 100);
        result[i].capacityUsagePct = Math.min(
          100,
          Math.round((result[i].billCount / MAX_NOTES_PER_CASSETTE) * 100)
        );
        remaining -= addNotes * d;
      }
    }
  }

  result.push({
    cassetteNumber: 4,
    noteValue: d4,
    billCount: notes4,
    totalValue: val4,
    strapsCount: straps4,
    capacityUsagePct: Math.min(100, Math.round((notes4 / MAX_NOTES_PER_CASSETTE) * 100)),
  });

  return result;
}

/**
 * Fleet-Wide Cash Shock & Stress Testing Simulator
 */
export function runFleetStressTest(
  atms: ATMRecord[],
  scenario: StressScenario,
  policy: OperationalPolicy
) {
  let baselineDryCount = 0;
  let stressedDryCount = 0;
  let totalBaselineRefill = 0;
  let totalStressedRefill = 0;
  let potentialLostInterchange = 0;

  const stressedAtms = atms.map((atm) => {
    const isBaselineDry =
      atm.Estimated_Cash_Remaining <= 0 ||
      atm.Cash_Remaining_Pct <= policy.refillNowPctThreshold;
    if (isBaselineDry) baselineDryCount++;
    totalBaselineRefill += atm.Refill_Suggestion_Amount;

    // Simulate scenario withdrawal shock
    const dailyDemand = atm.Predicted_Demand * scenario.demandMultiplier;
    const delayedDays = scenario.carrierDelayDays;
    const cumulativeDrain = dailyDemand * Math.max(1, delayedDays + 1);

    const stressedCash = Math.max(0, atm.Estimated_Cash_Remaining - cumulativeDrain);
    const stressedPct = Math.round((stressedCash / (atm.ATM_Capacity || 1)) * 1000) / 10;
    const stressedDays = Math.round((stressedCash / (dailyDemand || 1)) * 10) / 10;

    let stressedStatus: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
    if (stressedPct <= policy.refillNowPctThreshold || stressedCash <= 0) {
      stressedStatus = 'Refill Now';
      stressedDryCount++;
      potentialLostInterchange += dailyDemand * 0.025; // 2.5% lost fee margin
    } else if (stressedPct <= policy.refillSoonPctThreshold) {
      stressedStatus = 'Refill Soon';
    }

    const rawNeeded = Math.max(0, atm.ATM_Capacity - stressedCash);
    const stressedRefillNeeded = Math.ceil(rawNeeded / 500) * 500;
    totalStressedRefill += stressedRefillNeeded;

    return {
      ...atm,
      stressedCash,
      stressedPct,
      stressedDays,
      stressedStatus,
      stressedRefillNeeded,
      cashDrainDelta: cumulativeDrain,
    };
  });

  return {
    baselineDryCount,
    stressedDryCount,
    deltaDryCount: Math.max(0, stressedDryCount - baselineDryCount),
    totalBaselineRefill,
    totalStressedRefill,
    additionalCashRequired: Math.max(0, totalStressedRefill - totalBaselineRefill),
    potentialLostInterchange: Math.round(potentialLostInterchange),
    stressedAtms: stressedAtms.sort((a, b) => a.stressedDays - b.stressedDays),
  };
}

/**
 * Recommended ৳1,000 and ৳500 note distribution for replenishing demand
 */
export interface NoteDenominationRefill {
  totalAmount: number;
  notes1000Count: number;
  notes1000Value: number;
  notes1000Straps: number; // 100 notes per strap
  notes500Count: number;
  notes500Value: number;
  notes500Straps: number; // 100 notes per strap
  pct1000: number; // % of total value in 1000 notes
  pct500: number; // % of total value in 500 notes
}

/**
 * Calculates optimal ৳1,000 and ৳500 note distribution for a given demand or refill target.
 * Standard Bangladesh Bank ATM cash loading allocates ~70% to ৳1,000 notes and ~30% to ৳500 notes,
 * guaranteeing that: (notes1000Count * 1000) + (notes500Count * 500) === targetAmount exactly.
 */
export function calculate1000And500NoteBreakdown(targetAmount: number): NoteDenominationRefill {
  // Round to nearest 500 BDT
  const target = Math.max(0, Math.round(targetAmount / 500) * 500);
  if (target === 0) {
    return {
      totalAmount: 0,
      notes1000Count: 0,
      notes1000Value: 0,
      notes1000Straps: 0,
      notes500Count: 0,
      notes500Value: 0,
      notes500Straps: 0,
      pct1000: 0,
      pct500: 0,
    };
  }

  // Desired 70% share for ৳1,000 notes
  const desired1000Val = target * 0.70;
  // Round ৳1,000 notes to multiples of 10 or 50 bills for clean physical handling
  let notes1000 = Math.round(desired1000Val / 10000) * 10;
  // Ensure we don't exceed target
  if (notes1000 * 1000 > target) {
    notes1000 = Math.floor(target / 1000);
  }

  const remaining = target - (notes1000 * 1000);
  const notes500 = Math.floor(remaining / 500);

  const notes1000Value = notes1000 * 1000;
  const notes500Value = notes500 * 500;
  const finalTotal = notes1000Value + notes500Value;

  return {
    totalAmount: finalTotal,
    notes1000Count: notes1000,
    notes1000Value,
    notes1000Straps: Math.round((notes1000 / 100) * 10) / 10,
    notes500Count: notes500,
    notes500Value,
    notes500Straps: Math.round((notes500 / 100) * 10) / 10,
    pct1000: finalTotal > 0 ? Math.round((notes1000Value / finalTotal) * 100) : 0,
    pct500: finalTotal > 0 ? Math.round((notes500Value / finalTotal) * 100) : 0,
  };
}

/**
 * Next Day (T+1) and Next 2 Days (T+2) Horizon Demand Predictor with Note Mix
 */
export interface HorizonForecast {
  t1Demand: number;
  t1ClosingCash: number;
  t1Pct: number;
  t1Status: 'Refill Now' | 'Refill Soon' | 'OK';
  t1Notes: NoteDenominationRefill;
  t2Demand: number; // 2-day cumulative demand
  t2Day2OnlyDemand: number; // day 2 standalone demand
  t2ClosingCash: number;
  t2Pct: number;
  t2Status: 'Refill Now' | 'Refill Soon' | 'OK';
  t2Notes: NoteDenominationRefill;
}

export function getAtmHorizonForecast(
  atm: ATMRecord,
  policy: OperationalPolicy,
  demandMultiplier: number = 1.0
): HorizonForecast {
  const forward = calculateForwardDepletion(atm, policy, demandMultiplier);
  const day1 = forward.dailyPoints[0] || {
    projectedDemand: Math.round(atm.Predicted_Demand),
    projectedClosingCash: Math.max(0, atm.Estimated_Cash_Remaining - atm.Predicted_Demand),
    projectedPct: Math.round((Math.max(0, atm.Estimated_Cash_Remaining - atm.Predicted_Demand) / (atm.ATM_Capacity || 1)) * 100),
    status: 'OK' as const,
  };
  const day2 = forward.dailyPoints[1] || {
    projectedDemand: Math.round(atm.Predicted_Demand),
    projectedClosingCash: Math.max(0, day1.projectedClosingCash - atm.Predicted_Demand),
    projectedPct: Math.round((Math.max(0, day1.projectedClosingCash - atm.Predicted_Demand) / (atm.ATM_Capacity || 1)) * 100),
    status: 'OK' as const,
  };

  const t1Demand = day1.projectedDemand;
  const t1ClosingCash = day1.projectedClosingCash;
  const t1Pct = day1.projectedPct;
  const t1Status = day1.status;
  const t1Notes = calculate1000And500NoteBreakdown(t1Demand);

  const t2Demand = day1.projectedDemand + day2.projectedDemand;
  const t2ClosingCash = day2.projectedClosingCash;
  const t2Pct = day2.projectedPct;
  const t2Status = day2.status;
  const t2Notes = calculate1000And500NoteBreakdown(t2Demand);

  return {
    t1Demand,
    t1ClosingCash,
    t1Pct,
    t1Status,
    t1Notes,
    t2Demand,
    t2Day2OnlyDemand: day2.projectedDemand,
    t2ClosingCash,
    t2Pct,
    t2Status,
    t2Notes,
  };
}
