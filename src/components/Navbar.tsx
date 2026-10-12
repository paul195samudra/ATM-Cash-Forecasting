import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  FileSpreadsheet,
  LogOut,
  User as UserIcon,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { User } from '../types/auth';

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
  currentUser?: User | null;
  onLogout?: () => void;
  isFestivalSurgeActive?: boolean;
  festivalMultiplier?: number;
  onOpenFestivalModal?: () => void;
  onOpenScorecardModal?: () => void;
  onOpenPolicyModal?: () => void;
  onOpenAuditModal?: () => void;
  onOpenBriefingModal?: () => void;
  onOpenImportModal?: () => void;
  onOpenSwitchModal?: () => void;
  onOpenReportsModal?: () => void;
  isCustomDataActive?: boolean;
  onResetToDefault?: () => void;
  customDataCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  manifestCount,
  urgentCount,
  currentUser,
  onLogout,
  isFestivalSurgeActive = false,
  festivalMultiplier = 1.0,
  onOpenFestivalModal,
  onOpenScorecardModal,
  onOpenPolicyModal,
  onOpenAuditModal,
  onOpenBriefingModal,
  onOpenImportModal,
  onOpenSwitchModal,
  onOpenReportsModal,
  isCustomDataActive = false,
  onResetToDefault,
  customDataCount = 0,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="bg-[#0f172a] text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md shrink-0 flex items-center justify-center ring-1 ring-blue-500/30">
              <img
                src="/src/assets/images/atm_app_logo_1791799184731.jpg"
                alt="ATM Cash Forecasting Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
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

            {/* Smart CSV & Executive Reporting Suite */}
            {onOpenReportsModal && (
              <button
                onClick={onOpenReportsModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-xs font-semibold text-emerald-300 border border-emerald-500/50 transition-colors cursor-pointer shadow-xs"
                title="Open Smart CSV Export & Executive Reporting Suite"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Reports & CSV</span>
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

            {/* Reset to Default Button */}
            {onResetToDefault && (
              <button
                type="button"
                onClick={onResetToDefault}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isCustomDataActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500 animate-pulse'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                }`}
                title={
                  isCustomDataActive
                    ? `Reset custom CSV data back to default fleet (${customDataCount} active)`
                    : 'Reset fleet state and filters back to default'
                }
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isCustomDataActive ? 'Reset to Default' : 'Reset Fleet'}</span>
              </button>
            )}

            {/* User Profile Badge & Dropdown */}
            {currentUser && (
              <div className="relative ml-1 pl-2 border-l border-slate-800" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer group shadow-xs"
                  title="Active Terminal Operator Profile"
                >
                  <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/20 shadow-xs shrink-0`}>
                    {(currentUser.name || currentUser.email || 'OP')
                      .split(/[\s@._-]+/)
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'OP'}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 flex items-center gap-1.5">
                      <span className="truncate max-w-[120px]">{currentUser.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[120px] font-mono">
                      {currentUser.badgeId}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                      <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm ring-2 ring-white/10 shrink-0`}>
                        {(currentUser.name || currentUser.email || 'OP')
                          .split(/[\s@._-]+/)
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase() || 'OP'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm text-white truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-blue-400 font-medium truncate">{currentUser.role}</p>
                        <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs text-slate-300 border-b border-slate-800">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Terminal Node:</span>
                        <span className="font-mono text-emerald-400 font-semibold">{currentUser.badgeId}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Unit:</span>
                        <span className="text-slate-300 truncate max-w-[150px]">{currentUser.department}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Security Access:</span>
                        <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 text-[10px] border border-blue-800">
                          Level-4 Clearance
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-800/80 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Lock Terminal & Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
