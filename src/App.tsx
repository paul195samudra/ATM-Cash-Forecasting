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

  // Dynamically evaluated ATMs based on active policy
  const atms = useMemo(() => {
    return baseAtms.map((a) => {
      const { status, refillSuggestion } = evaluateAtmPolicyStatus(a, policy);
      return {
        ...a,
        Status: status,
        Refill_Suggestion_Amount: refillSuggestion,
      };
    });
  }, [baseAtms, policy]);

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

  const handleImportedData = (imported: ATMRecord[]) => {
    if (imported.length > 0) {
      setBaseAtms(imported);
      setSelectedId(imported[0].ATMID);
    }
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
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenBriefingModal={() => setIsBriefingModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
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
            <span>256 Network Terminals • 2024 Full-Year Model Inference</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Policy: &le;{policy.refillNowPctThreshold}% Critical Floor</span>
            <span className="text-slate-300">•</span>
            <span>Safety Buffer: {policy.minDaysBuffer}d</span>
            <span className="text-slate-300">•</span>
            <span>Asymmetric Loss Minimizer</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
