import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy } from '../types/operations';
import {
  Banknote,
  TrendingDown,
  Percent,
  Truck,
  Sliders,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calculator
} from 'lucide-react';

interface CapitalOptimizerViewProps {
  atms: ATMRecord[];
  policy: OperationalPolicy;
  onOpenPolicyModal?: () => void;
}

export const CapitalOptimizerView: React.FC<CapitalOptimizerViewProps> = ({
  atms,
  policy,
  onOpenPolicyModal,
}) => {
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5% annual cost of capital
  const [citCostPerStop, setCitCostPerStop] = useState<number>(3500); // ৳3,500 per armored stop
  const [targetServiceLevel, setTargetServiceLevel] = useState<number>(99.2);

  const totalCapacity = useMemo(
    () => atms.reduce((acc, a) => acc + (a.ATM_Capacity || 0), 0),
    [atms]
  );
  const totalHeldCash = useMemo(
    () => atms.reduce((acc, a) => acc + (a.Estimated_Cash_Remaining || 0), 0),
    [atms]
  );
  const totalDailyDemand = useMemo(
    () => atms.reduce((acc, a) => acc + (a.Predicted_Demand || 0), 0),
    [atms]
  );

  // Economic analysis
  const annualDemand = totalDailyDemand * 365;
  const annualHoldingCostPerTaka = interestRate / 100;

  // Fleet Economic Order Quantity (EOQ): Q* = sqrt(2 * D * S / H)
  // where D = annualDemand, S = citCostPerStop * atms.length (approx), H = holding rate
  const annualHoldingExpenseCurrent = totalHeldCash * annualHoldingCostPerTaka;
  const estimatedAnnualCitRuns = Math.round((annualDemand / Math.max(1, totalHeldCash)) * atms.length);
  const annualCitExpenseCurrent = estimatedAnnualCitRuns * citCostPerStop;

  // Optimized cycle days
  const avgAtmDailyDemand = totalDailyDemand / Math.max(1, atms.length);
  const optimalOrderSizePerAtm = Math.sqrt(
    (2 * (avgAtmDailyDemand * 365) * citCostPerStop) / annualHoldingCostPerTaka
  );
  const optimalCycleDays = Math.max(1, Math.round(optimalOrderSizePerAtm / Math.max(1, avgAtmDailyDemand)));

  const optimizedAnnualHolding = (optimalOrderSizePerAtm / 2) * atms.length * annualHoldingCostPerTaka;
  const optimizedAnnualCit = (365 / optimalCycleDays) * atms.length * citCostPerStop;
  const totalOptimizedAnnual = optimizedAnnualHolding + optimizedAnnualCit;
  const totalCurrentAnnual = annualHoldingExpenseCurrent + annualCitExpenseCurrent;
  const potentialAnnualSavings = Math.max(0, totalCurrentAnnual - totalOptimizedAnnual);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#0c1424] via-[#162744] to-[#0c1424] text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <Scale className="w-3.5 h-3.5" /> Treasury Cost of Capital & Logistics Optimization
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Economic Order & Cash Inventory Trade-Off Model
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Balances the opportunity cost of idle vault cash against armored carrier transportation fees.
              Identifies the mathematical equilibrium between holding buffers and dispatch frequency.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPolicyModal && (
              <button
                onClick={onOpenPolicyModal}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Safety Stock</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Sensitivity Sliders */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span>Macroeconomic Parameter Calibration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-blue-600" /> Annual Cost of Capital (Interest)
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{interestRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="15.0"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 block">
              Opportunity cost of uninvested liquidity sitting idle inside machines.
            </span>
          </div>

          {/* CIT Stop Cost */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" /> Fixed CIT Armored Courier Fee
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">৳{citCostPerStop} / stop</span>
            </div>
            <input
              type="range"
              min="1000"
              max="10000"
              step="250"
              value={citCostPerStop}
              onChange={(e) => setCitCostPerStop(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 block">
              Contracted transport, guard escort, and cash-in-transit handling charge.
            </span>
          </div>

          {/* Service Level SLA */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Target Availability SLA
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{targetServiceLevel.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="95.0"
              max="99.9"
              step="0.1"
              value={targetServiceLevel}
              onChange={(e) => setTargetServiceLevel(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 block">
              Acceptable zero-cash outage tolerance across the customer network.
            </span>
          </div>
        </div>
      </div>

      {/* Comparison KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
            Optimal Refill Cycle
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            Every {optimalCycleDays} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <span className="text-[11px] text-blue-700 font-semibold mt-1 block">
            Mathematical EOQ balance
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
            Optimal Batch Amount
          </span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
            ৳{Math.round(optimalOrderSizePerAtm).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Per machine delivery target
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
            Annual Cash Drag
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            ৳{(annualHoldingExpenseCurrent / 1000000).toFixed(2)}M
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Current {interestRate}% holding loss
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white">
          <span className="text-xs text-emerald-800 block uppercase font-bold tracking-wider">
            Potential Net Savings
          </span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
            ৳{(potentialAnnualSavings / 1000).toFixed(0)}k/yr
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            By optimizing carrier frequency
          </span>
        </div>
      </div>

      {/* Trade-off Breakdown Explanation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-800 text-sm mb-3">
          Trade-off Dynamics: Cash Idle Cost vs Armored Dispatch Frequency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1.5">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              If Refills Occur Too Frequently:
            </h4>
            <p>
              Idle cash holdings drop and interest costs decrease, but total fixed armored vehicle fees
              skyrocket due to high visit counts (৳{citCostPerStop} per visit across 256 machines).
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-1.5">
              <Banknote className="w-4 h-4 text-amber-600" />
              If Refills Occur Too Rarely:
            </h4>
            <p>
              Transportation costs fall, but machines must be packed with excess capital, generating heavy
              holding losses at {interestRate}% interest while increasing cash-out risk exposure on high-demand days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
