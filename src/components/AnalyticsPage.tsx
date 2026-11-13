import React, { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import type {
  CategoryBreakdownItem,
  CategoryBudgetMap,
  DailyTrendPoint,
  ExpenseCategory,
  StateLogEntry,
} from '../types/expense';
import { formatCurrency } from '../logic/expenseRules';

interface AnalyticsPageProps {
  breakdown: CategoryBreakdownItem[];
  budgets: CategoryBudgetMap;
  dailyTrend: DailyTrendPoint[];
  actionLog: StateLogEntry[];
  onUpdateBudget: (category: ExpenseCategory, limit: number) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  breakdown,
  budgets,
  dailyTrend,
  actionLog,
  onUpdateBudget,
}) => {
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [draftLimit, setDraftLimit] = useState<string>('');
  const [limitError, setLimitError] = useState<string>('');

  const maxDailyTotal = Math.max(1, ...dailyTrend.map((d) => d.total));

  const startEditing = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setDraftLimit(String(budgets[category] ?? 0));
    setLimitError('');
  };

  const commitBudget = (category: ExpenseCategory) => {
    const parsed = Number(draftLimit);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000) {
      setLimitError('Enter a budget cap between 0 and 100,000.');
      return;
    }
    onUpdateBudget(category, parsed);
    setEditingCategory(null);
    setLimitError('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category Breakdown & Editable Caps */}
        <section
          aria-label="Category budgets and utilization"
          className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Category Totals & Budget Rules
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Derived via pure selector rules. Adjust monthly caps to evaluate threshold states.
            </p>
          </div>

          <ul className="mt-4 divide-y divide-slate-100">
            {breakdown.map((row) => {
              const barWidth = Math.min(100, Math.max(0, row.budgetUtilizationPct));
              const isEditing = editingCategory === row.category;

              return (
                <li key={row.category} className="py-4 first:pt-1 last:pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.category}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {row.count} {row.count === 1 ? 'record' : 'records'} · {row.sharePct}% of spend
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                          {formatCurrency(row.spent)}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-slate-500">
                          of {formatCurrency(row.budget)} cap
                        </p>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => startEditing(row.category)}
                          aria-label={`Edit ${row.category} budget cap`}
                          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          Edit Cap
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label htmlFor={`cap-${row.category}`} className="sr-only">
                            {row.category} monthly budget cap
                          </label>
                          <input
                            id={`cap-${row.category}`}
                            type="number"
                            min="0"
                            step="10"
                            value={draftLimit}
                            onChange={(e) => setDraftLimit(e.target.value)}
                            className="min-h-[40px] w-24 rounded-lg border border-indigo-700 px-2.5 font-mono text-xs tabular-nums text-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => commitBudget(row.category)}
                            aria-label={`Save ${row.category} budget cap`}
                            className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-indigo-700 px-3 text-xs font-medium text-white hover:bg-indigo-800"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && limitError && (
                    <p className="mt-1.5 text-xs font-medium text-rose-700" role="alert">
                      {limitError}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          row.overBudget ? 'bg-rose-600' : 'bg-indigo-700'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs font-medium tabular-nums ${
                        row.overBudget ? 'text-rose-700' : 'text-slate-600'
                      }`}
                    >
                      {row.overBudget && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      {row.budgetUtilizationPct}%{row.overBudget ? ' Over' : ''}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Daily Spending Trend SVG Chart */}
        <section
          aria-label="Daily spending trend"
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Daily Cashflow Distribution</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Aggregated by ISO date across active ledger entries.
            </p>
          </div>

          {dailyTrend.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No dated transactions available to plot.
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                <span>Daily Peak: {formatCurrency(maxDailyTotal)}</span>
                <span>{dailyTrend.length} active dates</span>
              </div>
              <svg
                viewBox="0 0 420 200"
                role="img"
                aria-label="Bar chart of daily expense totals"
                className="h-52 w-full"
              >
                <line x1="0" y1="24" x2="420" y2="24" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="96" x2="420" y2="96" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="168" x2="420" y2="168" stroke="#e2e8f0" strokeWidth="1" />
                {dailyTrend.map((pt, idx) => {
                  const slotW = 420 / dailyTrend.length;
                  const barW = Math.min(28, Math.max(12, slotW * 0.54));
                  const barH = Math.max(6, Math.round((pt.total / maxDailyTotal) * 140));
                  const x = idx * slotW + (slotW - barW) / 2;
                  const y = 168 - barH;
                  return (
                    <g key={pt.date}>
                      <title>{`${pt.date}: ${formatCurrency(pt.total)} (${pt.count} items)`}</title>
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx="4"
                        fill="#4338ca"
                      />
                      <text
                        x={x + barW / 2}
                        y="186"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-2">
                {dailyTrend.slice(-4).reverse().map((pt) => (
                  <div key={pt.date} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-mono tabular-nums text-slate-600">{pt.date}</span>
                    <span className="text-slate-500 tabular-nums">
                      {pt.count} {pt.count === 1 ? 'item' : 'items'}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-slate-900">
                      {formatCurrency(pt.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Deterministic State Reducer Action Log */}
      <section aria-label="State reducer action log" className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Deterministic State Transitions Log
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Every UI mutation dispatches a typed action through the pure appReducer function before persisting to IndexedDB.
          </p>
        </div>

        {actionLog.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Perform any add, edit, filter, or budget update to inspect state transitions here.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Action Type</th>
                  <th className="py-2.5 pr-4 font-medium">State Mutation Summary</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Records</th>
                  <th className="py-2.5 text-right font-medium">Ledger Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actionLog.slice(0, 8).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 pr-4 font-mono font-medium text-indigo-700 whitespace-nowrap">
                      {entry.actionType}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-700">{entry.summary}</td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-600">
                      {entry.recordCountAfter}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {formatCurrency(entry.totalAmountAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
