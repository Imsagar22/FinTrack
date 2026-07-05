/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CategoryBudget } from '../types';

interface BudgetMonitorProps {
  budgets: CategoryBudget[];
  onUpdateBudget: (category: string, limit: number) => void;
  categorySpending: Record<string, number>;
}

export default function BudgetMonitor({ budgets, onUpdateBudget, categorySpending }: BudgetMonitorProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<string>('');

  const handleStartEdit = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveEdit = (cat: string) => {
    const numericLimit = parseFloat(tempLimit);
    if (!isNaN(numericLimit) && numericLimit >= 0) {
      onUpdateBudget(cat, numericLimit);
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((item) => {
          const spent = categorySpending[item.category] || 0;
          const percentage = item.limit > 0 ? (spent / item.limit) * 100 : 0;
          const isOver = spent > item.limit;
          const isWarning = !isOver && percentage >= 80;

          // Color calculation for progress bars
          let progressBg = 'bg-emerald-500';
          let borderStyle = 'border-slate-100 dark:border-slate-800/80';
          let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40';

          if (isOver) {
            progressBg = 'bg-rose-500 animate-pulse';
            borderStyle = 'border-rose-200 dark:border-rose-900/40 shadow-rose-50/50 dark:shadow-none';
            badgeBg = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40';
          } else if (isWarning) {
            progressBg = 'bg-amber-500';
            borderStyle = 'border-amber-200 dark:border-amber-900/40';
            badgeBg = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40';
          }

          return (
            <div
              key={item.category}
              className={`bg-white dark:bg-slate-900 border ${borderStyle} rounded-2xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden group hover:shadow-md`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.category}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Monthly expense cap
                  </p>
                </div>

                {/* Edit & Indicator badges */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {isOver ? 'Limit Exceeded' : isWarning ? 'Approaching Limit' : 'Within Budget'}
                  </span>
                </div>
              </div>

              {/* Numerical status breakdown */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                    ₹{spent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    spent
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-slate-400">of</span>
                  {editingCategory === item.category ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={tempLimit}
                        onChange={(e) => setTempLimit(e.target.value)}
                        className="w-16 px-1.5 py-0.5 font-mono text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item.category);
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(item.category)}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        ₹{item.limit.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleStartEdit(item.category, item.limit)}
                        className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full ${progressBg} transition-all duration-500`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>

              {/* Percentage breakdown details */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span>{percentage.toFixed(0)}% utilized</span>
                <span>
                  {isOver
                    ? `₹${Math.round(spent - item.limit).toLocaleString('en-IN')} over budget`
                    : `₹${Math.round(item.limit - spent).toLocaleString('en-IN')} remaining`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
