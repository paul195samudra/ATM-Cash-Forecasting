import React from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy } from '../types/operations';
import {
  X,
  Sunrise,
  Truck,
  AlertOctagon,
  Clock,
  Calendar,
  CheckCircle2,
  Banknote,
  Fuel,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  atms: ATMRecord[];
  policy: OperationalPolicy;
  onNavigateToCit?: () => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  atms,
  policy,
  onNavigateToCit,
}) => {
  if (!isOpen) return null;

  const refillNow = atms.filter((a) => a.Status === 'Refill Now');
  const refillSoon = atms.filter((a) => a.Status === 'Refill Soon');
  const underOneDay = atms.filter((a) => Number(a.Days_of_Cash) < 1);
  const totalRefillReq = atms.reduce((acc, a) => acc + (a.Refill_Suggestion_Amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-xs text-white">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Daily Morning Operations Standup</h2>
              <p className="text-xs text-amber-100">
                08:00 AM Dispatch Briefing for CIT Drivers & Cash Officers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Quick status bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide block">
                Immediate Action
              </span>
              <span className="text-2xl font-black font-mono text-red-700 mt-1 block">
                {refillNow.length} ATMs
              </span>
              <span className="text-[10px] text-red-500 mt-0.5 block">Below 20% threshold</span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide block">
                &lt; 24hr Runway
              </span>
              <span className="text-2xl font-black font-mono text-amber-800 mt-1 block">
                {underOneDay.length} ATMs
              </span>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Depletion risk today</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                Required Outflow
              </span>
              <span className="text-2xl font-black font-mono text-emerald-800 mt-1 block">
                ৳{(totalRefillReq / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Total vault request</span>
            </div>
          </div>

          {/* Key Priority Directives */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Key Directives for Today:</h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Priority 1 Corridor: Dhaka Central & Motijheel Hub</strong>
                  <span>
                    Highest transaction velocity observed in commercial zones. Ensure Truck 1 departs
                    vault by 08:30 AM with certified tamper-evident cassette seals.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Peak Withdrawal Window: 12:30 PM - 03:00 PM</strong>
                  <span>
                    Lunchtime corporate withdrawals forecast to reach peak velocity. Pre-load critical machines before midday.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Operational Uptime Commitment: 99.5%</strong>
                  <span>
                    Zero reported customer cash-out events yesterday. Maintain target reserve buffer policy.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            Dismiss Standup
          </button>
          {onNavigateToCit && (
            <button
              type="button"
              onClick={() => {
                onNavigateToCit();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Go to CIT Dispatch Planner</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
