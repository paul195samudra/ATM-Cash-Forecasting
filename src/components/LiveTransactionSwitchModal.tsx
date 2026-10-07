import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Zap,
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Activity,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Layers,
  Flame,
  ArrowRight
} from 'lucide-react';
import { ATMRecord } from '../data/atmData';
import { LiveSwitchTransaction } from '../types/operations';

interface LiveTransactionSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  atms: ATMRecord[];
  onApplyTransaction: (atmId: string, amount: number) => void;
  onSelectAtm?: (atmId: string) => void;
}

export const LiveTransactionSwitchModal: React.FC<LiveTransactionSwitchModalProps> = ({
  isOpen,
  onClose,
  atms,
  onApplyTransaction,
  onSelectAtm,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1 = normal, 3 = fast, 5 = surge
  const [transactions, setTransactions] = useState<LiveSwitchTransaction[]>([]);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [alertsCount, setAlertsCount] = useState<number>(0);

  const transactionsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !isRunning || atms.length === 0) return;

    const intervalMs = Math.max(200, Math.round(1400 / speedMultiplier));

    const interval = setInterval(() => {
      // Pick a random ATM from the fleet, with higher probability for commercial hubs
      const targetAtm = atms[Math.floor(Math.random() * atms.length)];
      if (!targetAtm || targetAtm.Estimated_Cash_Remaining <= 0) return;

      // Realistic ATM withdrawal amount: random between ৳1,000 and ৳20,000 (typical ATM transaction limits)
      const noteSteps = [1000, 2000, 3000, 5000, 8000, 10000, 15000, 20000];
      const amount = noteSteps[Math.floor(Math.random() * noteSteps.length)];

      const remainingAfter = Math.max(0, targetAtm.Estimated_Cash_Remaining - amount);
      const pctAfter = Math.round((remainingAfter / (targetAtm.ATM_Capacity || 1)) * 1000) / 10;

      let statusAfter: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
      if (pctAfter <= 20) statusAfter = 'Refill Now';
      else if (pctAfter <= 40) statusAfter = 'Refill Soon';

      const isAlert = pctAfter <= 20 && targetAtm.Cash_Remaining_Pct > 20;

      const newTx: LiveSwitchTransaction = {
        id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        atmId: targetAtm.ATMID,
        location: targetAtm.Location.replace('(location not in dataset)', '').trim() || 'Central Core',
        amount,
        remainingCashAfter: remainingAfter,
        pctAfter,
        statusAfter,
        isAlert,
      };

      setTransactions((prev) => [newTx, ...prev.slice(0, 49)]); // keep latest 50 txns
      setTotalVolume((prev) => prev + amount);
      if (isAlert) setAlertsCount((prev) => prev + 1);

      // Decrement cash in global state
      onApplyTransaction(targetAtm.ATMID, amount);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, speedMultiplier, atms, onApplyTransaction]);

  if (!isOpen) return null;

  const handleSurgeSpike = () => {
    setSpeedMultiplier(8);
    setTimeout(() => {
      setSpeedMultiplier(1);
    }, 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0c1424] via-[#162744] to-[#0c1424] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Core Banking Switch & Telemetry Stream
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ISO-8583 Live Feed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulating continuous withdrawal transactions across 256 network terminals
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

        {/* Live Controller Bar */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Pause Telemetry' : 'Resume Telemetry'}</span>
            </button>

            <button
              onClick={handleSurgeSpike}
              className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Simulates 10 seconds of high-velocity lunchtime withdrawals"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Surge Spike</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 px-1 font-semibold">Speed:</span>
              {[1, 3, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    speedMultiplier === spd
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Session Outflow</span>
              <strong className="text-emerald-400 font-mono text-xs">
                ৳{totalVolume.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Live Transaction Stream List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-sans">
              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
              <p>Connecting to Core Switch ISO-8583 gateway...</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectAtm && onSelectAtm(tx.atmId)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  tx.isAlert
                    ? 'bg-red-950/40 border-red-500/60 text-red-200 animate-pulse'
                    : tx.statusAfter === 'Refill Now'
                    ? 'bg-red-900/10 border-red-800/40 text-slate-300'
                    : tx.statusAfter === 'Refill Soon'
                    ? 'bg-amber-900/10 border-amber-800/40 text-slate-300'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{tx.timestamp}</span>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{tx.atmId}</span>
                    <span className="text-slate-400 font-normal font-sans text-[11px] truncate max-w-[160px]">
                      {tx.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-emerald-400">
                    -৳{tx.amount.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Bal: ৳{Math.round(tx.remainingCashAfter).toLocaleString()} ({tx.pctAfter}%)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                      tx.statusAfter === 'Refill Now'
                        ? 'bg-red-500 text-white'
                        : tx.statusAfter === 'Refill Soon'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-blue-600/30 text-blue-300'
                    }`}
                  >
                    {tx.statusAfter}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div>
            Transactions Processed:{' '}
            <strong className="text-white font-mono">{transactions.length}</strong> · Critical Threshold
            Breaches: <strong className="text-red-400 font-mono">{alertsCount}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
