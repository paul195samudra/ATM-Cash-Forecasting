import React, { useState } from 'react';
import { ATMRecord } from '../data/atmData';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Database
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (importedAtms: ATMRecord[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  const [csvText, setCsvText] = useState('');
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<ATMRecord[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        processCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const processCsv = (raw: string) => {
    try {
      setParseError(null);
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParseError('CSV must have a header row and at least one data row.');
        setParsedCount(null);
        setPreviewRows([]);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const idIdx = headers.findIndex((h) => h.toLowerCase().includes('atmid') || h.toLowerCase() === 'id');
      const capIdx = headers.findIndex((h) => h.toLowerCase().includes('cap'));
      const remIdx = headers.findIndex(
        (h) => h.toLowerCase().includes('remain') || h.toLowerCase().includes('cash')
      );
      const locIdx = headers.findIndex((h) => h.toLowerCase().includes('loc'));

      const results: ATMRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 2) continue;

        const atmId = (idIdx >= 0 ? cols[idIdx] : cols[0]) || `ATM-${i}`;
        const cap = capIdx >= 0 ? parseFloat(cols[capIdx]) || 1500000 : 1500000;
        const rem = remIdx >= 0 ? parseFloat(cols[remIdx]) || 400000 : 400000;
        const loc = locIdx >= 0 ? cols[locIdx] : `Branch Location ${i}`;

        const pct = cap > 0 ? (rem / cap) * 100 : 0;
        const pred = cap * 0.08; // approximate daily demand
        const days = pred > 0 ? rem / pred : 0;

        let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
        if (pct <= 20) status = 'Refill Now';
        else if (pct <= 40) status = 'Refill Soon';

        results.push({
          ATMID: atmId,
          Location: loc,
          ATM_Capacity: cap,
          Estimated_Cash_Remaining: rem,
          Cash_Remaining_Pct: pct,
          Days_of_Cash: days,
          Predicted_Demand: pred,
          Refill_Suggestion_Amount: Math.max(0, cap - rem),
          Status: status,
        });
      }

      if (results.length === 0) {
        setParseError('Could not parse any valid records from CSV.');
        return;
      }

      setParsedCount(results.length);
      setPreviewRows(results.slice(0, 5));
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV format.');
      setParsedCount(null);
      setPreviewRows([]);
    }
  };

  const handleApply = () => {
    if (previewRows.length === 0) return;
    // Re-run full parsing to get full list
    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const idIdx = headers.findIndex((h) => h.toLowerCase().includes('atmid') || h.toLowerCase() === 'id');
    const capIdx = headers.findIndex((h) => h.toLowerCase().includes('cap'));
    const remIdx = headers.findIndex((h) => h.toLowerCase().includes('remain') || h.toLowerCase().includes('cash'));
    const locIdx = headers.findIndex((h) => h.toLowerCase().includes('loc'));

    const fullList: ATMRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) continue;

      const atmId = (idIdx >= 0 ? cols[idIdx] : cols[0]) || `ATM-${i}`;
      const cap = capIdx >= 0 ? parseFloat(cols[capIdx]) || 1500000 : 1500000;
      const rem = remIdx >= 0 ? parseFloat(cols[remIdx]) || 400000 : 400000;
      const loc = locIdx >= 0 ? cols[locIdx] : `Branch Location ${i}`;

      const pct = cap > 0 ? (rem / cap) * 100 : 0;
      const pred = cap * 0.08;
      const days = pred > 0 ? rem / pred : 0;

      let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
      if (pct <= 20) status = 'Refill Now';
      else if (pct <= 40) status = 'Refill Soon';

      fullList.push({
        ATMID: atmId,
        Location: loc,
        ATM_Capacity: cap,
        Estimated_Cash_Remaining: rem,
        Cash_Remaining_Pct: pct,
        Days_of_Cash: days,
        Predicted_Demand: pred,
        Refill_Suggestion_Amount: Math.max(0, cap - rem),
        Status: status,
      });
    }

    onImportData(fullList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Import Fleet Telemetry CSV</h2>
              <p className="text-xs text-slate-400">
                Upload or paste live cash balances and capacity figures from core banking switch
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload File (.csv)</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Or Paste CSV Raw Content:
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                processCsv(e.target.value);
              }}
              placeholder="ATMID,Location,Capacity,RemainingCash&#10;ABBDHA01,Dhaka Central,1500000,420000&#10;ABBMIR02,Mirpur Hub,1200000,180000"
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
            />
          </div>

          {parseError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {parsedCount !== null && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Successfully parsed {parsedCount} machines
              </span>
            </div>
          )}

          {previewRows.length > 0 && (
            <div>
              <span className="font-bold text-slate-800 block mb-1">Previewing First 5 Records:</span>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">ATMID</th>
                      <th className="p-2">Location</th>
                      <th className="p-2 text-right">Capacity</th>
                      <th className="p-2 text-right">Cash Left</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((r) => (
                      <tr key={r.ATMID}>
                        <td className="p-2 font-bold text-slate-900">{r.ATMID}</td>
                        <td className="p-2 font-sans truncate max-w-[150px]">{r.Location}</td>
                        <td className="p-2 text-right">${Math.round(r.ATM_Capacity).toLocaleString()}</td>
                        <td className="p-2 text-right">${Math.round(r.Estimated_Cash_Remaining).toLocaleString()}</td>
                        <td className="p-2 text-center font-sans font-bold">{r.Status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedCount}
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Apply to Active Fleet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
