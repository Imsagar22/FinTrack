/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

// --- Types for Custom Charts ---
interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  totalLabel?: string;
}

export function DonutChart({ data, totalLabel = 'Total spent' }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // If there's no data, render an empty state
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        <svg className="w-16 h-16 mb-2 stroke-current opacity-40" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className="text-sm font-medium">No transactions recorded</span>
      </div>
    );
  }

  // Calculate angles for pie slices
  let accumulatedAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle = endAngle;

    return {
      ...item,
      startAngle,
      endAngle,
      percentage,
      index,
    };
  });

  // Helper to generate SVG arc path
  const getCoordinatesForPercent = (percent: number) => {
    // Offset by -90 degrees so slices start at 12 o'clock
    const angleInRadians = (percent * 360 - 90) * (Math.PI / 180);
    return {
      x: 100 + 80 * Math.cos(angleInRadians),
      y: 100 + 80 * Math.sin(angleInRadians),
    };
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
      {/* Chart SVG */}
      <div className="relative w-48 h-48 sm:w-52 sm:h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full select-none">
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            const radius = isHovered ? 84 : 80;

            // Generate Path d-attribute
            const startAngleInRadians = (slice.startAngle - 90) * (Math.PI / 180);
            const endAngleInRadians = (slice.endAngle - 90) * (Math.PI / 180);

            const startX = 100 + radius * Math.cos(startAngleInRadians);
            const startY = 100 + radius * Math.sin(startAngleInRadians);
            const endX = 100 + radius * Math.cos(endAngleInRadians);
            const endY = 100 + radius * Math.sin(endAngleInRadians);

            const largeArcFlag = slice.percentage > 0.5 ? 1 : 0;

            const pathData = slice.percentage >= 0.999
              ? `M 100 100 m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`
              : `M 100 100 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

            return (
              <path
                key={slice.label}
                d={pathData}
                fill={slice.color}
                className="transition-all duration-300 cursor-pointer origin-center"
                style={{
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' : 'none',
                }}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {/* Core Mask to convert Pie to Donut */}
          <circle
            cx="100"
            cy="100"
            r="54"
            className="fill-white dark:fill-slate-900 transition-colors duration-300"
          />
        </svg>

        {/* Floating details inside the donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {hoveredIndex !== null ? slices[hoveredIndex].label : totalLabel}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 transition-all duration-150">
            ₹
            {(hoveredIndex !== null ? slices[hoveredIndex].value : total).toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {hoveredIndex !== null
              ? `${(slices[hoveredIndex].percentage * 100).toFixed(1)}%`
              : '100%'}
          </span>
        </div>
      </div>

      {/* Custom Dynamic Legend */}
      <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-sm sm:max-w-none">
        {slices.map((slice) => {
          const isHovered = hoveredIndex === slice.index;
          return (
            <div
              key={slice.label}
              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all duration-200 ${
                isHovered
                  ? 'bg-slate-50 dark:bg-slate-800/60 translate-x-1'
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="w-3.5 h-3.5 rounded-md shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: slice.color,
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {slice.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                  ₹{slice.value.toLocaleString('en-IN')} ({Math.round(slice.percentage * 100)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Trend Chart Props ---
interface TrendData {
  month: string;
  income: number;
  expense: number;
  investment: number;
}

interface TrendChartProps {
  data: TrendData[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.income, d.expense, d.investment, 1000])
  );
  // Give some vertical ceiling headroom
  const ceiling = Math.ceil(maxVal * 1.15);

  const chartHeight = 180;
  const paddingBottom = 25;
  const paddingTop = 15;
  const effectiveHeight = chartHeight - paddingTop - paddingBottom;

  const getBarHeight = (value: number) => {
    return (value / ceiling) * effectiveHeight;
  };

  return (
    <div className="w-full">
      {/* Main Bar Chart Panel */}
      <div className="relative h-64 flex items-end gap-1 px-1 sm:px-4 border-b border-slate-100 dark:border-slate-800 pb-2">
        {/* Y-Axis Guidelines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono pr-2">
          <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full pt-1">
            ₹{ceiling.toLocaleString('en-IN')}
          </div>
          <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full pt-1">
            ₹{Math.round(ceiling * 0.66).toLocaleString('en-IN')}
          </div>
          <div className="border-t border-dashed border-slate-100 dark:border-slate-800 w-full pt-1">
            ₹{Math.round(ceiling * 0.33).toLocaleString('en-IN')}
          </div>
          <div className="w-full h-0" />
        </div>

        {/* Dynamic Bars for each Month */}
        <div className="flex-1 h-full flex justify-around items-end z-10">
          {data.map((item, idx) => {
            const incH = getBarHeight(item.income);
            const expH = getBarHeight(item.expense);
            const invH = getBarHeight(item.investment);

            const isActive = activeIdx === idx;

            return (
              <div
                key={item.month}
                className="flex flex-col items-center flex-1 h-full justify-end relative group cursor-pointer"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                {/* Visual Tooltip Overlay */}
                {isActive && (
                  <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[150px] z-50 flex flex-col gap-1 backdrop-blur-sm">
                    <span className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-300">
                      {item.month}
                    </span>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Income:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{item.income.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Expense:</span>
                      <span className="font-mono font-bold text-rose-400">
                        ₹{item.expense.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Invested:</span>
                      <span className="font-mono font-bold text-indigo-400">
                        ₹{item.investment.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-slate-800 pt-1 mt-1 font-semibold text-[11px]">
                      <span className="text-slate-300">Savings:</span>
                      <span className="font-mono text-cyan-400">
                        ₹{(item.income - item.expense - item.investment).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bars side-by-side or stacked container */}
                <div className="flex items-end gap-1.5 sm:gap-2.5 h-full w-full justify-center pb-1">
                  {/* Income Column */}
                  <div className="relative flex flex-col justify-end h-full w-4 sm:w-5 group-hover:opacity-100">
                    <div
                      className="rounded-t-md bg-emerald-500 hover:bg-emerald-400 transition-all duration-300 relative shadow-sm"
                      style={{ height: `${Math.max(incH, 4)}px` }}
                    />
                  </div>

                  {/* Expense Column */}
                  <div className="relative flex flex-col justify-end h-full w-4 sm:w-5">
                    <div
                      className="rounded-t-md bg-rose-500 hover:bg-rose-400 transition-all duration-300 relative shadow-sm"
                      style={{ height: `${Math.max(expH, 4)}px` }}
                    />
                  </div>

                  {/* Investment Column */}
                  <div className="relative flex flex-col justify-end h-full w-4 sm:w-5">
                    <div
                      className="rounded-t-md bg-indigo-500 hover:bg-indigo-400 transition-all duration-300 relative shadow-sm"
                      style={{ height: `${Math.max(invH, 4)}px` }}
                    />
                  </div>
                </div>

                {/* X-Axis Label */}
                <span className={`text-[11px] font-semibold transition-colors duration-200 mt-1 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Indicator Panel */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500 shrink-0" />
          <span>Expense</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-500 shrink-0" />
          <span>Investment</span>
        </div>
      </div>
    </div>
  );
}

