import React, { useState, useMemo } from 'react';
import { atmData as initialAtmData, ATMRecord } from './data/atmData';
import { defaultOperationalPolicy, OperationalPolicy } from './types/operations';
import { evaluateAtmPolicyStatus } from './utils/cashCalculations';
import { Navbar, NavTab } from './components/Navbar';
import { KpiSummary } from './components/KpiSummary';
import { AtmChart } from './components/AtmChart';
import { AtmDetailCard } from './components/AtmDetailCard';
import { AtmTable } from './components/AtmTable';
import { CitDispatchPlanner } from './components/CitDispatchPlanner';
import { MlForecastExplorer } from './components/MlForecastExplorer';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { RegionalClusterView } from './components/RegionalClusterView';
import { StressTestEngine } from './components/StressTestEngine';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { CassetteConfiguratorModal } from './components/CassetteConfiguratorModal';
import { FormalManifestModal } from './components/FormalManifestModal';
import { BatchActionToolbar } from './components/BatchActionToolbar';
import { ExecutiveAuditReportModal } from './components/ExecutiveAuditReportModal';
import { CapitalOptimizerView } from './components/CapitalOptimizerView';
import { CsvImportModal } from './components/CsvImportModal';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { LiveTransactionSwitchModal } from './components/LiveTransactionSwitchModal';
import { ModelBacktestScorecardModal } from './components/ModelBacktestScorecardModal';
import { FestivalSurgeModal } from './components/FestivalSurgeModal';
import { FestivalSurgeState } from './types/festival';
import { ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [policy, setPolicy] = useState<OperationalPolicy>(defaultOperationalPolicy);
  const [baseAtms, setBaseAtms] = useState<ATMRecord[]>(initialAtmData);
  const [selectedId, setSelectedId] = useState<string>(
    initialAtmData.length > 0 ? initialAtmData[0].ATMID : ''
  );
  const [activeTab, setActiveTab] = useState<NavTab>('operations');

  // Filters for Operations table
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [daysFilter, setDaysFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multi-select batching
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  // CIT Manifest state
  const [manifestIds, setManifestIds] = useState<string[]>(() => {
    const critical = initialAtmData
      .filter((a) => a.Status === 'Refill Now' || (a.Status === 'Refill Soon' && Number(a.Days_of_Cash) < 0.8))
      .slice(0, 8)
      .map((a) => a.ATMID);
    return critical;
  });

  // Modals state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [cassetteAtm, setCassetteAtm] = useState<ATMRecord | null>(null);
  const [isFormalManifestOpen, setIsFormalManifestOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState<boolean>(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState<boolean>(false);

  // Custom Feature-Engineered Dataset State
  const [isCustomDataActive, setIsCustomDataActive] = useState<boolean>(false);
  const [customDataName, setCustomDataName] = useState<string>('');

  // Eid & Festival Liquidity Surge State
  const [festivalState, setFestivalState] = useState<FestivalSurgeState>({
    isActive: false,
    selectedFestivalId: 'eid_ul_fitr',
    selectedPhaseId: 'eif_t4',
    customMultiplier: 2.25,
    targetCorridors: 'all',
    prioritize1000Notes: true,
  });
  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState<boolean>(false);

  // Dynamically evaluated ATMs based on active policy and festival surge
  const atms = useMemo(() => {
    return baseAtms.map((a) => {
      let multiplier = 1.0;
      if (festivalState.isActive && festivalState.customMultiplier > 1) {
        if (festivalState.targetCorridors === 'all') {
          multiplier = festivalState.customMultiplier;
        } else if (festivalState.targetCorridors === 'cattle_markets_transit') {
          const reg = a.ATMID.slice(3, 6);
          if (['DHA', 'MOT', 'MAL', 'CTG', 'AGR', 'COM', 'MYM'].includes(reg)) {
            multiplier = festivalState.customMultiplier;
          } else {
            multiplier = 1.0 + (festivalState.customMultiplier - 1.0) * 0.4;
          }
        } else if (festivalState.targetCorridors === 'commercial_shopping') {
          const reg = a.ATMID.slice(3, 6);
          if (['GUL', 'BAN', 'DHA', 'MOT', 'ELP', 'CTG'].includes(reg)) {
            multiplier = festivalState.customMultiplier;
          } else {
            multiplier = 1.0 + (festivalState.customMultiplier - 1.0) * 0.3;
          }
        } else if (festivalState.targetCorridors === 'rural_hubs') {
          const reg = a.ATMID.slice(3, 6);
          if (['SYL', 'RAJ', 'KHU', 'BOG', 'DIN', 'PAB'].includes(reg)) {
            multiplier = festivalState.customMultiplier;
          } else {
            multiplier = 1.0 + (festivalState.customMultiplier - 1.0) * 0.3;
          }
        }
      }

      const predictedDemand = Math.round(a.Predicted_Demand * multiplier);
      const daysOfCash =
        predictedDemand > 0
          ? Math.round((a.Estimated_Cash_Remaining / predictedDemand) * 10) / 10
          : a.Days_of_Cash;

      const adjustedAtm: ATMRecord = {
        ...a,
        Predicted_Demand: predictedDemand,
        Days_of_Cash: daysOfCash,
      };

      const { status, refillSuggestion } = evaluateAtmPolicyStatus(adjustedAtm, policy);
      return {
        ...adjustedAtm,
        Status: status,
        Refill_Suggestion_Amount: refillSuggestion,
      };
    });
  }, [baseAtms, policy, festivalState]);

  // Selected ATM object
  const selectedAtm = useMemo(() => {
    return atms.find((a) => a.ATMID === selectedId) || atms[0];
  }, [atms, selectedId]);

  // Manifest ATM objects
  const manifestAtms = useMemo(() => {
    return atms.filter((a) => manifestIds.includes(a.ATMID));
  }, [atms, manifestIds]);

  // Handlers
  const handleToggleManifest = (atmId: string) => {
    setManifestIds((prev) =>
      prev.includes(atmId) ? prev.filter((id) => id !== atmId) : [...prev, atmId]
    );
  };

  const handleAddToManifest = (atm: ATMRecord) => {
    if (!manifestIds.includes(atm.ATMID)) {
      setManifestIds((prev) => [...prev, atm.ATMID]);
    }
  };

  const handleClearManifest = () => {
    setManifestIds([]);
  };

  const handleSimulateRefill = (atmId: string) => {
    setBaseAtms((prev) =>
      prev.map((a) => {
        if (a.ATMID === atmId) {
          const cap = a.ATM_Capacity;
          const pred = a.Predicted_Demand;
          const days = pred > 0 ? cap / pred : 10;
          return {
            ...a,
            Estimated_Cash_Remaining: cap,
            Cash_Remaining_Pct: 100,
            Days_of_Cash: days,
            Refill_Suggestion_Amount: 0,
            Status: 'OK',
          };
        }
        return a;
      })
    );
  };

  const handleBulkAddToManifest = (ids: string[]) => {
    setManifestIds((prev) => Array.from(new Set([...prev, ...ids])));
    setCheckedIds([]);
  };

  const handleBulkSimulateRefill = (ids: string[]) => {
    setBaseAtms((prev) =>
      prev.map((a) => {
        if (ids.includes(a.ATMID)) {
          const cap = a.ATM_Capacity;
          const pred = a.Predicted_Demand;
          const days = pred > 0 ? cap / pred : 10;
          return {
            ...a,
            Estimated_Cash_Remaining: cap,
            Cash_Remaining_Pct: 100,
            Days_of_Cash: days,
            Refill_Suggestion_Amount: 0,
            Status: 'OK',
          };
        }
        return a;
      })
    );
    setCheckedIds([]);
  };

  const handleToggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleKpiFilterClick = (filterType: 'all' | 'now' | 'soon' | 'lt1') => {
    setActiveTab('operations');
    if (filterType === 'all') {
      setStatusFilter('all');
      setDaysFilter('all');
    } else if (filterType === 'now') {
      setStatusFilter('Refill Now');
      setDaysFilter('all');
    } else if (filterType === 'soon') {
      setStatusFilter('Refill Soon');
      setDaysFilter('all');
    } else if (filterType === 'lt1') {
      setStatusFilter('all');
      setDaysFilter('lt1');
    }
  };

  const handleSelectAtm = (atmId: string) => {
    setSelectedId(atmId);
    setActiveTab('operations');
  };

  const handleImportedData = (imported: ATMRecord[], datasetName?: string) => {
    if (imported.length > 0) {
      setBaseAtms(imported);
      setSelectedId(imported[0].ATMID);
      const critical = imported
        .filter((a) => a.Status === 'Refill Now' || (a.Status === 'Refill Soon' && Number(a.Days_of_Cash) < 1.0))
        .slice(0, 8)
        .map((a) => a.ATMID);
      if (critical.length > 0) {
        setManifestIds(critical);
      }
      setIsCustomDataActive(true);
      setCustomDataName(datasetName || 'Feature-Engineered CSV');
    }
  };

  const handleResetToDefaultFleet = () => {
    setBaseAtms(initialAtmData);
    setSelectedId(initialAtmData.length > 0 ? initialAtmData[0].ATMID : '');
    const critical = initialAtmData
      .filter((a) => a.Status === 'Refill Now' || (a.Status === 'Refill Soon' && Number(a.Days_of_Cash) < 0.8))
      .slice(0, 8)
      .map((a) => a.ATMID);
    setManifestIds(critical);
    setIsCustomDataActive(false);
    setCustomDataName('');
  };

  // Live transaction handler from Switch Simulator
  const handleApplyLiveTransaction = (atmId: string, amount: number) => {
    setBaseAtms((prev) =>
      prev.map((a) => {
        if (a.ATMID === atmId) {
          const newRemaining = Math.max(0, a.Estimated_Cash_Remaining - amount);
          const pct = Math.round((newRemaining / (a.ATM_Capacity || 1)) * 1000) / 10;
          const days = a.Predicted_Demand > 0 ? newRemaining / a.Predicted_Demand : 0;
          return {
            ...a,
            Estimated_Cash_Remaining: newRemaining,
            Cash_Remaining_Pct: pct,
            Days_of_Cash: days,
          };
        }
        return a;
      })
    );
  };

  const handleUpdateFestivalState = (newState: FestivalSurgeState) => {
    setFestivalState(newState);
  };

  const handleQueueAtRiskAtms = (atmIds: string[]) => {
    setManifestIds((prev) => Array.from(new Set([...prev, ...atmIds])));
  };

  const urgentCount = atms.filter((a) => a.Status === 'Refill Now').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        manifestCount={manifestIds.length}
        urgentCount={urgentCount}
        isFestivalSurgeActive={festivalState.isActive}
        festivalMultiplier={festivalState.customMultiplier}
        onOpenFestivalModal={() => setIsFestivalModalOpen(true)}
        onOpenScorecardModal={() => setIsScorecardModalOpen(true)}
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenBriefingModal={() => setIsBriefingModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSwitchModal={() => setIsSwitchModalOpen(true)}
        isCustomDataActive={isCustomDataActive}
        onResetToDefault={handleResetToDefaultFleet}
        customDataCount={baseAtms.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full pb-24">
        {activeTab === 'operations' && (
          <div className="space-y-6">
            {/* Executive KPI Metric Tiles */}
            <KpiSummary
              atms={atms}
              onFilterClick={handleKpiFilterClick}
              activeFilter={
                statusFilter === 'Refill Now'
                  ? 'now'
                  : statusFilter === 'Refill Soon'
                  ? 'soon'
                  : daysFilter === 'lt1'
                  ? 'lt1'
                  : 'all'
              }
            />

            {/* Inspector Row: Detail Card (left) & Chart with Forward/Historical Tabs (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4 flex">
                <div className="w-full">
                  <AtmDetailCard
                    atm={selectedAtm}
                    onSimulateRefill={handleSimulateRefill}
                    onAddToManifest={handleAddToManifest}
                    onOpenCassetteModal={(atm) => setCassetteAtm(atm)}
                    isInManifest={selectedAtm ? manifestIds.includes(selectedAtm.ATMID) : false}
                  />
                </div>
              </div>
              <div className="lg:col-span-8 flex">
                <div className="w-full">
                  {selectedAtm && <AtmChart atm={selectedAtm} policy={policy} />}
                </div>
              </div>
            </div>

            {/* Fleet Data Table with Multi-Select & Regional Filtering */}
            <AtmTable
              atms={atms}
              selectedId={selectedId}
              onSelectAtm={setSelectedId}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              daysFilter={daysFilter}
              setDaysFilter={setDaysFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              regionFilter={regionFilter}
              setRegionFilter={setRegionFilter}
              checkedIds={checkedIds}
              onToggleCheck={handleToggleCheck}
              onCheckAll={setCheckedIds}
              onClearChecked={() => setCheckedIds([])}
              onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
              onQuickAddToManifest={handleAddToManifest}
              onQuickSimulateRefill={handleSimulateRefill}
              manifestIds={manifestIds}
              policy={policy}
              isCustomDataActive={isCustomDataActive}
              customDataName={customDataName}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onResetToDefault={handleResetToDefaultFleet}
            />
          </div>
        )}

        {activeTab === 'regional' && (
          <RegionalClusterView
            atms={atms}
            policy={policy}
            onSelectAtm={handleSelectAtm}
            onSelectRegionFilter={(code) => {
              setRegionFilter(code);
              setActiveTab('operations');
            }}
          />
        )}

        {activeTab === 'stress_test' && (
          <StressTestEngine
            atms={atms}
            policy={policy}
            onAddAtmToManifest={handleAddToManifest}
            manifestIds={manifestIds}
          />
        )}

        {activeTab === 'cit_dispatch' && (
          <CitDispatchPlanner
            atms={atms}
            manifestIds={manifestIds}
            onToggleManifest={handleToggleManifest}
            onClearManifest={handleClearManifest}
            onSelectAtm={handleSelectAtm}
            onOpenFormalManifest={() => setIsFormalManifestOpen(true)}
            onOpenFestivalModal={() => setIsFestivalModalOpen(true)}
            isFestivalSurgeActive={festivalState.isActive}
            festivalMultiplier={festivalState.customMultiplier}
          />
        )}

        {activeTab === 'capital_optimizer' && (
          <CapitalOptimizerView
            atms={atms}
            policy={policy}
            onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
          />
        )}

        {activeTab === 'ml_forecast' && <MlForecastExplorer />}

        {activeTab === 'architecture' && <ArchitectureGuide />}
      </main>

      {/* Floating Multi-Select Batch Action Toolbar */}
      <BatchActionToolbar
        selectedIds={checkedIds}
        allAtms={atms}
        onClearSelection={() => setCheckedIds([])}
        onBulkAddToManifest={handleBulkAddToManifest}
        onBulkSimulateRefill={handleBulkSimulateRefill}
        onOpenFormalManifest={() => setIsFormalManifestOpen(true)}
      />

      {/* Modals */}
      {isPolicyModalOpen && (
        <PolicyConfigModal
          currentPolicy={policy}
          atms={atms}
          isOpen={isPolicyModalOpen}
          onClose={() => setIsPolicyModalOpen(false)}
          onSavePolicy={setPolicy}
        />
      )}

      {cassetteAtm && (
        <CassetteConfiguratorModal
          atm={cassetteAtm}
          isOpen={!!cassetteAtm}
          onClose={() => setCassetteAtm(null)}
        />
      )}

      {isFormalManifestOpen && (
        <FormalManifestModal
          atms={manifestAtms.length > 0 ? manifestAtms : atms.slice(0, 10)}
          isOpen={isFormalManifestOpen}
          onClose={() => setIsFormalManifestOpen(false)}
        />
      )}

      <ModelBacktestScorecardModal
        isOpen={isScorecardModalOpen}
        onClose={() => setIsScorecardModalOpen(false)}
        atms={atms}
      />

      <ExecutiveAuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        atms={atms}
        policy={policy}
      />

      <DailyBriefingModal
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        atms={atms}
        policy={policy}
        onNavigateToCit={() => setActiveTab('cit_dispatch')}
      />

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportData={handleImportedData}
        onResetToDefault={handleResetToDefaultFleet}
        isCustomDataActive={isCustomDataActive}
        totalAtmsCount={baseAtms.length}
      />

      <LiveTransactionSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        atms={baseAtms}
        onApplyTransaction={handleApplyLiveTransaction}
        onSelectAtm={handleSelectAtm}
      />

      <FestivalSurgeModal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        festivalState={festivalState}
        onUpdateFestivalState={handleUpdateFestivalState}
        atms={atms}
        onQueueAtRiskAtms={handleQueueAtRiskAtms}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">
              ATM Cash Forecasting Decision-Support System
            </span>
            <span className="text-slate-400">|</span>
            <span>256 Network Terminals • Enterprise Banking Edition</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Policy: &le;{policy.refillNowPctThreshold}% Critical Floor</span>
            <span className="text-slate-300">•</span>
            <span>Safety Buffer: {policy.minDaysBuffer}d</span>
            <span className="text-slate-300">•</span>
            <span>Automated Cash Optimization</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
