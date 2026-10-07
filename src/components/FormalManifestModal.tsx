import React, { useState } from 'react';
import { ATMRecord } from '../data/atmData';
import { DEFAULT_CIT_CARRIERS, CitCarrierContract } from '../types/operations';
import {
  FileCheck,
  Printer,
  Download,
  X,
  Building,
  ShieldCheck,
  Lock,
  Truck,
  QrCode,
  Barcode,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface FormalManifestModalProps {
  atms: ATMRecord[];
  isOpen: boolean;
  onClose: () => void;
  selectedCarrierId?: string;
}

export const FormalManifestModal: React.FC<FormalManifestModalProps> = ({
  atms,
  isOpen,
  onClose,
  selectedCarrierId = 'brinks',
}) => {
  const [carrierId, setCarrierId] = useState<string>(selectedCarrierId);
  const [manifestOrderNum] = useState<string>(
    `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
      new Date().getDate()
    ).padStart(2, '0')}-09${Math.floor(10 + Math.random() * 90)}`
  );

  if (!isOpen) return null;

  const currentCarrier =
    DEFAULT_CIT_CARRIERS.find((c) => c.id === carrierId) || DEFAULT_CIT_CARRIERS[0];

  const totalCash = atms.reduce((sum, a) => sum + (a.Refill_Suggestion_Amount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Stop_No',
      'ATMID',
      'Location',
      'Status',
      'Days_Left',
      'Authorized_Cash_Load_BDT',
      'Cassette_1_1000s_BDT',
      'Cassette_2_500s_BDT',
      'Cassette_3_200s_BDT',
      'Tamper_Seal_Number',
      'Carrier_Assigned',
    ];

    const rows = atms.map((a, idx) => {
      const load = a.Refill_Suggestion_Amount || 0;
      const c1000 = Math.round(load * 0.55);
      const c500 = Math.round(load * 0.30);
      const c200 = Math.round(load * 0.15);
      return [
        idx + 1,
        a.ATMID,
        `"${a.Location.replace(/"/g, '""')}"`,
        a.Status,
        Number(a.Days_of_Cash).toFixed(1),
        load,
        c1000,
        c500,
        c200,
        `SEAL-${currentCarrier.code}-${1000 + idx * 7}`,
        currentCarrier.name,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Official_Carrier_Manifest_${manifestOrderNum}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 my-auto">
        {/* Modal Controls Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                Official Armored Carrier Replenishment Order Form
              </h3>
              <p className="text-xs text-slate-400">
                Authorized Vault Handover & Armored Custody Transfer Document
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carrier Select Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-blue-600" /> Contracted CIT Vendor:
          </span>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CIT_CARRIERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCarrierId(c.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                  carrierId === c.id
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Document Printable Content */}
        <div className="p-8 space-y-6 text-slate-800 print:p-0 print:m-0 font-sans" id="printable-manifest">
          {/* Bank Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  BB
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900">
                  Bank Treasury & Cash Logistics Operations
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Central Cash Management Switch · Division of Currency Operations & Armored Logistics
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-900 text-sm">{manifestOrderNum}</div>
              <div className="text-slate-500">Issue Date: 2024-10-28</div>
              <div className="text-emerald-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentCarrier.armedGuardLevel}</span>
              </div>
            </div>
          </div>

          {/* Barcode & Security Verification Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Custody Chain Verification Code
              </span>
              <div className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                AUTH://VAULT-DHAKA/{currentCarrier.code}/{manifestOrderNum}
              </div>
            </div>

            {/* Simulated 1D Barcode Pattern */}
            <div className="flex flex-col items-center">
              <div className="flex items-end h-8 gap-[2px]">
                {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7, 9, 5].map(
                  (val, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${(val % 3) + 1}px`,
                        height: `${20 + (val % 8)}px`,
                        backgroundColor: '#0f172a',
                      }}
                    />
                  )
                )}
              </div>
              <span className="font-mono text-[9px] text-slate-500 mt-0.5 tracking-widest">
                *{manifestOrderNum}*
              </span>
            </div>
          </div>

          {/* High-level Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Authorized Stop Count</span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{atms.length} Terminals</div>
              <span className="text-[10px] text-slate-500">Max vehicle capacity: {currentCarrier.maxStops}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Vault Currency Handover</span>
              <div className="font-mono text-xl font-black text-emerald-700 mt-0.5">
                ৳{totalCash.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Insurance coverage limit: ৳{(currentCarrier.insuranceLimit / 1e6).toFixed(0)}M</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Contracted Carrier</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentCarrier.name}</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold">SLA Guarantee: {currentCarrier.slaAvailabilityPct}%</span>
            </div>
          </div>

          {/* Machine Stop Table with Cassette Denomination Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">Stop</th>
                  <th className="py-2.5 px-3">ATMID</th>
                  <th className="py-2.5 px-3">Terminal Location</th>
                  <th className="py-2.5 px-2 text-right">Cassette ৳1,000</th>
                  <th className="py-2.5 px-2 text-right">Cassette ৳500</th>
                  <th className="py-2.5 px-2 text-right">Cassette ৳200</th>
                  <th className="py-2.5 px-3 text-right">Total Order (BDT)</th>
                  <th className="py-2.5 px-3 text-center">Tamper Seal ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {atms.map((a, idx) => {
                  const load = a.Refill_Suggestion_Amount || 0;
                  const c1000 = Math.round(load * 0.55);
                  const c500 = Math.round(load * 0.30);
                  const c200 = Math.round(load * 0.15);
                  return (
                    <tr key={a.ATMID} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{a.ATMID}</td>
                      <td className="py-2 px-3 font-sans text-slate-600 truncate max-w-[180px]">
                        {a.Location.replace('(location not in dataset)', '').trim() ||
                          'Central Corridor Branch'}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 font-mono">
                        ৳{c1000.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 font-mono">
                        ৳{c500.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600 font-mono">
                        ৳{c200.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 font-mono">
                        ৳{load.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          SEAL-{currentCarrier.code}-{1000 + idx * 7}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                <tr>
                  <td colSpan={6} className="py-2 px-3 text-right text-slate-600 font-sans uppercase">
                    Grand Total Authorized Handover:
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-800 font-black">
                    ৳{totalCash.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Official Signatures and Custody Handover Certification */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Triple-Auth Chain of Custody Sign-Off Certification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  1. Central Vault Officer (Releaser)
                </span>
                <div className="h-12 border-b-2 border-slate-300 flex items-end pb-1 font-serif italic text-slate-600">
                  L. Messi, CTP #10
                </div>
                <div className="text-[10px] text-slate-400">Timestamp: 2024-10-28 08:30:00 UTC</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  2. Armored Truck Driver (Receiver)
                </span>
                <div className="h-12 border-b-2 border-slate-300 flex items-end pb-1 font-serif italic text-slate-600">
                  Romário, CDL-A #{currentCarrier.code}-11
                </div>
                <div className="text-[10px] text-slate-400">Carrier Vehicle: TRK-UNIT-04</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  3. Armed Security Escort (Guard)
                </span>
                <div className="h-12 border-b-2 border-slate-300 flex items-end pb-1 font-serif italic text-slate-600">
                  C. Ronaldo, Armed Guard #07
                </div>
                <div className="text-[10px] text-slate-400">Security Clearance Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