// --- Wealth Ratio Bar Props ---
interface WealthRatioProps {
  income: number;
  expense: number;
  investment: number;
}

export function WealthRatioBar({ income, expense, investment }: WealthRatioProps) {
  const remaining = Math.max(0, income - expense - investment);
  const totalAllocated = expense + investment + remaining;

  if (totalAllocated === 0) {
    return (
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
    );
  }

  const expensePct = (expense / totalAllocated) * 100;
  const investmentPct = (investment / totalAllocated) * 100;
  const savingsPct = (remaining / totalAllocated) * 100;

  return (
    <div className="space-y-3.5">
      {/* Compound Ratio Bar */}
      <div className="relative w-full h-5 rounded-full overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800">
        {expensePct > 0 && (
          <div
            className="h-full bg-rose-500 transition-all duration-500 hover:brightness-105"
            style={{ width: `${expensePct}%` }}
            title={`Expenses: ${expensePct.toFixed(1)}%`}
          />
        )}
        {investmentPct > 0 && (
          <div
            className="h-full bg-indigo-500 transition-all duration-500 hover:brightness-105"
            style={{ width: `${investmentPct}%` }}
            title={`Investments: ${investmentPct.toFixed(1)}%`}
          />
        )}
        {savingsPct > 0 && (
          <div
            className="h-full bg-cyan-500 transition-all duration-500 hover:brightness-105"
            style={{ width: `${savingsPct}%` }}
            title={`Net Cash Savings: ${savingsPct.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Legends and Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Living Cost Card */}
        <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-3 border border-slate-100/80 dark:border-slate-800/40">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Living Costs
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {expensePct.toFixed(1)}%
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              (₹{expense.toLocaleString('en-IN')})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Expenses, bills, and lifestyle outlays.
          </p>
        </div>

        {/* Wealth Builder Card */}
        <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-3 border border-slate-100/80 dark:border-slate-800/40">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Wealth Building
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {investmentPct.toFixed(1)}%
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              (₹{investment.toLocaleString('en-IN')})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Stocks, Mutual Funds, and active wealth-generating assets.
          </p>
        </div>

        {/* Liquid Savings Card */}
        <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-3 border border-slate-100/80 dark:border-slate-800/40">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cash Savings
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {savingsPct.toFixed(1)}%
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              (₹{remaining.toLocaleString('en-IN')})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Free cash retained in bank accounts or liquid reserves.
          </p>
        </div>
      </div>
    </div>
  );
}
