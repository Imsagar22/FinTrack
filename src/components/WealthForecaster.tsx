/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

interface WealthForecasterProps {
  currentMonthlyInvestment: number;
}

export default function WealthForecaster({ currentMonthlyInvestment }: WealthForecasterProps) {
  const [monthlyContribution, setMonthlyContribution] = useState<number>(
    currentMonthlyInvestment > 0 ? Math.round(currentMonthlyInvestment) : 500
  );
  const [annualReturn, setAnnualReturn] = useState<number>(10); // Default 10%
  const [years, setYears] = useState<number>(15); // Default 15 years

  // Calculate compound interest
  // PMT * [((1 + r/12)^n - 1) / (r/12)]
  const r = annualReturn / 100;
  const n = years * 12;
  const monthlyRate = r / 12;

  let futureValue = 0;
  if (monthlyRate > 0) {
    futureValue = monthlyContribution * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
  } else {
    futureValue = monthlyContribution * n;
  }

  const totalInvested = monthlyContribution * n;
  const compoundReturns = Math.max(0, futureValue - totalInvested);

  const investedPct = futureValue > 0 ? (totalInvested / futureValue) * 100 : 100;
  const returnsPct = futureValue > 0 ? (compoundReturns / futureValue) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Wealth Compound Visualizer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            See the future growth potential of your current active investments
          </p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
          Powered by Compound Interest 
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sliders Control Panel */}
        <div className="space-y-6">
          {/* Slider 1: Monthly contribution */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Monthly Contribution
              </label>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                ₹{monthlyContribution.toLocaleString('en-IN')}/mo
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(parseInt(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹10</span>
              <span>₹2,500</span>
              <span>₹5,000</span>
            </div>
          </div>

          {/* Slider 2: Rate of return */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Expected Annual Return
              </label>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {annualReturn}% p.a.
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1% (Conservative)</span>
              <span>10% (Index Avg)</span>
              <span>20% (Aggressive)</span>
            </div>
          </div>

          {/* Slider 3: Time Horizon */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Investment Period
              </label>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {years} Years
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value) || 0)}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Year</span>
              <span>20 Years</span>
              <span>40 Years</span>
            </div>
          </div>
        </div>

        {/* Compound Visual Output Block */}
        <div className="flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-5 border border-slate-100/60 dark:border-slate-800/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Estimated Portfolio Value
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              ₹{Math.round(futureValue).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Horizontal percentage stack bar */}
          <div className="my-5 space-y-1.5">
            <div className="relative h-3 rounded-full flex overflow-hidden bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-slate-400 dark:bg-slate-500 transition-all duration-300"
                style={{ width: `${investedPct}%` }}
              />
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${returnsPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Invested Principal</span>
              <span>Compound Interest</span>
            </div>
          </div>

          {/* Legend and numeric values */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-dashed border-slate-200/80 dark:border-slate-800/80 mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Invested
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                ₹{totalInvested.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Profit
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                +₹{Math.round(compoundReturns).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Dynamic Insight Sentence */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            💡 At this rate, your money will grow to{' '}
            <span className="text-slate-700 dark:text-slate-300 font-bold font-mono">
              {Math.round(futureValue / totalInvested * 10) / 10}x
            </span>{' '}
            your total principal. Out of the{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              ₹{Math.round(futureValue).toLocaleString('en-IN')}
            </span>
            ,{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
              {returnsPct.toFixed(0)}%
            </span>{' '}
            is generated purely by compound returns!
          </p>
        </div>
      </div>
    </div>
  );
}
