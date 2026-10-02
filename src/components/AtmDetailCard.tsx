import React, { useState } from 'react';
import { ATMRecord } from '../data/atmData';
import { getAtmRegion } from '../utils/cashCalculations';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Fuel,
  MapPin,
  ShieldAlert,
  Truck,
  RotateCcw,
  Banknote,
  Building,
  Copy,
  Check,
  Cpu,
  Layers
} from 'lucide-react';

interface AtmDetailCardProps {
  atm: ATMRecord | undefined;
  onSimulateRefill?: (atmId: string) => void;
  onAddToManifest?: (atm: ATMRecord) => void;
  onOpenCassetteModal?: (atm: ATMRecord) => void;
  isInManifest?: boolean;
}

export const AtmDetailCard: React.FC<AtmDetailCardProps> = ({
  atm,
  onSimulateRefill,
  onAddToManifest,
  onOpenCassetteModal,
  isInManifest = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!atm) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 text-center text-slate-400 flex flex-col items-center justify-center min-h-[420px]">
        <ShieldAlert className="w-10 h-10 text-slate-300 mb-2" />
        <p className="font-medium text-slate-600">No ATM Selected</p>
        <p className="text-xs text-slate-400 mt-1">Select an ATM from the table or dropdown.</p>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, atm.Cash_Remaining_Pct));
  const days = Number(atm.Days_of_Cash) || 0;
  const region = getAtmRegion(atm.ATMID);

  let statusBg = 'bg-emerald-500 text-white';
  let barColor = 'bg-emerald-500';
  let daysTextColor = 'text-emerald-700';
  let badgeIcon = <CheckCircle2 className="w-3.5 h-3.5" />;

  if (atm.Status === 'Refill Now') {
    statusBg = 'bg-red-600 text-white animate-pulse';
    barColor = 'bg-red-600';
    daysTextColor = 'text-red-600 font-extrabold';
    badgeIcon = <ShieldAlert className="w-3.5 h-3.5" />;
  } else if (atm.Status === 'Refill Soon') {
    statusBg = 'bg-amber-500 text-white';
    barColor = 'bg-amber-500';
    daysTextColor = 'text-amber-600 font-bold';
    badgeIcon = <AlertTriangle className="w-3.5 h-3.5" />;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(atm.ATMID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        {/* Terminal Header */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-900 tracking-tight">
                {atm.ATMID}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Copy Terminal ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBg}`}
              >
                {badgeIcon}
                {atm.Status}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
              <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-800">{region.name}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[240px]" title={atm.Location}>
                {atm.Location.replace('(location not in dataset)', '').trim() || 'Central Regional Hub'}
              </span>
            </div>
          </div>
        </div>

        {/* Vault Reservoir Progress Meter */}
        <div className="my-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-slate-700 flex items-center gap-1.5 font-semibold">
              <Fuel className="w-3.5 h-3.5 text-slate-500" /> Vault Reservoir Level
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">{pct.toFixed(1)}%</span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Empty (0%)</span>
            <span>Refill Floor: 20%</span>
            <span>Cap: ${(atm.ATM_Capacity / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Financial Metrics List */}
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Vault Capacity
            </span>
            <span className="font-mono font-bold text-slate-800">
              ${Math.round(atm.ATM_Capacity).toLocaleString()}
            </span>
          </div>

          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500">Available Vault Cash</span>
            <span className="font-mono font-bold text-slate-900">
              ${Math.round(atm.Estimated_Cash_Remaining).toLocaleString()}
            </span>
          </div>

          <div className="py-2 flex justify-between items-center bg-slate-50/70 px-2 rounded-md my-0.5">
            <span className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Cash Runway Horizon
            </span>
            <span className={`font-mono text-sm ${daysTextColor}`}>
              {days.toFixed(1)} {days === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500">Predicted Daily Demand</span>
            <span className="font-mono font-semibold text-blue-700">
              ${Math.round(atm.Predicted_Demand).toLocaleString()}
            </span>
          </div>

          <div className="py-2 flex justify-between items-center bg-emerald-50/70 px-2 rounded-md my-0.5">
            <span className="text-emerald-900 font-bold">Recommended Load</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              ${Math.round(atm.Refill_Suggestion_Amount).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Actions */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
        {onOpenCassetteModal && (
          <button
            onClick={() => onOpenCassetteModal(atm)}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Banknote className="w-3.5 h-3.5 text-blue-600" />
            <span>Cassette Denomination Pull Sheet</span>
          </button>
        )}

        {onAddToManifest && (
          <button
            onClick={() => onAddToManifest(atm)}
            disabled={isInManifest}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isInManifest
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            {isInManifest ? 'Included in CIT Route' : 'Add to CIT Armored Route'}
          </button>
        )}

        {onSimulateRefill && (
          <button
            onClick={() => onSimulateRefill(atm.ATMID)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Simulate Same-Day Refill Event
          </button>
        )}
      </div>
    </div>
  );
};
