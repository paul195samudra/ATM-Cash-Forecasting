import React, { useState } from 'react';
import { ATMRecord } from '../data/atmData';
import { calculateCassetteBreakdown } from '../utils/cashCalculations';
import {
  Banknote,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck
} from 'lucide-react';

interface CassetteConfiguratorModalProps {
  atm: ATMRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const CassetteConfiguratorModal: React.FC<CassetteConfiguratorModalProps> = ({
  atm,
  isOpen,
  onClose,
}) => {
  const [customAmount, setCustomAmount] = useState<number>(
    atm.Refill_Suggestion_Amount > 0
      ? atm.Refill_Suggestion_Amount
      : Math.round(atm.ATM_Capacity * 0.7)
  );

  const cassettes = calculateCassetteBreakdown(customAmount);
  const totalLoaded = cassettes.reduce((sum, c) => sum + c.totalValue, 0);
  const totalNotes = cassettes.reduce((sum, c) => sum + c.billCount, 0);
  const totalStraps = cassettes.reduce((sum, c) => sum + c.strapsCount, 0);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Physical Cassette Denomination Order & Vault Pull Sheet
              </h3>
              <p className="text-xs text-slate-500">
                ATM <strong className="font-mono text-slate-800">{atm.ATMID}</strong> ·{' '}
                {atm.Location.replace('(location not in dataset)', '').trim() || 'Central Regional Hub'}
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Target Amount Control */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Replenishment Order Value ($)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={50000}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Math.max(10000, Number(e.target.value)))}
                  className="font-mono text-lg font-extrabold text-blue-900 bg-white border border-blue-300 rounded-lg px-3 py-1.5 w-48 shadow-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setCustomAmount(atm.Refill_Suggestion_Amount || 750000)}
                  className="text-xs font-semibold text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg cursor-pointer"
                >
                  Use Model Refill ({atm.Refill_Suggestion_Amount > 0 ? `$${(atm.Refill_Suggestion_Amount / 1000).toFixed(0)}k` : 'Default'})
                </button>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-500 block">Total Note Count:</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {totalNotes.toLocaleString()} bills ({totalStraps} straps)
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Rounded to 100-bill security bank bundles
              </span>
            </div>
          </div>

          {/* 4 Cassettes Matrix */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>4-Cassette Mechanical Denomination Breakdown</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cassettes.map((c) => (
                <div
                  key={c.cassetteNumber}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs uppercase text-slate-500">
                        Cassette Slot #{c.cassetteNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold font-mono bg-blue-600 text-white">
                        ${c.noteValue} Bills
                      </span>
                    </div>

                    <div className="text-xl font-black font-mono text-slate-900">
                      ${c.totalValue.toLocaleString()}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 mt-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Bill Count:</span>
                        <strong className="text-slate-800">{c.billCount.toLocaleString()} notes</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Bundle Straps:</span>
                        <span>{c.strapsCount} straps (100/ea)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Mechanical Fill:</span>
                      <span className="font-bold">{c.capacityUsagePct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${c.capacityUsagePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Printable Official Vault Security Verification */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/30 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Dual-Custody Vault Dispatch & Handover Checklist</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Bank Vault Custodian</span>
                <div className="h-8 border-b border-slate-300 mb-1 flex items-end">
                  <span className="text-[10px] text-slate-300 italic">Signature required</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Vault Teller ID: #7741</span>
                  <span>Date: 2024-10-28</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Armored CIT Courier Lead</span>
                <div className="h-8 border-b border-slate-300 mb-1 flex items-end">
                  <span className="text-[10px] text-slate-300 italic">Dual-custody verification</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Guard Badge: #8920</span>
                  <span>Vehicle: Truck Unit B</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Tamper-Evident Bag Seal:
                <strong className="font-mono text-slate-800">#SEAL-DHA-99381</strong>
              </span>
              <span>Audit Trail: ISO-9001 Compliant</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Total Authorized Load:{' '}
            <strong className="font-mono text-slate-900 text-sm">
              ${totalLoaded.toLocaleString()}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Vault Pull Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Confirm & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
