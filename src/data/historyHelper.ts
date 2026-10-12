import historyDataRaw from './historyData.json';

export interface HistoryRecord {
  dates: string[];
  actual: number[];
  predicted: number[];
}

export const historyMap = historyDataRaw as Record<string, HistoryRecord>;

export function getAtmHistory(atmId: string, baseDemand?: number): HistoryRecord {
  if (historyMap[atmId]) {
    return historyMap[atmId];
  }
  // Synthesize realistic historical observations for custom imported CSV machines
  const demand = baseDemand && baseDemand > 0 ? baseDemand : 320000;
  const dates: string[] = [];
  const actual: number[] = [];
  const predicted: number[] = [];

  // Stable pseudo-random seed based on atmId
  let seed = 0;
  for (let i = 0; i < atmId.length; i++) {
    seed = (seed * 31 + atmId.charCodeAt(i)) >>> 0;
  }
  const pseudoRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed % 1000) / 1000;
  };

  const anchor = new Date(2024, 9, 27); // 2024-10-27
  for (let d = 59; d >= 0; d--) {
    const dt = new Date(anchor.getTime() - d * 24 * 3600 * 1000);
    const dateStr = dt.toISOString().slice(0, 10);
    dates.push(dateStr);

    const dayOfWeek = dt.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday/Saturday in Bangladesh
    const multiplier = isWeekend ? 1.25 : 0.95;
    const noiseActual = (pseudoRand() - 0.48) * 0.22;
    const noisePred = (pseudoRand() - 0.5) * 0.08;

    const act = Math.max(10000, Math.round(demand * multiplier * (1 + noiseActual)));
    const pred = Math.max(10000, Math.round(demand * multiplier * (1 + noisePred)));
    actual.push(act);
    predicted.push(pred);
  }

  return { dates, actual, predicted };
}
