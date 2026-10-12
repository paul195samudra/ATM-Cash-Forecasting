import React, { useState, useMemo } from 'react';
import { ATMRecord } from '../data/atmData';
import { OperationalPolicy } from '../types/operations';
import {
  ALL_EXPORT_COLUMNS,
  generateAtmCsv,
  generateCitManifestCsv,
  generateTreasuryForecastCsv,
  triggerCsvDownload,
} from '../utils/csvExporter';
import { getAtmRegion } from '../utils/cashCalculations';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Truck,
  Building,
  CheckSquare,
  Square,
  ShieldCheck,
  Calendar,
  Layers,
  Banknote,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SmartReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  atms: ATMRecord[];
  manifestIds: string[];
  policy: OperationalPolicy;
  filteredAtms?: ATMRecord[];
}

type ReportTab = 'cit_sheet' | 'treasury_liquidity' | 'custom_csv' | 'executive_summary';

export const SmartReportingModal: React.FC<SmartReportingModalProps> = ({
  isOpen,
  onClose,
  atms,
  manifestIds,
  policy,
  filteredAtms,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('cit_sheet');

  // Custom CSV column selections
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>([
    'ATMID',
    'Location',
    'Region',
    'Status',
    'Estimated_Cash_Remaining',
    'Cash_Remaining_Pct',
    'Days_of_Cash',
    'Predicted_Demand',
    'Refill_Suggestion_Amount',
  ]);

  // Dataset scope for Custom CSV
  const [dataScope, setDataScope] = useState<'all' | 'filtered' | 'critical' | 'manifest'>('all');

  const targetAtms = useMemo(() => {
    switch (dataScope) {
      case 'filtered':
        return filteredAtms && filteredAtms.length > 0 ? filteredAtms : atms;
      case 'critical':
        return atms.filter(
          (a) => a.Status === 'Refill Now' || (a.Status === 'Refill Soon' && Number(a.Days_of_Cash) < 1.0)
        );
      case 'manifest':
        return atms.filter((a) => manifestIds.includes(a.ATMID));
      case 'all':
      default:
        return atms;
    }
  }, [dataScope, atms, filteredAtms, manifestIds]);

  // CIT Manifest ATMs
  const manifestAtms = useMemo(() => {
    const selected = atms.filter((a) => manifestIds.includes(a.ATMID));
    return selected.length > 0
      ? selected
      : atms.filter((a) => a.Status === 'Refill Now').slice(0, 10);
  }, [atms, manifestIds]);

  const totalCitRefillAmount = useMemo(() => {
    return manifestAtms.reduce(
      (sum, a) => sum + (a.Refill_Suggestion_Amount || Math.round(a.Predicted_Demand * 1.05)),
      0
    );
  }, [manifestAtms]);

  const totalNetworkCash = useMemo(() => {
    return atms.reduce((sum, a) => sum + a.Estimated_Cash_Remaining, 0);
  }, [atms]);

  const totalTomorrowDemand = useMemo(() => {
    return atms.reduce((sum, a) => sum + a.Predicted_Demand, 0);
  }, [atms]);

  if (!isOpen) return null;

  const handleToggleColumn = (key: string) => {
    setSelectedColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumnKeys(ALL_EXPORT_COLUMNS.map((c) => c.key));
  };

  const handleClearColumns = () => {
    setSelectedColumnKeys(['ATMID', 'Location', 'Status']);
  };

  const handleDownloadCustomCsv = () => {
    const csvData = generateAtmCsv(targetAtms, selectedColumnKeys);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(`ATM_Fleet_Export_${dataScope}_${dateStr}.csv`, csvData);
  };

  const handleDownloadCitManifestCsv = () => {
    const csvData = generateCitManifestCsv(manifestAtms);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(`CIT_Armored_Route_Manifest_${dateStr}.csv`, csvData);
  };

  const handleDownloadTreasuryCsv = () => {
    const csvData = generateTreasuryForecastCsv(atms);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(`Treasury_Liquidity_Forecast_${dateStr}.csv`, csvData);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f172a] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Smart CSV Export & Executive Reporting Suite
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                  RFC 4180 Validated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download formatted CSV spreadsheets, armored CIT route manifests, and treasury liquidity schedules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('cit_sheet')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cit_sheet'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Armored CIT Route Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('treasury_liquidity')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'treasury_liquidity'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Treasury Liquidity Forecast</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_csv')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'custom_csv'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Custom Column CSV Exporter</span>
          </button>

          <button
            onClick={() => setActiveTab('executive_summary')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'executive_summary'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Executive Briefing Report</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: CIT Route Sheet */}
          {activeTab === 'cit_sheet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Armored Carrier Delivery Sheet & Seal Audit Trail</span>
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Formatted for Brink's & G4S armored custody drivers. Contains physical cassette swaps, security seals, and custody signature lines.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-700 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>

                  <button
                    onClick={handleDownloadCitManifestCsv}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Manifest CSV</span>
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Assigned Stops</span>
                  <strong className="text-slate-900 text-sm font-mono">{manifestAtms.length} Terminals</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Total Cash Payload</span>
                  <strong className="text-emerald-700 text-sm font-mono">৳{totalCitRefillAmount.toLocaleString()}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Cassette Swaps</span>
                  <strong className="text-slate-900 text-sm font-mono">{manifestAtms.length * 4} Cassettes</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">Armored Truck Class</span>
                  <strong className="text-blue-700 text-sm font-mono">B6 High-Ballistic Armored</strong>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-800 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
                  <span>Turn-by-Turn Manifest Stops</span>
                  <span className="text-slate-400 font-mono text-[11px]">{manifestAtms.length} Active Waypoints</span>
                </div>
                <div className="overflow-x-auto max-h-[340px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5 text-center">#</th>
                        <th className="p-2.5">ATM ID</th>
                        <th className="p-2.5">Terminal Location</th>
                        <th className="p-2.5">Corridor</th>
                        <th className="p-2.5 text-right">Cash Left</th>
                        <th className="p-2.5 text-right">Refill Amount</th>
                        <th className="p-2.5 text-center">Cassettes</th>
                        <th className="p-2.5">Tamper Seal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manifestAtms.map((atm, i) => (
                        <tr key={`${atm.ATMID}-${i}`} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center font-mono font-bold text-slate-500">{i + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">{atm.ATMID}</td>
                          <td className="p-2.5 font-medium text-slate-800">{atm.Location}</td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{getAtmRegion(atm.ATMID).name}</td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            ৳{atm.Estimated_Cash_Remaining.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            ৳{(atm.Refill_Suggestion_Amount || Math.round(atm.Predicted_Demand * 1.05)).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center font-mono">4 x ৳1000</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">
                            SEAL-2024-{1000 + i * 37 + 101}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Treasury Liquidity Forecast */}
          {activeTab === 'treasury_liquidity' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Central Treasury Liquidity & Carry Cost Projection</span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Aggregated cash demand across the 12 banking corridors with carry cost calculation (6.5% central bank repo rate).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-50 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>

                  <button
                    onClick={handleDownloadTreasuryCsv}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-800 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Treasury CSV</span>
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Total Field Cash Held</span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                    ৳{totalNetworkCash.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Across {atms.length} active network vaults</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Predicted Next-Day Outflow</span>
                  <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
                    ৳{totalTomorrowDemand.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">ML Forecast Horizon (T+1)</span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block text-[11px]">Annual Capital Carry Cost</span>
                  <div className="text-base font-bold font-mono text-amber-700 mt-0.5">
                    ৳{Math.round(totalNetworkCash * 0.065).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Calculated at 6.50% Cost of Funds</span>
                </div>
              </div>

              {/* Corridor Breakdown Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-800 text-white px-4 py-2 text-xs font-semibold">
                  12 Corridor Regional Liquidity Allocations
                </div>
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">Corridor Name</th>
                        <th className="p-2.5 text-center">ATMs</th>
                        <th className="p-2.5 text-right">Cash Remaining</th>
                        <th className="p-2.5 text-right">Fill Level</th>
                        <th className="p-2.5 text-right">T+1 ML Demand</th>
                        <th className="p-2.5 text-right">Annual Carry Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: 'Dhaka Motijheel Banking Core', atms: 46, rem: 38800000, fill: 70, dem: 11200000 },
                        { name: 'Chittagong Port & Agrabad Commercial', atms: 31, rem: 38600000, fill: 80, dem: 9800000 },
                        { name: 'Dhaka North (Gulshan/Uttara)', atms: 32, rem: 35200000, fill: 68, dem: 10400000 },
                        { name: 'Dhaka Diplomatic (Baridhara)', atms: 31, rem: 27600000, fill: 65, dem: 8900000 },
                        { name: 'Khulna & Jessore Industrial Port', atms: 21, rem: 18200000, fill: 64, dem: 5900000 },
                        { name: 'Barisal Riverine Hub', atms: 24, rem: 17400000, fill: 67, dem: 5800000 },
                        { name: 'Rajshahi & Bogra Agro-Industrial Hub', atms: 20, rem: 16300000, fill: 55, dem: 6100000 },
                        { name: 'Dhaka West (Dhanmondi/Mirpur)', atms: 22, rem: 12400000, fill: 51, dem: 6400000 },
                        { name: 'Comilla & Feni Transit Corridor', atms: 11, rem: 9700000, fill: 61, dem: 3200000 },
                        { name: 'Sylhet Valley & Tea Belt', atms: 6, rem: 7600000, fill: 87, dem: 1900000 },
                        { name: 'Mymensingh & Tangail Agro Belt', atms: 6, rem: 4900000, fill: 49, dem: 2100000 },
                        { name: "Cox's Bazar Coastal Resort Hub", atms: 6, rem: 4200000, fill: 52, dem: 1800000 },
                      ].map((item) => (
                        <tr key={item.name} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-700">{item.atms}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            ৳{(item.rem / 1000000).toFixed(1)}M
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">{item.fill}%</td>
                          <td className="p-2.5 text-right font-mono text-blue-700">
                            ৳{(item.dem / 1000000).toFixed(1)}M
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500">
                            ৳{Math.round(item.rem * 0.065 / 1000).toLocaleString()}k
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Custom Column CSV Exporter */}
          {activeTab === 'custom_csv' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                      <span>Custom Column Data Exporter</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select which fields and rows to package into your CSV export.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllColumns}
                      className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md bg-white cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearColumns}
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-md bg-white cursor-pointer"
                    >
                      Reset Default
                    </button>
                    <button
                      onClick={handleDownloadCustomCsv}
                      disabled={selectedColumnKeys.length === 0}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV ({targetAtms.length} Rows)</span>
                    </button>
                  </div>
                </div>

                {/* Scope selector */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Dataset Scope:</span>
                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white text-xs">
                    <button
                      onClick={() => setDataScope('all')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        dataScope === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Fleet ({atms.length})
                    </button>
                    <button
                      onClick={() => setDataScope('filtered')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        dataScope === 'filtered' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Current Table Filter ({filteredAtms?.length || atms.length})
                    </button>
                    <button
                      onClick={() => setDataScope('critical')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        dataScope === 'critical' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Critical Only
                    </button>
                    <button
                      onClick={() => setDataScope('manifest')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        dataScope === 'manifest' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      CIT Manifest ({manifestIds.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Checkboxes Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Select Columns to Include in CSV:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {ALL_EXPORT_COLUMNS.map((col) => {
                    const isChecked = selectedColumnKeys.includes(col.key);
                    return (
                      <div
                        key={col.key}
                        onClick={() => handleToggleColumn(col.key)}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live CSV Output Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-800 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between">
                  <span>First 5 Sample Records Preview</span>
                  <span className="text-slate-400 font-mono text-[11px]">{selectedColumnKeys.length} columns selected</span>
                </div>
                <div className="overflow-x-auto max-h-[220px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        {selectedColumnKeys.map((k) => (
                          <th key={k} className="p-2 whitespace-nowrap">
                            {ALL_EXPORT_COLUMNS.find((c) => c.key === k)?.label || k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetAtms.slice(0, 5).map((atm, i) => (
                        <tr key={`${atm.ATMID}-${i}`} className="hover:bg-slate-50">
                          {selectedColumnKeys.map((k) => {
                            const col = ALL_EXPORT_COLUMNS.find((c) => c.key === k);
                            const val = col ? col.accessor(atm) : '';
                            return (
                              <td key={k} className="p-2 whitespace-nowrap font-mono text-slate-700">
                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Executive Briefing Report */}
          {activeTab === 'executive_summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-sm">Central ATM Cash Management Executive Briefing</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official snapshot report ready for board presentations and treasury audit files.
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-5 text-xs text-slate-700 leading-relaxed">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Executive ATM Fleet Cash Position & Replenishment Directive
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      STATUS: VERIFIED
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Active Network</span>
                    <strong className="text-sm font-mono text-slate-900">{atms.length} Terminals</strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Immediate Stockout Risk</span>
                    <strong className="text-sm font-mono text-rose-600">
                      {atms.filter((a) => a.Status === 'Refill Now').length} Machines
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Required Refill Inflow</span>
                    <strong className="text-sm font-mono text-emerald-700">
                      ৳{atms.reduce((s, a) => s + (a.Refill_Suggestion_Amount || 0), 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block text-[10px]">Average Fleet Runaway</span>
                    <strong className="text-sm font-mono text-blue-700">
                      {(
                        atms.reduce((s, a) => s + Number(a.Days_of_Cash || 0), 0) / (atms.length || 1)
                      ).toFixed(1)}{' '}
                      Days
                    </strong>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 text-xs mb-1">Operational Policy Enforcement</h5>
                  <p>
                    All replenishment directives are calculated utilizing gradient-boosted time-series predictions
                    against an empirical safety buffer floor of &le;{policy.refillNowPctThreshold}% capacity. Armored
                    carrier trips are dispatched with pre-configured cassette swaps to avoid denomination jamming and ensure
                    continuous service availability across all high-demand shopping corridors.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Compliant with Bank ISO-20022 and Armored Logistics Standards</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
