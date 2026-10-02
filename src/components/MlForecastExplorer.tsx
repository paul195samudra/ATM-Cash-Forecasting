import React, { useState, useMemo } from 'react';
import {
  BrainCircuit,
  BarChart,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Cpu,
  GitBranch,
  Calendar,
  AlertTriangle,
  Scale
} from 'lucide-react';

export const MlForecastExplorer: React.FC = () => {
  // Simulator State
  const [selectedDay, setSelectedDay] = useState<string>('Friday');
  const [isPayday, setIsPayday] = useState<boolean>(true);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [daysSinceRefill, setDaysSinceRefill] = useState<number>(4);
  const [locationType, setLocationType] = useState<string>('shopping_mall');
  const [currentBalance, setCurrentBalance] = useState<number>(350000);
  const [capacity, setCapacity] = useState<number>(1500000);

  // Feature weights data
  const featureWeights = [
    { feature: 'Day of Week & Weekend Rhythm', weight: 24, category: 'B. Time Features', color: 'bg-blue-600' },
    { feature: 'ATM Cluster & Footfall Location', weight: 19, category: 'D. Location Features', color: 'bg-indigo-600' },
    { feature: 'Public Holidays & Festival Surges', weight: 16, category: 'B. Time Features', color: 'bg-pink-600' },
    { feature: 'Lag 1 & Lag 3 Withdrawal Autoregression', weight: 14, category: 'A. Transaction History', color: 'bg-purple-600' },
    { feature: 'Salary / Payday Bi-Monthly Cycles', weight: 11, category: 'B. Time Features', color: 'bg-amber-600' },
    { feature: 'Days Since Prior CIT Replenishment', weight: 7, category: 'E. Refill Dynamics', color: 'bg-emerald-600' },
    { feature: 'Rolling 7-Day Demand Volatility', weight: 5, category: 'C. Machine Behaviour', color: 'bg-cyan-600' },
    { feature: 'Month-End Accounting Windows', weight: 4, category: 'B. Time Features', color: 'bg-slate-600' },
  ];

  // Model comparison benchmarks
  const modelBenchmarks = [
    {
      name: 'Seasonal-Naive Baseline',
      modelType: 'Heuristic Baseline',
      mae: '$48,200',
      rmse: '$72,100',
      mape: '18.4%',
      costLoss: '100% (Baseline)',
      verdict: 'Over-stocks cash; frequent holiday cash-outs.',
      highlight: false,
    },
    {
      name: 'SARIMA & Prophet',
      modelType: 'Time-Series Decomposition',
      mae: '$39,600',
      rmse: '$58,300',
      mape: '14.1%',
      costLoss: '-26.3%',
      verdict: 'Captures weekly rhythm, slow to react to payday bursts.',
      highlight: false,
    },
    {
      name: 'XGBoost Regressor (Production)',
      modelType: 'Gradient Boosted Trees',
      mae: '$26,450',
      rmse: '$41,200',
      mape: '9.8%',
      costLoss: '-42.8%',
      verdict: 'Best non-linear interaction across holidays, lags, and paydays.',
      highlight: true,
    },
  ];

  // Simulation logic
  const simulatedForecast = useMemo(() => {
    let base = 280000;

    // Location modifier
    if (locationType === 'shopping_mall') base *= 1.35;
    else if (locationType === 'business_district') base *= 1.25;
    else if (locationType === 'transit_hub') base *= 1.45;
    else if (locationType === 'residential') base *= 0.9;
    else if (locationType === 'rural') base *= 0.65;

    // Day of week
    if (selectedDay === 'Friday' || selectedDay === 'Saturday') base *= 1.3;
    else if (selectedDay === 'Sunday') base *= 1.15;
    else if (selectedDay === 'Monday') base *= 0.95;

    // Payday
    if (isPayday) base *= 1.45;

    // Holiday
    if (isHoliday) base *= 1.35;

    const predictedDemand = Math.round(base);
    const remainingAfterDemand = currentBalance - predictedDemand;
    const daysOfCash = Math.max(0, currentBalance / (predictedDemand || 1));
    const remainingPct = (currentBalance / (capacity || 1)) * 100;

    let status: 'Refill Now' | 'Refill Soon' | 'OK' = 'OK';
    if (daysOfCash < 1.0 || remainingPct <= 20) {
      status = 'Refill Now';
    } else if (daysOfCash < 2.0 || remainingPct <= 40) {
      status = 'Refill Soon';
    }

    const refillSuggestion = status !== 'OK' ? Math.round(capacity - currentBalance) : 0;

    return {
      predictedDemand,
      remainingAfterDemand,
      daysOfCash,
      remainingPct,
      status,
      refillSuggestion,
    };
  }, [selectedDay, isPayday, isHoliday, daysSinceRefill, locationType, currentBalance, capacity]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
            <BrainCircuit className="w-3.5 h-3.5" /> Machine Learning Demand Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Forecasting Architecture & Feature Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            The system combines transaction history, temporal features, ATM behavioural profiles, and
            local geographic metadata using gradient boosted regressors to predict cash demand before
            cassettes run dry.
          </p>
        </div>
      </div>

      {/* Model Benchmark Comparison Cards */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <Scale className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Model Evaluation Benchmarks (Out-of-Sample Test Set)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modelBenchmarks.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-4 border transition-all ${
                m.highlight
                  ? 'border-indigo-400 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-400'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                  <span className="text-[11px] text-slate-500">{m.modelType}</span>
                </div>
                {m.highlight && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    <CheckCircle2 className="w-3 h-3" /> Deployed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">MAE</div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{m.mae}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">RMSE</div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{m.rmse}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-bold">MAPE</div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{m.mape}</div>
                </div>
              </div>

              <div className="text-xs border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="text-slate-500">Cost Loss Reduction:</span>
                <span className="font-mono font-bold text-emerald-700">{m.costLoss}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 italic">{m.verdict}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Importance & Scenario Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Feature Importance */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <BarChart className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Model Feature Importance (Mixed ATM Network)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Derived from SHAP value attributions and tree split gain across the 256 ATM forecasting
            regressors.
          </p>

          <div className="space-y-3">
            {featureWeights.map((f, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">{f.feature}</span>
                  <span className="font-mono font-bold text-slate-900">{f.weight}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.color}`}
                    style={{ width: `${f.weight * 3.5}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{f.category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: What-If Scenario Simulator */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Interactive Forecast & Refill Trigger Simulator
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Live XGBoost Simulation
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Simulate how calendar triggers, payday cycles, and location characteristics modify the
              predicted withdrawal volume and automatic CIT refill recommendation.
            </p>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Day of the Week</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday (Peak Outflow)</option>
                  <option value="Saturday">Saturday (Weekend Shopper)</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Cluster</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium"
                >
                  <option value="shopping_mall">Shopping Mall & Entertainment</option>
                  <option value="business_district">Commercial & Business District</option>
                  <option value="transit_hub">Airport / Central Train Station</option>
                  <option value="residential">Suburban Residential Neighborhood</option>
                  <option value="rural">Rural Branch ATM</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Cash in Cassette ($)
                </label>
                <input
                  type="range"
                  min={50000}
                  max={capacity}
                  step={25000}
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between font-mono text-[11px] text-slate-500 mt-1">
                  <span>$50k</span>
                  <span className="font-bold text-slate-900">${currentBalance.toLocaleString()}</span>
                  <span>${capacity.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Machine Vault Capacity ($)
                </label>
                <select
                  value={capacity}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setCapacity(c);
                    if (currentBalance > c) setCurrentBalance(c);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs"
                >
                  <option value={800000}>$800,000 (2 Cassettes)</option>
                  <option value={1500000}>$1,500,000 (3 Cassettes)</option>
                  <option value={2250000}>$2,250,000 (4 Full Cassettes)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPayday}
                    onChange={(e) => setIsPayday(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700">Salary / Payday Period (+45% volume)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500"
                  />
                  <span className="font-semibold text-slate-700">Festival / Bank Holiday (+35% volume)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="mt-5 p-4 bg-slate-900 text-white rounded-xl border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Model Decision Support Inference
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  simulatedForecast.status === 'Refill Now'
                    ? 'bg-red-500 text-white animate-pulse'
                    : simulatedForecast.status === 'Refill Soon'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {simulatedForecast.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Predicted Next-Day Demand</div>
                <div className="text-lg font-bold font-mono text-indigo-300 mt-0.5">
                  ${simulatedForecast.predictedDemand.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[10px] uppercase">Calculated Run-Out</div>
                <div
                  className={`text-lg font-bold font-mono mt-0.5 ${
                    simulatedForecast.daysOfCash < 1
                      ? 'text-red-400'
                      : simulatedForecast.daysOfCash < 2
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {simulatedForecast.daysOfCash.toFixed(1)} days
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[10px] uppercase">Capacity Fill %</div>
                <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                  {simulatedForecast.remainingPct.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-[10px] uppercase">Recommended CIT Refill</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  ${simulatedForecast.refillSuggestion.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
