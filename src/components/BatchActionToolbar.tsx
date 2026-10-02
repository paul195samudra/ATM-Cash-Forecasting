import React from 'react';
import { ATMRecord } from '../data/atmData';
import {
  CheckSquare,
  Truck,
  RotateCcw,
  FileSpreadsheet,
  X,
  FileCheck
} from 'lucide-react';

interface BatchActionToolbarProps {
  selectedIds: string[];
  allAtms: ATMRecord[];
  onClearSelection: () => void;
  onBulkAddToManifest: (ids: string[]) => void;
  onBulkSimulateRefill: (ids: string[]) => void;
  onOpenFormalManifest: () => void;
}

export const BatchActionToolbar: React.FC<BatchActionToolbarProps> = ({
  selectedIds,
  allAtms,
  onClearSelection,
  onBulkAddToManifest,
  onBulkSimulateRefill,
  onOpenFormalManifest,
}) => {
  if (selectedIds.length === 0) return null;

  const selectedAtms = allAtms.filter((a) => selectedIds.includes(a.ATMID));
  const totalRefillCash = selectedAtms.reduce(
    (sum, a) => sum + (a.Refill_Suggestion_Amount || 0),
    0
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md flex flex-wrap items-center gap-4 transition-all">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-blue-400" />
        <span className="font-bold text-xs">
          <strong className="text-white font-mono">{selectedIds.length}</strong> ATMs Selected
        </span>
        <span className="text-slate-400 text-xs">·</span>
        <span className="text-xs font-mono text-emerald-400 font-bold">
          ${(totalRefillCash / 1000000).toFixed(2)}M Refill Cash
        </span>
      </div>

      <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onBulkAddToManifest(selectedIds)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Add to CIT Route</span>
        </button>

        <button
          onClick={() => onBulkSimulateRefill(selectedIds)}
          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Simulate Batch Refill</span>
        </button>

        <button
          onClick={onOpenFormalManifest}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Official Carrier Order</span>
        </button>

        <button
          onClick={onClearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
