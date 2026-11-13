import React, { useEffect, useMemo, useReducer, useState } from 'react';
import {
  BarChart3,
  Cpu,
  Database,
  Plus,
  ReceiptText,
} from 'lucide-react';
import type {
  AppPage,
  AppState,
  ExpenseCategory,
  ExpenseDraft,
  ExpenseFilterState,
  ExpenseRecord,
} from './types/expense';
import {
  appReducer,
  calculateCategoryBreakdown,
  calculateDailyTrend,
  calculateExpenseSummary,
  DEFAULT_BUDGETS,
  DEFAULT_FILTERS,
  DEFAULT_REFERENCE_DATE,
  filterAndSortExpenses,
  roundCurrency,
} from './logic/expenseRules';
import {
  loadPersistedState,
  savePersistedState,
  SEED_EXPENSES,
  SEED_OBJECTIVES,
} from './storage/localDb';
import { ExpensesPage } from './components/ExpensesPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { LocalDbPage } from './components/LocalDbPage';
import { ArchitecturePage } from './components/ArchitecturePage';
import { ExpenseModal } from './components/ExpenseModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const INITIAL_STATE: AppState = {
  expenses: SEED_EXPENSES,
  budgets: { ...DEFAULT_BUDGETS },
  filters: { ...DEFAULT_FILTERS },
  actionLog: [],
  objectives: SEED_OBJECTIVES,
  referenceDate: DEFAULT_REFERENCE_DATE,
};

const NAV_ITEMS: { id: AppPage; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'expenses', label: 'Expense Tracker', shortLabel: 'Expenses', icon: ReceiptText },
  { id: 'analytics', label: 'Analytics & Rules', shortLabel: 'Analytics', icon: BarChart3 },
  { id: 'storage', label: 'Local DB & JSON', shortLabel: 'Local DB', icon: Database },
  { id: 'architecture', label: 'Cross-Platform', shortLabel: 'Stacks', icon: Cpu },
];

export default function App() {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [activePage, setActivePage] = useState<AppPage>('expenses');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  useEffect(() => {
    let active = true;
    void loadPersistedState().then((persisted) => {
      if (!active) return;
      dispatch({
        type: 'HYDRATE_STATE',
        payload: {
          expenses: persisted.expenses,
          budgets: persisted.budgets,
          objectives: persisted.objectives,
        },
      });
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void savePersistedState({
      expenses: state.expenses,
      budgets: state.budgets,
      objectives: state.objectives,
      lastSavedAt: new Date().toISOString(),
    });
  }, [hydrated, state.expenses, state.budgets, state.objectives]);

  const filteredExpenses = useMemo(
    () => filterAndSortExpenses(state.expenses, state.filters, state.referenceDate),
    [state.expenses, state.filters, state.referenceDate]
  );

  const summary = useMemo(
    () => calculateExpenseSummary(state.expenses, filteredExpenses, state.budgets),
    [state.expenses, filteredExpenses, state.budgets]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(state.expenses, state.budgets),
    [state.expenses, state.budgets]
  );

  const dailyTrend = useMemo(
    () => calculateDailyTrend(filteredExpenses),
    [filteredExpenses]
  );

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleSaveExpense = (draft: ExpenseDraft, existingId?: string) => {
    const nowIso = new Date().toISOString();
    const numericAmount = roundCurrency(Number(draft.amount));

    if (existingId && editingExpense) {
      dispatch({
        type: 'UPDATE_EXPENSE',
        payload: {
          ...editingExpense,
          title: draft.title.trim(),
          merchant: draft.merchant.trim(),
          amount: numericAmount,
          category: draft.category,
          paymentMethod: draft.paymentMethod,
          date: draft.date,
          note: draft.note.trim(),
          updatedAt: nowIso,
        },
      });
    } else {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `exp-${crypto.randomUUID().slice(0, 8)}`
          : `exp-${Date.now()}`;

      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          id,
          title: draft.title.trim(),
          merchant: draft.merchant.trim(),
          amount: numericAmount,
          category: draft.category,
          paymentMethod: draft.paymentMethod,
          date: draft.date,
          note: draft.note.trim(),
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      });
    }
  };

  const handleFilterChange = (patch: Partial<ExpenseFilterState>) => {
    dispatch({ type: 'SET_FILTER', payload: patch });
  };

  const handleUpdateBudget = (category: ExpenseCategory, limit: number) => {
    dispatch({ type: 'SET_BUDGET', payload: { category, limit } });
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === activePage) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              LedgerFlow
            </span>
          </div>

          <nav aria-label="Primary workspace navigation" className="flex-1 space-y-1 p-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Local Persistence</p>
            <p className="mt-1 tabular-nums">
              {state.expenses.length} records cached in IndexedDB
            </p>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-8">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:h-16">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap lg:hidden">
                LedgerFlow
              </span>
              <span className="text-slate-300 lg:hidden" aria-hidden="true">
                /
              </span>
              <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                <span className="sm:hidden">{currentNav.shortLabel}</span>
                <span className="hidden sm:inline">{currentNav.label}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <PWAInstallButton />
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-800 sm:text-sm whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Log Expense</span>
              </button>
            </div>
          </header>

          {/* Active Page Viewport */}
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
            {activePage === 'expenses' && (
              <ExpensesPage
                expenses={state.expenses}
                filteredExpenses={filteredExpenses}
                filters={state.filters}
                summary={summary}
                onFilterChange={handleFilterChange}
                onResetFilters={() => dispatch({ type: 'RESET_FILTERS' })}
                onOpenCreate={handleOpenCreate}
                onOpenEdit={handleOpenEdit}
                onDelete={(id) => dispatch({ type: 'DELETE_EXPENSE', payload: { id } })}
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsPage
                breakdown={categoryBreakdown}
                budgets={state.budgets}
                dailyTrend={dailyTrend}
                actionLog={state.actionLog}
                onUpdateBudget={handleUpdateBudget}
              />
            )}

            {activePage === 'storage' && (
              <LocalDbPage
                expenses={state.expenses}
                filters={state.filters}
                onReplaceExpenses={(records) =>
                  dispatch({ type: 'REPLACE_EXPENSES', payload: records })
                }
                onResetSeed={() =>
                  dispatch({
                    type: 'RESET_SEED_DATA',
                    payload: { expenses: SEED_EXPENSES, budgets: { ...DEFAULT_BUDGETS } },
                  })
                }
              />
            )}

            {activePage === 'architecture' && (
              <ArchitecturePage
                objectives={state.objectives}
                onToggleObjective={(id) =>
                  dispatch({ type: 'TOGGLE_OBJECTIVE', payload: { id } })
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Fixed Bottom Tab Bar (64px height; combined sticky height 56+64 = 120px <= 15% of 844px) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 items-center border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <ExpenseModal
        isOpen={modalOpen}
        editingExpense={editingExpense}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />

      <OfflineIndicator />
    </div>
  );
}
