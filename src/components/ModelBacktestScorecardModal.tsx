import React, { useState } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  X,
  Download,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { ATMRecord } from '../data/atmData';

interface ModelBacktestScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  atms: ATMRecord[];
}

export const ModelBacktestScorecardModal: React.FC<ModelBacktestScorecardModalProps> = ({
  isOpen,
  onClose,
  atms,
}) => {
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(30);
  const [selectedHub, setSelectedHub] = useState<string>('ALL');

  if (!isOpen) return null;

  // Synthetic backtesting baseline metrics based on the ensemble model
  const mape = horizonDays === 30 ? 4.18 : horizonDays === 60 ? 4.62 : 5.04;
  const rmse = horizonDays === 30 ? 1420 : horizonDays === 60 ? 1680 : 1940;
  const underPredictRate = horizonDays === 30 ? 1.8 : 2.4; // % times model predicted less than actual
  const overPredictRate = horizonDays === 30 ? 4.2 : 5.1; // % times model over-predicted
  const r2Score = 0.941;

  // Sample 14 historical backtest evaluation days
  const backtestDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date('2024-10-14T00:00:00Z');
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const actual = 4200000 + Math.sin(i * 0.9) * 600000 + (i % 7 === 5 ? 1200000 : 0);
    const predicted = actual * (1 + ((i * 17) % 7 - 3) * 0.015);
    const variancePct = Math.round(((predicted - actual) / actual) * 1000) / 10;
    return {
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      actual: Math.round(actual),
      predicted: Math.round(predicted),
      variancePct,
      accuracy: Math.round((1 - Math.abs(predicted - actual) / actual) * 1000) / 10,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">
                  Quantitative Model Backtest & Forecast Accuracy Scorecard
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Model Governance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited predictive inference accuracy vs actual cash dispensed (XGBoost + Prophet + CatBoost Ensemble)
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

        {/* Horizon Selector Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Backtest Window:</span>
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
              {([30, 60, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setHorizonDays(d)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    horizonDays === d
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d} Days Rolling
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Model Calibration Status: <strong>Production Ready (No Drift Detected)</strong></span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">
                MAPE (Mean Abs % Error)
              </span>
              <div className="text-2xl font-black font-mono text-purple-700">{mape}%</div>
              <div className="text-[10px] text-emerald-700 font-semibold">&le; 5.0% Basel Target</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">
                R² Goodness of Fit
              </span>
              <div className="text-2xl font-black font-mono text-slate-900">{r2Score}</div>
              <div className="text-[10px] text-slate-500">Strong correlation</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">
                Under-Prediction (Stockout Risk)
              </span>
              <div className="text-2xl font-black font-mono text-emerald-700">{underPredictRate}%</div>
              <div className="text-[10px] text-emerald-700 font-semibold">Penalized by Asymmetric Loss</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">
                Over-Prediction (Idle Buffer)
              </span>
              <div className="text-2xl font-black font-mono text-blue-700">{overPredictRate}%</div>
              <div className="text-[10px] text-slate-500">Controlled cost of capital</div>
            </div>
          </div>

          {/* Historical Backtest Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between items-center">
              <span>Day-by-Day Historical Outflow: Actual Dispensed vs ML Model Prediction</span>
              <span className="text-[11px] text-slate-500 font-normal">All 256 Aggregated Terminals</span>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-right">Actual Dispensed (BDT ৳)</th>
                  <th className="py-2.5 px-3 text-right">Predicted Demand (BDT ৳)</th>
                  <th className="py-2.5 px-3 text-right">Variance (%)</th>
                  <th className="py-2.5 px-3 text-center">Prediction Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {backtestDays.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{row.date}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{row.dayName}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      ৳{row.actual.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-purple-700 font-bold">
                      ৳{row.predicted.toLocaleString()}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        Math.abs(row.variancePct) < 2
                          ? 'text-emerald-600'
                          : row.variancePct > 0
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {row.variancePct > 0 ? `+${row.variancePct}%` : `${row.variancePct}%`}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div>
            Model Version: <strong className="text-slate-900 font-mono">v4.8.2-Ensemble</strong> · Audited for Basel III Cash Liquidity Compliance
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            Close Scorecard
          </button>
        </div>
      </div>
    </div>
  );
};
