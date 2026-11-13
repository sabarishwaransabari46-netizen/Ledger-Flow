import React from 'react';
import { Pencil, RotateCcw, Search, Trash2 } from 'lucide-react';
import {
  type DateWindow,
  EXPENSE_CATEGORIES,
  type ExpenseFilterState,
  type ExpenseRecord,
  type ExpenseSummary,
  PAYMENT_METHODS,
  type SortOption,
} from '../types/expense';
import { formatCurrency } from '../logic/expenseRules';

interface ExpensesPageProps {
  expenses: ExpenseRecord[];
  filteredExpenses: ExpenseRecord[];
  filters: ExpenseFilterState;
  summary: ExpenseSummary;
  onFilterChange: (patch: Partial<ExpenseFilterState>) => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (expense: ExpenseRecord) => void;
  onDelete: (id: string) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  filteredExpenses,
  filters,
  summary,
  onFilterChange,
  onResetFilters,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}) => {
  const hasActiveFilters =
    filters.query.trim() !== '' ||
    filters.category !== 'All' ||
    filters.paymentMethod !== 'All' ||
    filters.dateWindow !== 'all';

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section aria-label="Expense summary metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Filtered Total</p>
          <p
            data-testid="filtered-total"
            className="mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums text-slate-900"
          >
            {formatCurrency(summary.filteredTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.filteredCount} of {summary.allTimeCount} entries
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Monthly Budget Remaining</p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.budgetRemaining < 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {formatCurrency(summary.budgetRemaining)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {summary.budgetUtilizationPct}% of {formatCurrency(summary.totalBudgetLimit)} cap
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Average Transaction</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
            {formatCurrency(summary.averageAmount)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Highest {formatCurrency(summary.highestAmount)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">All-Time Ledger</p>
          <p
            data-testid="all-time-total"
            className="mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums text-slate-900"
          >
            {formatCurrency(summary.allTimeTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {expenses.length} local records
          </p>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section aria-label="Filter expenses" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <label htmlFor="expense-search" className="sr-only">
              Search expenses by title, merchant, or note
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="expense-search"
              type="search"
              value={filters.query}
              onChange={(e) => onFilterChange({ query: e.target.value })}
              placeholder="Search title, merchant, or note..."
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <div>
              <label htmlFor="filter-date-window" className="sr-only">
                Date range
              </label>
              <select
                id="filter-date-window"
                value={filters.dateWindow}
                onChange={(e) => onFilterChange({ dateWindow: e.target.value as DateWindow })}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-indigo-700 focus:outline-none sm:w-auto"
              >
                <option value="all">All Dates</option>
                <option value="this-month">This Month (Nov)</option>
                <option value="last-30">Last 30 Days</option>
                <option value="last-7">Last 7 Days</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-payment-method" className="sr-only">
                Payment method
              </label>
              <select
                id="filter-payment-method"
                value={filters.paymentMethod}
                onChange={(e) =>
                  onFilterChange({
                    paymentMethod: e.target.value as ExpenseFilterState['paymentMethod'],
                  })
                }
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-indigo-700 focus:outline-none sm:w-auto"
              >
                <option value="All">All Methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-sort" className="sr-only">
                Sort order
              </label>
              <select
                id="filter-sort"
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-indigo-700 focus:outline-none sm:w-auto"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="category">Category A-Z</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Segmented Filter Buttons */}
        <div
          role="group"
          aria-label="Filter by expense category"
          className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          <button
            type="button"
            onClick={() => onFilterChange({ category: 'All' })}
            aria-pressed={filters.category === 'All'}
            className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              filters.category === 'All'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {EXPENSE_CATEGORIES.map((category) => {
            const active = filters.category === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onFilterChange({ category })}
                aria-pressed={active}
                className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Expense Ledger List */}
      <section aria-label="Expense transactions" className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Expense Ledger</h2>
            <p className="text-xs text-slate-500 tabular-nums">
              Showing {filteredExpenses.length} matching records · Total {formatCurrency(summary.filteredTotal)}
            </p>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-base font-semibold text-slate-900">
              {expenses.length === 0 ? 'No expenses recorded yet' : 'No transactions match your filters'}
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
              {expenses.length === 0
                ? 'Log your first expense to initialize your local IndexedDB ledger and real-time budget calculations.'
                : 'Adjust your search query, date window, or category filter to view matching records.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={onOpenCreate}
                className="min-h-[44px] rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
              >
                Log First Expense
              </button>
            </div>
          </div>
        ) : (
          <ul data-testid="expense-list" className="divide-y divide-slate-100">
            {filteredExpenses.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 sm:hidden">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span>{item.merchant}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.date}</span>
                    {item.note && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate text-slate-400">{item.note}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="hidden font-mono text-sm font-semibold tabular-nums text-slate-900 sm:inline">
                    {formatCurrency(item.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(item)}
                      aria-label={`Edit '${item.title}'`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      aria-label={`Delete '${item.title}'`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
