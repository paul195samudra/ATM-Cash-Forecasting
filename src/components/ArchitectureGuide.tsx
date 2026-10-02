import React, { useState } from 'react';
import {
  Users,
  Workflow,
  ShieldAlert,
  Layers,
  Database,
  Calendar,
  Cpu,
  CheckCircle2,
  FileText,
  Truck,
  Settings,
  ShieldCheck,
  TrendingDown,
  Building,
  Scale
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const roles = [
    {
      title: 'Cash Operations Manager',
      role: 'Bank Ops & Liquidity Control',
      icon: <Building className="w-5 h-5 text-blue-600" />,
      tasks: [
        'Monitors network cash availability & cash-out risks',
        'Sets reserve buffers and safety stock policies',
        'Approves final CIT armored dispatch manifests daily',
        'Balances idle cash capital cost against cash-out penalties',
      ],
    },
    {
      title: 'CIT & Replenishment Team',
      role: 'Armored Carrier & Logistics',
      icon: <Truck className="w-5 h-5 text-emerald-600" />,
      tasks: [
        'Receives route manifests and cassette denomination orders',
        'Executes secure physical swap inside branch/offsite ATMs',
        'Reports physical vault discrepancies & mechanical faults',
        'Observes route SLA windows and security protocols',
      ],
    },
    {
      title: 'Data Scientist / Analyst',
      role: 'Model Performance & Research',
      icon: <Cpu className="w-5 h-5 text-indigo-600" />,
      tasks: [
        'Engineers calendar, lag, and behavioral feature pipelines',
        'Benchmarks XGBoost, SARIMA, Prophet against naive baselines',
        'Monitors prediction accuracy (MAE, RMSE, MAPE) across clusters',
        'Retrains models when behavioral demand distribution shifts',
      ],
    },
    {
      title: 'System Administrator',
      role: 'Platform & Data Integration',
      icon: <Settings className="w-5 h-5 text-slate-600" />,
      tasks: [
        'Connects core banking switches and transaction journals',
        'Orchestrates daily scheduled inference cron jobs',
        'Enforces role-based access control and audit logging',
        'Maintains uptime and resilience of forecasting services',
      ],
    },
  ];

  const workflowSteps = [
    {
      num: 1,
      phase: 'Phase 1: Data Preparation',
      title: 'Data Collection',
      desc: 'Ingests transaction journals, individual withdrawal amounts, customer deposit records, machine event logs, and historical CIT refill stamps across all 256 network terminals.',
      inputs: 'Core banking transaction logs, ATM journal feeds, CIT manifest histories',
      outputs: 'Normalized transactional time-series repository',
    },
    {
      num: 2,
      phase: 'Phase 1: Data Preparation',
      title: 'Data Preprocessing & Calendar Tagging',
      desc: 'Cleans missing values, aligns daily time intervals, and tags local public holidays, religious festivals, school vacation calendars, and bi-monthly public/private sector payday windows.',
      inputs: 'Raw transaction records + National holiday & banking calendars',
      outputs: 'Uniform daily time series with calendar markers',
    },
    {
      num: 3,
      phase: 'Phase 1: Data Preparation',
      title: 'Chronological Train / Validation / Test Splitting',
      desc: 'Strict chronological time-based cutoffs prevent future lookahead leakage. Models train on preceding months and are validated against succeeding out-of-time evaluation periods.',
      inputs: 'Preprocessed time series data',
      outputs: 'Train, Validation, and Holdout Test partitions',
    },
    {
      num: 4,
      phase: 'Phase 2: Modelling',
      title: 'Multi-Perspective Feature Engineering',
      desc: 'Constructs six feature categories: transaction history (lags 1, 3, 7), calendar cycles (day of week, month-end), machine behavioural statistics (rolling volatility, average ticket size), location type, and days since last cash reload.',
      inputs: 'Split datasets and location metadata',
      outputs: 'High-dimensional feature matrix with 42 engineered predictors',
    },
    {
      num: 5,
      phase: 'Phase 2: Modelling',
      title: 'Model Training & Hyperparameter Tuning',
      desc: 'Compares seasonal-naive heuristics with SARIMA, Prophet, and gradient boosted tree regressors (XGBoost). Employs Bayesian optimization for tree depth, learning rate, and regularisation parameters.',
      inputs: 'Engineered training feature sets',
      outputs: 'Calibrated machine-level demand forecasting models',
    },
    {
      num: 6,
      phase: 'Phase 3: Evaluation & Decision Output',
      title: 'Cost-Weighted Model Evaluation',
      desc: 'Standard statistical metrics (MAE, RMSE, MAPE) are paired with asymmetric cost-weighted loss: under-predicting (causing a cash-out) is penalized 3.5× higher than over-predicting (holding surplus cash).',
      inputs: 'Holdout test predictions vs actual cash withdrawals',
      outputs: 'Asymmetric loss evaluation and performance scorecard',
    },
    {
      num: 7,
      phase: 'Phase 3: Evaluation & Decision Output',
      title: 'Decision Support & Action Generation',
      desc: 'Converts raw demand numbers into actionable operational plans: assigns refill urgency status (Refill Now, Refill Soon, OK), recommends exact replenishment amounts rounded to cassette denominations, and plans CIT routes.',
      inputs: 'Next-day demand forecast + current machine balance',
      outputs: 'Actionable refill schedule, truck route manifests, priority flags',
    },
  ];

  const constraints = [
    {
      category: 'Physical Constraints',
      items: [
        'Vehicle capacity limit ($10M - $25M per armored truck)',
        'Maximum stops per CIT shift (limited by 8-hour workday SLA)',
        'Cassette physical vault capacity and denomination limits ($20, $50, $100 notes)',
      ],
    },
    {
      category: 'Financial Constraints',
      items: [
        'Fixed CIT delivery stop cost ($350 - $500 per visit)',
        'Cost of holding idle cash (cost of capital / interest rate ~5.5% p.a.)',
        'Severe customer dissatisfaction and lost interchange fees upon cash-out',
      ],
    },
    {
      category: 'Logical & Routing Constraints',
      items: [
        'Geographic clustering of nearby low-cash ATMs to reduce travel deadheading',
        'Avoid replenishing during peak commuting or shopping hours',
        'Minimum refill threshold to avoid inefficient micro-refills',
      ],
    },
    {
      category: 'Regulatory & Security Constraints',
      items: [
        'National central bank vault cash holding caps for branch security',
        'Insurance policy maximums per physical machine location',
        'Mandatory dual-custody audit logs for all cassette swaps',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
            <Workflow className="w-3.5 h-3.5" /> End-to-End System Blueprint
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            System Architecture, Roles & The 7-Step Decision Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            From raw transaction ingest to armored vehicle delivery schedules. This architecture
            operationalizes machine learning into high-reliability bank cash logistics.
          </p>
        </div>
      </div>

      {/* 4 Roles Section */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <Users className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Four Core Organizational Roles & Access Boundaries
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((r, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                    {r.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs leading-snug">{r.title}</h4>
                    <span className="text-[10px] text-slate-500">{r.role}</span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-[11px] text-slate-600 mt-3">
                  {r.tasks.map((task, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Step Pipeline Interactive Stepper */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              The 7-Step Cash Forecasting & Replenishment Pipeline
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any step below for detailed specs</span>
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {workflowSteps.map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                activeStep === s.num
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase mb-0.5 ${
                  activeStep === s.num ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                Step 0{s.num}
              </div>
              <div className="text-xs font-bold truncate">{s.title}</div>
            </button>
          ))}
        </div>

        {/* Active Step Details */}
        {(() => {
          const cur = workflowSteps.find((s) => s.num === activeStep) || workflowSteps[0];
          return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  {cur.phase}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  Step 0{cur.num} of 07
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">{cur.title}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">{cur.desc}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Input Artifacts
                  </div>
                  <div className="font-medium text-slate-800 mt-1">{cur.inputs}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Output Deliverables
                  </div>
                  <div className="font-medium text-emerald-800 font-semibold mt-1">
                    {cur.outputs}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Operational Constraints Matrix */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <Scale className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Decision Layer Constraints Matrix
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          A raw demand forecast number must pass through real-world operational gates before becoming
          an approved replenishment order.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {constraints.map((c, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-xs pb-2 border-b border-slate-200 mb-2.5">
                {c.category}
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {c.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
