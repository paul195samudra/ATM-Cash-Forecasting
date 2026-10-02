import React from 'react';
import { ATMRecord } from '../data/atmData';
import {
  FileCheck,
  Printer,
  Download,
  X,
  Building,
  ShieldCheck,
  Lock,
  Truck
} from 'lucide-react';

interface FormalManifestModalProps {
  atms: ATMRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const FormalManifestModal: React.FC<FormalManifestModalProps> = ({
  atms,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const totalCash = atms.reduce((sum, a) => sum + a.Refill_Suggestion_Amount, 0);

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
      'Authorized_Cash_Load',
      'Tamper_Seal_Number',
    ];

    const rows = atms.map((a, idx) => [
      idx + 1,
      a.ATMID,
      `"${a.Location.replace(/"/g, '""')}"`,
      a.Status,
      a.Days_of_Cash,
      a.Refill_Suggestion_Amount,
      `SEAL-DHA-${1000 + idx}`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Official_Carrier_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <FileCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Official Armored Carrier Replenishment Order Form
              </h3>
              <p className="text-xs text-slate-500">
                Authorized Vault Handover & Armored Custody Transfer Document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Content */}
        <div className="p-8 space-y-6 text-slate-800">
          {/* Bank Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase text-slate-900">
                Bank Treasury & Cash Logistics Operations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Central Cash Management Switch · Division of Currency Operations
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-900">ORDER: #CIT-20241028-0914</div>
              <div className="text-slate-500">Issue Date: 2024-10-28</div>
              <div className="text-slate-500">Security Clearance: LEVEL 3</div>
            </div>
          </div>

          {/* High-level Summary Grid */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Authorized Fleet Stops</span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">{atms.length} ATMs</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Total Authorized Currency</span>
              <div className="font-mono text-xl font-black text-emerald-700 mt-0.5">
                ${totalCash.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold">Carrier Assigned</span>
              <div className="font-semibold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Brinks / G4S Armored CIT</span>
              </div>
            </div>
          </div>

          {/* Machine Stop Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-center w-12">#</th>
                  <th className="py-2 px-3">ATMID</th>
                  <th className="py-2 px-3">Terminal Location</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Authorized Load</th>
                  <th className="py-2 px-3 text-right">Security Bag Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {atms.map((a, idx) => (
                  <tr key={a.ATMID} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center font-sans text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{a.ATMID}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 max-w-[240px] truncate">
                      {a.Location.replace('(location not in dataset)', '').trim() ||
                        'Central Regional Hub'}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.Status === 'Refill Now'
                            ? 'bg-red-100 text-red-700'
                            : a.Status === 'Refill Soon'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {a.Status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      ${Math.round(a.Refill_Suggestion_Amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      #SEAL-DHA-{1000 + idx}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tri-Custody Signatures */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tri-Party Dual-Custody Verification & Audit Sign-Off</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  1. Central Vault Manager
                </span>
                <div className="h-10 border-b border-slate-300 mb-1 flex items-end">
                  <span className="text-[10px] text-slate-400 italic">Signature</span>
                </div>
                <div className="text-[10px] text-slate-500">Officer: M. Rahman · Badge #4402</div>
              </div>

              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  2. Cash Operations Controller
                </span>
                <div className="h-10 border-b border-slate-300 mb-1 flex items-end">
                  <span className="text-[10px] text-slate-400 italic">Approval Seal</span>
                </div>
                <div className="text-[10px] text-slate-500">Officer: K. Ahmed · Badge #1195</div>
              </div>

              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  3. Armored CIT Guard Commander
                </span>
                <div className="h-10 border-b border-slate-300 mb-1 flex items-end">
                  <span className="text-[10px] text-slate-400 italic">Received in Good Order</span>
                </div>
                <div className="text-[10px] text-slate-500">Security Lead: S. Paul · License #8821</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total Authorized Amount:{' '}
            <strong className="font-mono text-slate-900">${totalCash.toLocaleString()}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
