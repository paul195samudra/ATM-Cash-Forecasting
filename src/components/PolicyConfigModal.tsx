import React, { useState } from 'react';
import { ATMRecord } from '../data/atmData';
import { defaultOperationalPolicy, OperationalPolicy } from '../types/operations';
import {
  Sliders,
  X,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Percent,
  Clock,
  Banknote
} from 'lucide-react';

interface PolicyConfigModalProps {
  currentPolicy: OperationalPolicy;
  atms: ATMRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSavePolicy: (policy: OperationalPolicy) => void;
}

export const PolicyConfigModal: React.FC<PolicyConfigModalProps> = ({
  currentPolicy,
  atms,
  isOpen,
  onClose,
  onSavePolicy,
}) => {
  const [draft, setDraft] = useState<OperationalPolicy>({ ...currentPolicy });

  if (!isOpen) return null;

  // Real-time preview calculation using exact audited policy formula
  const previewRefillNow = atms.filter((a) => {
    const pct = Math.round((a.Estimated_Cash_Remaining / (a.ATM_Capacity || 1)) * 1000) / 10;
    return pct <= draft.refillNowPctThreshold;
  }).length;

  const previewRefillSoon = atms.filter((a) => {
    const pct = Math.round((a.Estimated_Cash_Remaining / (a.ATM_Capacity || 1)) * 1000) / 10;
    return pct <= draft.refillSoonPctThreshold && pct > draft.refillNowPctThreshold;
  }).length;

  const previewOk = atms.length - previewRefillNow - previewRefillSoon;

  const handleResetDefaults = () => {
    setDraft({ ...defaultOperationalPolicy });
  };

  const handleSave = () => {
    onSavePolicy(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Operational Liquidity & Safety Stock Policy Engine
              </h3>
              <p className="text-xs text-slate-500">
                Calibrate decision thresholds and capital cost parameters applied fleet-wide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders & Parameters */}
        <div className="p-6 space-y-5 text-xs">
          {/* Threshold 1: Refill Now % */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800">
                Critical Safety Floor (&ldquo;Refill Now&rdquo; Threshold)
              </span>
              <span className="font-mono font-bold text-red-600 text-sm">
                &le; {draft.refillNowPctThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Machines below this capacity ratio are flagged with emergency critical priority.
            </p>
            <input
              type="range"
              min={10}
              max={30}
              step={1}
              value={draft.refillNowPctThreshold}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, refillNowPctThreshold: Number(e.target.value) }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>10% (Aggressive Lean Cash)</span>
              <span>20% (Industry Standard)</span>
              <span>30% (Conservative Buffer)</span>
            </div>
          </div>

          {/* Threshold 2: Refill Soon % */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800">
                Action Window (&ldquo;Refill Soon&rdquo; Threshold)
              </span>
              <span className="font-mono font-bold text-amber-600 text-sm">
                &le; {draft.refillSoonPctThreshold}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Triggers inclusion in upcoming CIT delivery route batches.
            </p>
            <input
              type="range"
              min={25}
              max={55}
              step={1}
              value={draft.refillSoonPctThreshold}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, refillSoonPctThreshold: Number(e.target.value) }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>25%</span>
              <span>40% (Standard)</span>
              <span>55% (High Pre-load)</span>
            </div>
          </div>

          {/* Threshold 3: Minimum Days of Cash */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800">Minimum Run-Out Horizon</span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {draft.minDaysBuffer.toFixed(1)} days
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Forces Refill Now flag if remaining cash covers fewer days than this safety margin.
            </p>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.1}
              value={draft.minDaysBuffer}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, minDaysBuffer: Number(e.target.value) }))
              }
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>0.5 days</span>
              <span>1.0 day (Standard)</span>
              <span>2.5 days (Safety buffer)</span>
            </div>
          </div>

          {/* Economic parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">
                Cost of Capital / Idle Cash Rate (% p.a.)
              </label>
              <input
                type="number"
                step={0.25}
                min={1}
                max={15}
                value={draft.idleCashCostRate}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, idleCashCostRate: Number(e.target.value) }))
                }
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Treasury repo rate for vault cash carry
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">
                CIT Delivery Fee per Stop (BDT ৳)
              </label>
              <input
                type="number"
                step={250}
                min={500}
                max={10000}
                value={draft.citCostPerStop}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, citCostPerStop: Number(e.target.value) }))
                }
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Armored carrier stop fee SLA
              </span>
            </div>
          </div>

          {/* Live Fleet Impact Preview */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Simulated Fleet Impact Across All 256 ATMs</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-red-600">Refill Now</span>
                <div className="text-xl font-black font-mono text-red-600 mt-0.5">
                  {previewRefillNow}
                </div>
                <span className="text-[10px] text-slate-400">Critical urgency</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-amber-600">Refill Soon</span>
                <div className="text-xl font-black font-mono text-amber-600 mt-0.5">
                  {previewRefillSoon}
                </div>
                <span className="text-[10px] text-slate-400">Action window</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-emerald-600">Safe / OK</span>
                <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">
                  {previewOk}
                </div>
                <span className="text-[10px] text-slate-400">Optimal stock</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Apply Policy Fleet-Wide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
