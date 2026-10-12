import { ATMRecord } from '../data/atmData';
import { getAtmRegion } from '../utils/cashCalculations';

export interface ColumnOption {
  key: string;
  label: string;
  accessor: (atm: ATMRecord) => string | number;
}

export const ALL_EXPORT_COLUMNS: ColumnOption[] = [
  { key: 'ATMID', label: 'ATM ID', accessor: (a) => a.ATMID },
  { key: 'Location', label: 'Location Name', accessor: (a) => a.Location },
  { key: 'Region', label: 'Regional Corridor', accessor: (a) => getAtmRegion(a.ATMID).name },
  { key: 'RegionCode', label: 'Corridor Code', accessor: (a) => getAtmRegion(a.ATMID).code },
  { key: 'Status', label: 'Operational Status', accessor: (a) => a.Status },
  { key: 'ATM_Capacity', label: 'Capacity (BDT)', accessor: (a) => a.ATM_Capacity },
  { key: 'Estimated_Cash_Remaining', label: 'Cash Remaining (BDT)', accessor: (a) => a.Estimated_Cash_Remaining },
  { key: 'Cash_Remaining_Pct', label: 'Remaining (%)', accessor: (a) => a.Cash_Remaining_Pct },
  { key: 'Days_of_Cash', label: 'Days of Cash', accessor: (a) => a.Days_of_Cash },
  { key: 'Predicted_Demand', label: 'ML Predicted Demand (BDT)', accessor: (a) => a.Predicted_Demand },
  { key: 'Refill_Suggestion_Amount', label: 'Refill Suggestion (BDT)', accessor: (a) => a.Refill_Suggestion_Amount },
  { key: 'Recommended_Loading', label: 'Policy Loading (BDT)', accessor: (a) => Math.round(a.Predicted_Demand * 1.05) },
  { key: 'Cassette_Count', label: 'Cassettes Required', accessor: () => 4 },
  { key: 'Notes', label: 'Audit Flag', accessor: (a) => a.Cash_Remaining_Pct < 20 ? 'CRITICAL_DEPLETION' : 'NORMAL' },
];

/**
 * Escapes CSV cell values according to RFC 4180
 */
export const escapeCsvCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts array of ATMs to CSV string using selected column keys
 */
export const generateAtmCsv = (atms: ATMRecord[], selectedKeys: string[]): string => {
  const activeCols = ALL_EXPORT_COLUMNS.filter((col) => selectedKeys.includes(col.key));
  if (activeCols.length === 0) return '';

  const headers = activeCols.map((col) => escapeCsvCell(col.label)).join(',');
  const rows = atms.map((atm) =>
    activeCols.map((col) => escapeCsvCell(col.accessor(atm))).join(',')
  );

  return [headers, ...rows].join('\r\n');
};

/**
 * Generates turn-by-turn Armored CIT Manifest CSV
 */
export const generateCitManifestCsv = (atms: ATMRecord[], carrierName: string = "Brink's Global"): string => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const headers = [
    'Stop_Sequence',
    'ATM_ID',
    'Terminal_Location',
    'Corridor',
    'Cash_Remaining_BDT',
    'Replenishment_Amount_BDT',
    'Cassettes_To_Swap',
    'Security_Tamper_Seal',
    'Custody_Signoff',
  ].join(',');

  const rows = atms.map((atm, idx) => {
    const sealId = `SEAL-2024-${String(1000 + idx * 37 + 101).slice(0, 5)}`;
    return [
      idx + 1,
      escapeCsvCell(atm.ATMID),
      escapeCsvCell(atm.Location),
      escapeCsvCell(getAtmRegion(atm.ATMID).name),
      atm.Estimated_Cash_Remaining,
      atm.Refill_Suggestion_Amount || Math.round(atm.Predicted_Demand * 1.05),
      4,
      sealId,
      'PENDING_CREW_SIGN',
    ].join(',');
  });

  const metadata = [
    `# BANK CIT ARMORED MANIFEST & CUSTODY LOG`,
    `# Generated At: ${timestamp}`,
    `# Carrier: ${carrierName}`,
    `# Total Stops: ${atms.length}`,
    `# Total Currency To Load: BDT ${atms.reduce((s, a) => s + (a.Refill_Suggestion_Amount || Math.round(a.Predicted_Demand * 1.05)), 0).toLocaleString()}`,
    ``,
  ].join('\r\n');

  return metadata + [headers, ...rows].join('\r\n');
};

/**
 * Generates Treasury Liquidity Projection CSV
 */
export const generateTreasuryForecastCsv = (atms: ATMRecord[]): string => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Group by corridor
  const corridorMap: Record<string, { count: number; capacity: number; remaining: number; demand: number; refill: number }> = {};

  atms.forEach((atm) => {
    const region = getAtmRegion(atm.ATMID).name;
    if (!corridorMap[region]) {
      corridorMap[region] = { count: 0, capacity: 0, remaining: 0, demand: 0, refill: 0 };
    }
    corridorMap[region].count += 1;
    corridorMap[region].capacity += atm.ATM_Capacity;
    corridorMap[region].remaining += atm.Estimated_Cash_Remaining;
    corridorMap[region].demand += atm.Predicted_Demand;
    corridorMap[region].refill += atm.Refill_Suggestion_Amount || 0;
  });

  const headers = [
    'Regional_Corridor',
    'ATM_Count',
    'Vault_Capacity_BDT',
    'Cash_Remaining_BDT',
    'Fill_Pct',
    'ML_Demand_T1_BDT',
    'Immediate_Refill_Needed_BDT',
    'Interest_Carry_Cost_Annual_6.5pct_BDT',
  ].join(',');

  const rows = Object.entries(corridorMap).map(([region, stat]) => {
    const fillPct = stat.capacity > 0 ? (stat.remaining / stat.capacity) * 100 : 0;
    const carryCost = Math.round(stat.remaining * 0.065);
    return [
      escapeCsvCell(region),
      stat.count,
      stat.capacity,
      stat.remaining,
      fillPct.toFixed(1),
      stat.demand,
      stat.refill,
      carryCost,
    ].join(',');
  });

  const metadata = [
    `# CENTRAL TREASURY LIQUIDITY & BALANCE SHEET FORECAST`,
    `# Generated At: ${timestamp}`,
    `# Total Terminals: ${atms.length}`,
    `# Total Currency In Field: BDT ${atms.reduce((s, a) => s + a.Estimated_Cash_Remaining, 0).toLocaleString()}`,
    ``,
  ].join('\r\n');

  return metadata + [headers, ...rows].join('\r\n');
};

/**
 * Triggers browser file download for generated CSV
 */
export const triggerCsvDownload = (filename: string, csvContent: string): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
