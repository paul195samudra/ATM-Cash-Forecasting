import React, { useState } from 'react';
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
  FileText,
  Sunrise,
  UploadCloud,
  Radio,
  Clock,
  UserCheck,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Scale,
  RotateCcw
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
  isFestivalSurgeActive?: boolean;
  festivalMultiplier?: number;
  onOpenFestivalModal?: () => void;
  onOpenScorecardModal?: () => void;
  onOpenPolicyModal?: () => void;
  onOpenAuditModal?: () => void;
  onOpenBriefingModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenSwitchModal?: () => void;
  isCustomDataActive?: boolean;
  onResetToDefault?: () => void;
  customDataCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  manifestCount,
  urgentCount,
  isFestivalSurgeActive = false,
  festivalMultiplier = 1.0,
  onOpenFestivalModal,
  onOpenScorecardModal,
  onOpenPolicyModal,
  onOpenAuditModal,
  onOpenBriefingModal,
  onOpenImportModal,
  onOpenSwitchModal,
  isCustomDataActive = false,
  onResetToDefault,
  customDataCount = 0,
}) => {
  return (
    <header className="bg-[#0f172a] text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                  ATM Cash Forecasting
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-md bg-slate-800 text-slate-300 border border-slate-700/80">
                  Enterprise Banking
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Machine Learning Demand Prediction & Armored CIT Dispatch
              </p>
            </div>
          </div>

          {/* Center-Right: Enterprise Roles & Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Eid & Festival Liquidity Surge Planner */}
            {onOpenFestivalModal && (
              <button
                onClick={onOpenFestivalModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                  isFestivalSurgeActive
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 hover:bg-amber-900/70'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Eid & Festival Liquidity Surge Planner (Bangladesh Bank Calendar)"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isFestivalSurgeActive ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">
                  {isFestivalSurgeActive ? `Eid Surge (${festivalMultiplier.toFixed(1)}x)` : 'Festival Planner'}
                </span>
                {isFestivalSurgeActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </button>
            )}

            {/* Model Accuracy Backtest Scorecard */}
            {onOpenScorecardModal && (
              <button
                onClick={onOpenScorecardModal}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer shadow-xs"
                title="Model Backtesting: MAPE 4.2%, R² 0.94, Under-prediction risk"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-slate-400" />
                <span>Scorecard</span>
              </button>
            )}

            {/* Live Core Switch Stream */}
            {onOpenSwitchModal && (
              <button
                onClick={onOpenSwitchModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer shadow-xs"
                title="Live Core Banking Switch & Telemetry Stream (ISO-8583)"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden xl:inline">Switch Stream</span>
              </button>
            )}

            {/* Daily Briefing */}
            {onOpenBriefingModal && (
              <button
                onClick={onOpenBriefingModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer shadow-xs"
                title="Daily morning standup briefing for CIT drivers"
              >
                <Sunrise className="w-3.5 h-3.5 text-slate-400" />
                <span>Standup</span>
              </button>
            )}

            {/* Policy Modal */}
            {onOpenPolicyModal && (
              <button
                onClick={onOpenPolicyModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors cursor-pointer shadow-xs"
                title="Configure safety stock thresholds and economic parameters"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Policy</span>
              </button>
            )}

            {/* Feature-Engineered CSV Importer */}
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                  isCustomDataActive
                    ? 'bg-blue-950/70 border-blue-500/60 text-blue-300 hover:bg-blue-900/70'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
                title="Upload feature engineered CSV file to update entire app data"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isCustomDataActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">
                  {isCustomDataActive ? `Feature Fleet (${customDataCount})` : 'Import CSV'}
                </span>
                {isCustomDataActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                )}
              </button>
            )}

            {/* 1-Click Reset to Default App Data */}
            {isCustomDataActive && onResetToDefault && (
              <button
                onClick={onResetToDefault}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/60 text-rose-300 transition-all cursor-pointer shadow-xs"
                title="Reset back to default 256 football legends fleet"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Reset Default</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 border-t border-slate-800 overflow-x-auto py-1.5 text-xs font-medium scrollbar-none">
          <button
            onClick={() => onTabChange('operations')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'operations'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fleet Operations</span>
            {urgentCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white font-mono">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('regional')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'regional'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Regional Corridors</span>
          </button>

          <button
            onClick={() => onTabChange('stress_test')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stress_test'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Stress Testing</span>
          </button>

          <button
            onClick={() => onTabChange('cit_dispatch')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cit_dispatch'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>CIT Route & Refill</span>
            {manifestCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white font-mono">
                {manifestCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('capital_optimizer')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'capital_optimizer'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Capital Optimizer</span>
          </button>

          <button
            onClick={() => onTabChange('ml_forecast')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ml_forecast'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>ML Demand Engine</span>
          </button>

          <button
            onClick={() => onTabChange('architecture')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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
