import React from 'react';
import {
  Layers,
  Truck,
  BrainCircuit,
  Workflow,
  ShieldCheck,
  Calendar,
  MapPin,
  Flame,
  Sliders,
  Scale,
  FileText,
  Sunrise,
  UploadCloud
} from 'lucide-react';

export type NavTab =
  | 'operations'
  | 'regional'
  | 'stress_test'
  | 'cit_dispatch'
  | 'capital_optimizer'
  | 'ml_forecast'
  | 'architecture';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  manifestCount: number;
  urgentCount: number;
  onOpenPolicyModal?: () => void;
  onOpenAuditModal?: () => void;
  onOpenBriefingModal?: () => void;
  onOpenImportModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  manifestCount,
  urgentCount,
  onOpenPolicyModal,
  onOpenAuditModal,
  onOpenBriefingModal,
  onOpenImportModal,
}) => {
  return (
    <header className="bg-[#121b28] text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                  ATM Cash Forecasting
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Decision Support
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Machine Learning Demand Prediction & Armored CIT Dispatch
              </p>
            </div>
          </div>

          {/* Right actions: Briefing, Audit, Import, Policy */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenBriefingModal && (
              <button
                onClick={onOpenBriefingModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                title="Daily morning standup briefing for CIT drivers"
              >
                <Sunrise className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Daily Standup</span>
              </button>
            )}

            {onOpenAuditModal && (
              <button
                onClick={onOpenAuditModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Executive audit & compliance export report"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Audit Report</span>
              </button>
            )}

            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Import fleet CSV data"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Import CSV</span>
              </button>
            )}

            {onOpenPolicyModal && (
              <button
                onClick={onOpenPolicyModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title="Configure safety stock thresholds and economic parameters"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Policy</span>
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">
                Snapshot: <strong className="text-white font-mono">2024-10-27</strong>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-semibold text-[11px]">256 Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 border-t border-slate-800/90 overflow-x-auto py-1 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => onTabChange('operations')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'operations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fleet Operations</span>
            {urgentCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('regional')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'regional'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Regional Sectors</span>
          </button>

          <button
            onClick={() => onTabChange('stress_test')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stress_test'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Stress Testing</span>
          </button>

          <button
            onClick={() => onTabChange('cit_dispatch')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cit_dispatch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-300" />
            <span>CIT Route & Refill</span>
            {manifestCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white font-mono">
                {manifestCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('capital_optimizer')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'capital_optimizer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Capital Optimizer</span>
          </button>

          <button
            onClick={() => onTabChange('ml_forecast')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ml_forecast'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>ML Demand Engine</span>
          </button>

          <button
            onClick={() => onTabChange('architecture')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>System Architecture</span>
          </button>
        </div>
      </div>
    </header>
  );
};
