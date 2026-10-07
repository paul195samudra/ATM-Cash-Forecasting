import React, { useState, useId } from 'react';
import { ATMRecord } from '../data/atmData';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Database,
  Layers,
  FileText,
  Sliders
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (importedAtms: ATMRecord[], datasetName?: string) => void;
  onResetToDefault: () => void;
  isCustomDataActive: boolean;
  totalAtmsCount: number;
}

// Sample feature-engineered dataset featuring world-class football legends
const SAMPLE_FEATURE_ENGINEERED_CSV = `ATMID,Location,ATM_Capacity,Estimated_Cash_Remaining,Predicted_Demand,Day_of_Week,Is_Weekend,Is_Payday,Lag_1_Demand,Rolling_Mean_7d,Status
ABBMES01,Lionel Messi Hub (Camp Nou),1500000,285000,380000,Friday,0,1,340000,360000,Refill Soon
ABBROM02,Romário Center (Maracanã),1200000,195000,310000,Friday,0,1,290000,295000,Refill Now
ABBPEL03,Pelé Grand Terminal (Vila Belmiro),1800000,1250000,250000,Friday,0,1,240000,235000,OK
ABBMAR04,Diego Maradona Station (San Paolo),1000000,165000,280000,Friday,0,1,260000,250000,Refill Now
ABBCRI05,Cristiano Ronaldo Vault (Bernabéu),2000000,1650000,320000,Friday,0,1,310000,305000,OK
ABBZID06,Zinedine Zidane Wing (Stade de France),1400000,390000,290000,Friday,0,1,270000,280000,Refill Soon
ABBRON07,Ronaldinho Gaúcho Express (San Siro North),1100000,180000,260000,Friday,0,1,245000,250000,Refill Now
ABBCRU08,Johan Cruyff Arena (Amsterdam Center),1300000,750000,210000,Friday,0,1,200000,205000,OK
ABBBEC09,David Beckham Corridor (Old Trafford),1250000,240000,330000,Friday,0,1,315000,310000,Refill Soon
ABBHA010,Erling Haaland Tower (Etihad Terminal),1600000,1180000,290000,Friday,0,1,280000,275000,OK
ABBMOD11,Luka Modrić Branch (Zagreb Center),1150000,210000,260000,Friday,0,1,250000,245000,Refill Soon
ABBKA012,Kaká Golden Point (San Siro South),1450000,890000,240000,Friday,0,1,230000,225000,OK
ABBBUF13,Gianluigi Buffon Depot (Turin Stadium),1350000,230000,295000,Friday,0,1,280000,285000,Refill Soon
ABBMAL14,Paolo Maldini Lounge (Milan Central),1500000,1120000,220000,Friday,0,1,210000,215000,OK
ABBHEN15,Thierry Henry Hub (Highbury Corner),1200000,190000,300000,Friday,0,1,285000,290000,Refill Now`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  onResetToDefault,
  isCustomDataActive,
  totalAtmsCount,
}) => {
  const fileInputId = useId();
  const [csvText, setCsvText] = useState('');
  const [datasetName, setDatasetName] = useState<string>('Custom Fleet Telemetry');
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ATMRecord[]>([]);
  const [detectedFeatures, setDetectedFeatures] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState<{
    totalCap: number;
    totalCash: number;
    totalDemand: number;
    refillNowCount: number;
    refillSoonCount: number;
    okCount: number;
  } | null>(null);

  if (!isOpen) return null;

  // Robust CSV parser supporting quotes, commas inside quotes, CRLF/LF
  const parseCSVLines = (text: string): string[][] => {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // handle \r\n
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        lines.push(currentRow);
      }
    }

    return lines;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        processCsv(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const processCsv = (raw: string, filename?: string) => {
    try {
      setParseError(null);
      const rows = parseCSVLines(raw);

      if (rows.length < 2) {
        setParseError('The CSV file must contain a header row and at least one data row.');
        setParsedCount(null);
        setPreviewRows([]);
        setDetectedFeatures([]);
        setSummaryStats(null);
        return;
      }

      const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());

      // Helper to match column variations
      const findColIdx = (keywords: string[]): number => {
        return headers.findIndex((h) => {
          const lower = h.toLowerCase().replace(/[\s_-]+/g, '');
          return keywords.some((k) => lower.includes(k.replace(/[\s_-]+/g, '')));
        });
      };

      const idIdx = findColIdx(['atmid', 'terminalid', 'machineid', 'id', 'terminal', 'code']);
      const locIdx = findColIdx(['location', 'name', 'atmname', 'branch', 'hub', 'station', 'site']);
      const capIdx = findColIdx(['capacity', 'atmcapacity', 'maxcapacity', 'vaultcapacity', 'cap']);
      const remIdx = findColIdx(['estimatedcashremaining', 'cashremaining', 'remainingcash', 'balance', 'cashleft', 'currentcash']);
      const demandIdx = findColIdx(['predicteddemand', 'predictedcashdemand', 'demandforecast', 'dailydemand', 'demand', 'forecast', 'preddemand']);
      const pctIdx = findColIdx(['cashremainingpct', 'remainingpct', 'pctremaining', 'fillpct', 'pct']);
      const daysIdx = findColIdx(['daysofcash', 'daysleft', 'runway', 'daysremaining', 'days']);
      const refillIdx = findColIdx(['refillsuggestionamount', 'refillamount', 'refillsuggestion', 'refill', 'replenishment']);
      const statusIdx = findColIdx(['status', 'operationalstatus', 'healthstatus']);

      // Identify feature-engineered columns
      const recognizedIdxs = new Set([idIdx, locIdx, capIdx, remIdx, demandIdx, pctIdx, daysIdx, refillIdx, statusIdx]);
      const extraFeatures: string[] = [];
      headers.forEach((h, idx) => {
        if (!recognizedIdxs.has(idx) && h.length > 0) {
          extraFeatures.push(h);
        }
      });
      setDetectedFeatures(extraFeatures);

      const parsedRecords: ATMRecord[] = [];
      let totalCap = 0;
      let totalCash = 0;
      let totalDemand = 0;
      let refillNowCount = 0;
      let refillSoonCount = 0;
      let okCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

        const atmId = (idIdx >= 0 ? row[idIdx] : row[0]) || `ATM-EXP-${String(i).padStart(3, '0')}`;
        const loc = (locIdx >= 0 && row[locIdx]) ? row[locIdx] : `ATM Hub #${i}`;

        // Capacities and Remaining
        const cap = capIdx >= 0 ? parseFloat(row[capIdx].replace(/[^0-9.-]/g, '')) || 1200000 : 1200000;
        const rem = remIdx >= 0 ? parseFloat(row[remIdx].replace(/[^0-9.-]/g, '')) || 350000 : 350000;

        // Demand - honor the feature engineered forecast if provided!
        let demand = 0;
        if (demandIdx >= 0 && row[demandIdx]) {
          demand = parseFloat(row[demandIdx].replace(/[^0-9.-]/g, '')) || Math.round(cap * 0.12);
        } else {
          demand = Math.round(cap * 0.12);
        }

        // Percentage
        let pct = 0;
        if (pctIdx >= 0 && row[pctIdx]) {
          pct = parseFloat(row[pctIdx].replace(/[^0-9.-]/g, '')) || 0;
        } else {
          pct = cap > 0 ? (rem / cap) * 100 : 0;
        }

        // Days of cash runway
        let days = 0;
        if (daysIdx >= 0 && row[daysIdx]) {
          days = parseFloat(row[daysIdx].replace(/[^0-9.-]/g, '')) || 0;
        } else {
          days = demand > 0 ? Math.round((rem / demand) * 10) / 10 : 2.5;
        }

        // Refill suggestion
        let refill = 0;
        if (refillIdx >= 0 && row[refillIdx]) {
          refill = parseFloat(row[refillIdx].replace(/[^0-9.-]/g, '')) || Math.max(0, cap - rem);
        } else {
          refill = Math.max(0, cap - rem);
        }

        // Status classification
        let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
        if (statusIdx >= 0 && row[statusIdx]) {
          const val = row[statusIdx].toLowerCase();
          if (val.includes('now') || val.includes('crit') || val.includes('urg')) {
            status = 'Refill Now';
          } else if (val.includes('soon') || val.includes('warn') || val.includes('med')) {
            status = 'Refill Soon';
          } else {
            status = 'OK';
          }
        } else {
          if (pct <= 20 || days < 0.8) {
            status = 'Refill Now';
          } else if (pct <= 35 || days < 1.5) {
            status = 'Refill Soon';
          } else {
            status = 'OK';
          }
        }

        if (status === 'Refill Now') refillNowCount++;
        else if (status === 'Refill Soon') refillSoonCount++;
        else okCount++;

        totalCap += cap;
        totalCash += rem;
        totalDemand += demand;

        parsedRecords.push({
          ATMID: atmId,
          Location: loc,
          ATM_Capacity: cap,
          Estimated_Cash_Remaining: rem,
          Cash_Remaining_Pct: Math.round(pct * 10) / 10,
          Predicted_Demand: Math.round(demand),
          Refill_Suggestion_Amount: Math.round(refill),
          Status: status,
          Days_of_Cash: Math.round(days * 10) / 10,
        });
      }

      if (parsedRecords.length === 0) {
        setParseError('No valid data rows could be extracted from the provided CSV.');
        setParsedCount(null);
        setPreviewRows([]);
        setSummaryStats(null);
        return;
      }

      setParsedCount(parsedRecords.length);
      setPreviewRows(parsedRecords.slice(0, 6));
      setSummaryStats({
        totalCap,
        totalCash,
        totalDemand,
        refillNowCount,
        refillSoonCount,
        okCount,
      });
    } catch (err: any) {
      setParseError(err.message || 'An error occurred while parsing the CSV format.');
      setParsedCount(null);
      setPreviewRows([]);
      setSummaryStats(null);
    }
  };

  const handleLoadSample = () => {
    setDatasetName('Sample Feature-Engineered ML Fleet (Football Stars)');
    setCsvText(SAMPLE_FEATURE_ENGINEERED_CSV);
    processCsv(SAMPLE_FEATURE_ENGINEERED_CSV, 'sample_engineered_fleet.csv');
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_FEATURE_ENGINEERED_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feature_engineered_atm_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    if (!csvText || !parsedCount) return;
    try {
      const rows = parseCSVLines(csvText);
      if (rows.length < 2) return;

      const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
      const findColIdx = (keywords: string[]): number => {
        return headers.findIndex((h) => {
          const lower = h.toLowerCase().replace(/[\s_-]+/g, '');
          return keywords.some((k) => lower.includes(k.replace(/[\s_-]+/g, '')));
        });
      };

      const idIdx = findColIdx(['atmid', 'terminalid', 'machineid', 'id', 'terminal', 'code']);
      const locIdx = findColIdx(['location', 'name', 'atmname', 'branch', 'hub', 'station', 'site']);
      const capIdx = findColIdx(['capacity', 'atmcapacity', 'maxcapacity', 'vaultcapacity', 'cap']);
      const remIdx = findColIdx(['estimatedcashremaining', 'cashremaining', 'remainingcash', 'balance', 'cashleft', 'currentcash']);
      const demandIdx = findColIdx(['predicteddemand', 'predictedcashdemand', 'demandforecast', 'dailydemand', 'demand', 'forecast', 'preddemand']);
      const pctIdx = findColIdx(['cashremainingpct', 'remainingpct', 'pctremaining', 'fillpct', 'pct']);
      const daysIdx = findColIdx(['daysofcash', 'daysleft', 'runway', 'daysremaining', 'days']);
      const refillIdx = findColIdx(['refillsuggestionamount', 'refillamount', 'refillsuggestion', 'refill', 'replenishment']);
      const statusIdx = findColIdx(['status', 'operationalstatus', 'healthstatus']);

      const fullList: ATMRecord[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

        const atmId = (idIdx >= 0 ? row[idIdx] : row[0]) || `ATM-EXP-${String(i).padStart(3, '0')}`;
        const loc = (locIdx >= 0 && row[locIdx]) ? row[locIdx] : `ATM Hub #${i}`;
        const cap = capIdx >= 0 ? parseFloat(row[capIdx].replace(/[^0-9.-]/g, '')) || 1200000 : 1200000;
        const rem = remIdx >= 0 ? parseFloat(row[remIdx].replace(/[^0-9.-]/g, '')) || 350000 : 350000;

        let demand = 0;
        if (demandIdx >= 0 && row[demandIdx]) {
          demand = parseFloat(row[demandIdx].replace(/[^0-9.-]/g, '')) || Math.round(cap * 0.12);
        } else {
          demand = Math.round(cap * 0.12);
        }

        let pct = cap > 0 ? (rem / cap) * 100 : 0;
        if (pctIdx >= 0 && row[pctIdx]) {
          pct = parseFloat(row[pctIdx].replace(/[^0-9.-]/g, '')) || pct;
        }

        let days = demand > 0 ? Math.round((rem / demand) * 10) / 10 : 2.5;
        if (daysIdx >= 0 && row[daysIdx]) {
          days = parseFloat(row[daysIdx].replace(/[^0-9.-]/g, '')) || days;
        }

        let refill = Math.max(0, cap - rem);
        if (refillIdx >= 0 && row[refillIdx]) {
          refill = parseFloat(row[refillIdx].replace(/[^0-9.-]/g, '')) || refill;
        }

        let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
        if (statusIdx >= 0 && row[statusIdx]) {
          const val = row[statusIdx].toLowerCase();
          if (val.includes('now') || val.includes('crit') || val.includes('urg')) {
            status = 'Refill Now';
          } else if (val.includes('soon') || val.includes('warn') || val.includes('med')) {
            status = 'Refill Soon';
          } else {
            status = 'OK';
          }
        } else {
          if (pct <= 20 || days < 0.8) {
            status = 'Refill Now';
          } else if (pct <= 35 || days < 1.5) {
            status = 'Refill Soon';
          } else {
            status = 'OK';
          }
        }

        fullList.push({
          ATMID: atmId,
          Location: loc,
          ATM_Capacity: cap,
          Estimated_Cash_Remaining: rem,
          Cash_Remaining_Pct: Math.round(pct * 10) / 10,
          Predicted_Demand: Math.round(demand),
          Refill_Suggestion_Amount: Math.round(refill),
          Status: status,
          Days_of_Cash: Math.round(days * 10) / 10,
        });
      }

      onImportData(fullList, datasetName);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to apply data to system.');
    }
  };

  const handleReset = () => {
    onResetToDefault();
    setCsvText('');
    setParsedCount(null);
    setPreviewRows([]);
    setDetectedFeatures([]);
    setSummaryStats(null);
    setParseError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Feature-Engineered CSV Fleet Importer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-blue-300 border border-slate-700">
                  ML Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your feature engineered dataset to update fleet capacities, predictions, and CIT plans across the whole app.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active State Banner */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Database className="w-4 h-4 text-blue-600" />
            <span>
              Active Database:{' '}
              <strong className="text-slate-900">
                {isCustomDataActive ? 'Custom Feature-Engineered Fleet' : 'Default Production Fleet (256 Football Stars)'}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 font-mono text-[11px] font-bold text-slate-700">
              {totalAtmsCount} Machines
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              title="Load 15 sample machines with football stars and engineered features"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Load Sample CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
              title="Download CSV format template"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Template</span>
            </button>

            {isCustomDataActive && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="Reset back to default dataset"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              1. Choose Feature-Engineered CSV File:
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center transition-colors bg-slate-50/50 hover:bg-blue-50/20">
              <input
                id={fileInputId}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center pointer-events-none">
                <UploadCloud className="w-8 h-8 text-blue-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">
                  Click or drag and drop your feature-engineered .csv file
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Supports columns: ATMID, Location, Capacity, Cash Remaining, Predicted Demand, Lag features, etc.
                </span>
              </div>
            </div>
          </div>

          {/* Paste CSV Raw Text */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-800">
                2. Or Paste Raw CSV Content:
              </label>
              <span className="text-[11px] text-slate-400">Comma-separated with header row</span>
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                processCsv(e.target.value);
              }}
              placeholder="ATMID,Location,ATM_Capacity,Estimated_Cash_Remaining,Predicted_Demand,Lag_1,Rolling_7d&#10;ABBMES01,Lionel Messi Hub (Camp Nou),1500000,285000,380000,340000,360000&#10;ABBROM02,Romário Center (Maracanã),1200000,195000,310000,290000,295000"
              className="w-full p-3 font-mono text-[11px] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 text-slate-800"
            />
          </div>

          {/* Error message */}
          {parseError && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Detected Features Badge List */}
          {detectedFeatures.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] mb-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Detected Feature Engineering Columns ({detectedFeatures.length}):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detectedFeatures.map((feat) => (
                  <span
                    key={feat}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    ✦ {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Successful Parse Summary Card */}
          {summaryStats && parsedCount !== null && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-xs">
                    Successfully validated {parsedCount} machines from "{datasetName}"
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-rose-700 font-bold">{summaryStats.refillNowCount} Refill Now</span>
                  <span className="text-amber-800 font-bold">{summaryStats.refillSoonCount} Refill Soon</span>
                  <span className="text-emerald-800 font-bold">{summaryStats.okCount} OK</span>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Capacity</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    ৳{(summaryStats.totalCap / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Cash Remaining</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    ৳{(summaryStats.totalCash / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Predicted Demand (ML)</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">
                    ৳{(summaryStats.totalDemand / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 text-xs">
                  Preview of Parsed Feature Dataset (First {previewRows.length} Rows):
                </span>
                <span className="text-[11px] text-slate-400">Full dataset ready to inject</span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2">ATMID</th>
                      <th className="p-2">Location / Legend Hub</th>
                      <th className="p-2 text-right">Capacity</th>
                      <th className="p-2 text-right">Cash Left</th>
                      <th className="p-2 text-right">ML Demand</th>
                      <th className="p-2 text-center">Runway</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r) => (
                      <tr key={r.ATMID} className="hover:bg-slate-50/60">
                        <td className="p-2 font-bold text-slate-900">{r.ATMID}</td>
                        <td className="p-2 font-sans truncate max-w-[170px] text-slate-700 font-medium">
                          {r.Location}
                        </td>
                        <td className="p-2 text-right text-slate-600">
                          ৳{Math.round(r.ATM_Capacity).toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-900">
                          ৳{Math.round(r.Estimated_Cash_Remaining).toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-semibold text-blue-700">
                          ৳{Math.round(r.Predicted_Demand).toLocaleString()}
                        </td>
                        <td className="p-2 text-center text-slate-700">{r.Days_of_Cash}d</td>
                        <td className="p-2 text-center font-sans">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.Status === 'Refill Now'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : r.Status === 'Refill Soon'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {r.Status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            {isCustomDataActive && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold hover:bg-rose-100 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default (256 Fleet)</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={!parsedCount}
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <span>Update Entire System Fleet ({parsedCount || 0} ATMs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
