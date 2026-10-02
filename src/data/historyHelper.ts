import historyDataRaw from './historyData.json';

export interface HistoryRecord {
  dates: string[];
  actual: number[];
  predicted: number[];
}

export const historyMap = historyDataRaw as Record<string, HistoryRecord>;

export function getAtmHistory(atmId: string): HistoryRecord {
  if (historyMap[atmId]) {
    return historyMap[atmId];
  }
  return { dates: [], actual: [], predicted: [] };
}
