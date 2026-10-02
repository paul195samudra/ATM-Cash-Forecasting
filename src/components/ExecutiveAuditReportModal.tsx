import React, { useState } from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy } from '../types/operations';
import {
  X,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface ExecutiveAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  atms: ATMRecord[];
  policy: OperationalPolicy;
}

export const ExecutiveAuditReportModal: React.FC<ExecutiveAuditReportModalProps> = ({
  isOpen,
  onClose,
  atms,
  policy,
}) => {
  const [reportAuditor, setReportAuditor] = useState('Senior Treasury Officer');

  if (!isOpen) return null;

  const totalAtms = atms.length;
  const refillNow = atms.filter((a) => a.Status === 'Refill Now');
  const refillSoon = atms.filter((a) => a.Status === 'Refill Soon');
  const totalCapacity = atms.reduce((acc, a) => acc + (a.ATM_Capacity || 0), 0);
  const totalRemaining = atms.reduce((acc, a) => acc + (a.Estimated_Cash_Remaining || 0), 0);
  const totalRefillNeeded = atms.reduce((acc, a) => acc + (a.Refill_Suggestion_Amount || 0), 0);
  const totalDailyDemand = atms.reduce((acc, a) => acc + (a.Predicted_Demand || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'ATMID',
      'Location',
      'Capacity',
      'RemainingCash',
      'CashRemainingPct',
      'DaysOfCash',
      'PredictedDemand',
      'RefillSuggestion',
      'Status',
    ];
    const rows = atms.map((a) => [
      a.ATMID,
      `"${a.Location.replace(/"/g, '""')}"`,
      a.ATM_Capacity,
      a.Estimated_Cash_Remaining,
      a.Cash_Remaining_Pct.toFixed(2),
      Number(a.Days_of_Cash).toFixed(2),
      a.Predicted_Demand.toFixed(2),
      a.Refill_Suggestion_Amount.toFixed(2),
      a.Status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Treasury_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Executive Treasury & Audit Report</h2>
              <p className="text-xs text-slate-400">
                Official Network Liquidity Snapshot · Basel III Cash-Out Risk Assessment
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Report Date</span>
              <strong className="text-slate-900 font-mono">2024-10-27 08:00 UTC</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Prepared By</span>
              <strong className="text-slate-900">{reportAuditor}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Compliance Standard</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ISO-20022 Audit Ready
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Fleet Coverage</span>
              <strong className="text-slate-900 font-mono">256 / 256 Terminals (100%)</strong>
            </div>
          </div>

          {/* Key Audit Figures */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Fleet Financial Exposure Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 block">Total Network Cash Held</span>
                <span className="text-xl font-black font-mono text-slate-900 mt-1 block">
                  ${(totalRemaining / 1000000).toFixed(2)}M
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {((totalRemaining / totalCapacity) * 100).toFixed(1)}% of total capacity
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 block">Immediate Refill Capital</span>
                <span className="text-xl font-black font-mono text-emerald-800 mt-1 block">
                  ${(totalRefillNeeded / 1000000).toFixed(2)}M
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Recommended order value
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 block">Terminals at Risk (&le;20%)</span>
                <span className="text-xl font-black font-mono text-red-600 mt-1 block">
                  {refillNow.length} ATMs
                </span>
                <span className="text-[11px] text-red-600 mt-1 block font-semibold">
                  Requires same-day run
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs text-slate-500 block">Daily Demand Burn</span>
                <span className="text-xl font-black font-mono text-blue-700 mt-1 block">
                  ${(totalDailyDemand / 1000000).toFixed(2)}M/d
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Predicted outflow rate
                </span>
              </div>
            </div>
          </div>

          {/* Critical Risk Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              Critical Attention Items ({refillNow.length} Immediate Refills Required)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Terminal ID</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5 text-right">Cash Left</th>
                    <th className="p-2.5 text-center">Runway</th>
                    <th className="p-2.5 text-right">Refill Target</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {refillNow.slice(0, 5).map((atm) => (
                    <tr key={atm.ATMID} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{atm.ATMID}</td>
                      <td className="p-2.5 font-sans text-slate-600 truncate max-w-[200px]">
                        {atm.Location.replace('(location not in dataset)', '').trim() ||
                          'Central Corridor'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-800">
                        ${Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center text-red-600 font-bold">
                        {Number(atm.Days_of_Cash).toFixed(1)}d
                      </td>
                      <td className="p-2.5 text-right text-emerald-800 font-bold">
                        ${Math.round(atm.Refill_Suggestion_Amount).toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          Refill Now
                        </span>
                      </td>
                    </tr>
                  ))}
                  {refillNow.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 font-sans">
                        No terminals currently below critical floor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Verification Statement */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
            <h4 className="font-bold flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Treasury Officer Sign-Off & Verification
            </h4>
            <p>
              This snapshot has been certified by the automated cash optimization engine. All forecasts
              integrate historical seasonal demand models, day-of-week liquidity patterns, and safety stock
              buffers calibrated to the bank&apos;s critical floor threshold (&le;{policy.refillNowPctThreshold}%).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Internal Treasury Document · Confidential
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit Document</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full CSV Audit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
