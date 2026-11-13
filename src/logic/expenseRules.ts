import {
  type AppAction,
  type AppState,
  type CategoryBreakdownItem,
  type CategoryBudgetMap,
  type DailyTrendPoint,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseDraft,
  type ExpenseFilterState,
  type ExpenseRecord,
  type ExpenseSummary,
  PAYMENT_METHODS,
  type PaymentMethod,
  type ValidationResult,
} from '../types/expense';

export const DEFAULT_REFERENCE_DATE = '2026-11-13';

export const DEFAULT_FILTERS: ExpenseFilterState = {
  query: '',
  category: 'All',
  paymentMethod: 'All',
  dateWindow: 'all',
  sortBy: 'date-desc',
};

export const DEFAULT_BUDGETS: CategoryBudgetMap = {
  Food: 450,
  Transport: 220,
  Housing: 1400,
  Utilities: 240,
  Software: 180,
  Health: 200,
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function validateExpenseInput(draft: ExpenseDraft): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const generalErrors: string[] = [];

  const title = typeof draft.title === 'string' ? draft.title.trim() : '';
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > 80) {
    errors.title = 'Title must be 80 characters or fewer.';
  }

  const merchant = typeof draft.merchant === 'string' ? draft.merchant.trim() : '';
  if (!merchant) {
    errors.merchant = 'Merchant or payee is required.';
  } else if (merchant.length > 60) {
    errors.merchant = 'Merchant must be 60 characters or fewer.';
  }

  const parsedAmount =
    typeof draft.amount === 'number' ? draft.amount : Number(String(draft.amount).trim());
  if (
    String(draft.amount).trim() === '' ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0
  ) {
    errors.amount = 'Enter a valid amount greater than 0.';
  } else if (parsedAmount > 1_000_000) {
    errors.amount = 'Amount cannot exceed 1,000,000.';
  }

  if (!EXPENSE_CATEGORIES.includes(draft.category)) {
    errors.category = 'Select a valid expense category.';
  }

  if (!PAYMENT_METHODS.includes(draft.paymentMethod)) {
    errors.paymentMethod = 'Select a valid payment method.';
  }

  if (!isValidIsoDate(draft.date)) {
    errors.date = 'Enter a valid date (YYYY-MM-DD).';
  }

  if (typeof draft.note === 'string' && draft.note.length > 200) {
    errors.note = 'Note must be 200 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0 && generalErrors.length === 0,
    errors,
    generalErrors,
  };
}

export function validateExpenseListJson(
  rawJson: string
): { valid: boolean; records: ExpenseRecord[]; errors: string[] } {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    return {
      valid: false,
      records: [],
      errors: [
        `JSON syntax error: ${err instanceof Error ? err.message : 'Unable to parse JSON.'}`,
      ],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      valid: false,
      records: [],
      errors: ['Root JSON value must be an array of ExpenseRecord objects.'],
    };
  }

  const records: ExpenseRecord[] = [];
  const seenIds = new Set<string>();

  parsed.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`Row ${index + 1}: Expected an object.`);
      return;
    }

    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    if (!id) {
      errors.push(`Row ${index + 1}: Missing non-empty string "id".`);
    } else if (seenIds.has(id)) {
      errors.push(`Row ${index + 1}: Duplicate id "${id}".`);
    } else {
      seenIds.add(id);
    }

    const draftCheck = validateExpenseInput({
      title: typeof row.title === 'string' ? row.title : '',
      merchant: typeof row.merchant === 'string' ? row.merchant : '',
      amount: typeof row.amount === 'number' ? row.amount : Number(row.amount),
      category: row.category as ExpenseCategory,
      paymentMethod: row.paymentMethod as PaymentMethod,
      date: typeof row.date === 'string' ? row.date : '',
      note: typeof row.note === 'string' ? row.note : '',
    });

    if (!draftCheck.valid) {
      const fieldIssues = Object.entries(draftCheck.errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('; ');
      errors.push(`Row ${index + 1}: ${fieldIssues}`);
      return;
    }

    if (id) {
      const nowIso = new Date().toISOString();
      records.push({
        id,
        title: String(row.title).trim(),
        merchant: String(row.merchant).trim(),
        amount: roundCurrency(Number(row.amount)),
        category: row.category as ExpenseCategory,
        paymentMethod: row.paymentMethod as PaymentMethod,
        date: String(row.date),
        note: typeof row.note === 'string' ? row.note.trim() : '',
        createdAt: typeof row.createdAt === 'string' ? row.createdAt : nowIso,
        updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : nowIso,
      });
    }
  });

  return {
    valid: errors.length === 0,
    records: errors.length === 0 ? records : [],
    errors,
  };
}

function diffDaysIso(laterIso: string, earlierIso: string): number {
  const [ly, lm, ld] = laterIso.split('-').map(Number);
  const [ey, em, ed] = earlierIso.split('-').map(Number);
  const laterMs = Date.UTC(ly, lm - 1, ld);
  const earlierMs = Date.UTC(ey, em - 1, ed);
  return Math.floor((laterMs - earlierMs) / (1000 * 60 * 60 * 24));
}

export function filterAndSortExpenses(
  expenses: ExpenseRecord[],
  filters: ExpenseFilterState,
  referenceDate: string = DEFAULT_REFERENCE_DATE
): ExpenseRecord[] {
  const q = filters.query.trim().toLowerCase();
  const refMonthPrefix = referenceDate.slice(0, 7);

  const filtered = expenses.filter((expense) => {
    if (filters.category !== 'All' && expense.category !== filters.category) {
      return false;
    }
    if (filters.paymentMethod !== 'All' && expense.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    if (filters.dateWindow === 'this-month' && !expense.date.startsWith(refMonthPrefix)) {
      return false;
    }
    if (filters.dateWindow === 'last-30') {
      const days = diffDaysIso(referenceDate, expense.date);
      if (days < 0 || days > 30) return false;
    }
    if (filters.dateWindow === 'last-7') {
      const days = diffDaysIso(referenceDate, expense.date);
      if (days < 0 || days > 7) return false;
    }
    if (q) {
      const haystack = `${expense.title} ${expense.merchant} ${expense.category} ${expense.note}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'date-desc':
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      case 'date-asc':
        return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
      case 'amount-desc':
        return b.amount - a.amount || b.date.localeCompare(a.date);
      case 'amount-asc':
        return a.amount - b.amount || b.date.localeCompare(a.date);
      case 'category':
        return a.category.localeCompare(b.category) || b.date.localeCompare(a.date);
      default:
        return 0;
    }
  });
}

export function calculateExpenseSummary(
  allExpenses: ExpenseRecord[],
  filteredExpenses: ExpenseRecord[],
  budgets: CategoryBudgetMap
): ExpenseSummary {
  const filteredTotal = roundCurrency(
    filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
  );
  const allTimeTotal = roundCurrency(
    allExpenses.reduce((sum, item) => sum + item.amount, 0)
  );
  const filteredCount = filteredExpenses.length;
  const allTimeCount = allExpenses.length;
  const averageAmount =
    filteredCount > 0 ? roundCurrency(filteredTotal / filteredCount) : 0;
  const highestAmount =
    filteredCount > 0
      ? roundCurrency(Math.max(...filteredExpenses.map((e) => e.amount)))
      : 0;
  const totalBudgetLimit = roundCurrency(
    Object.values(budgets).reduce((sum, limit) => sum + limit, 0)
  );
  const budgetRemaining = roundCurrency(totalBudgetLimit - allTimeTotal);
  const budgetUtilizationPct =
    totalBudgetLimit > 0
      ? Math.round((allTimeTotal / totalBudgetLimit) * 1000) / 10
      : 0;

  return {
    filteredTotal,
    allTimeTotal,
    filteredCount,
    allTimeCount,
    averageAmount,
    highestAmount,
    totalBudgetLimit,
    budgetRemaining,
    budgetUtilizationPct,
  };
}

export function calculateCategoryBreakdown(
  expenses: ExpenseRecord[],
  budgets: CategoryBudgetMap
): CategoryBreakdownItem[] {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return EXPENSE_CATEGORIES.map((category) => {
    const matching = expenses.filter((e) => e.category === category);
    const spent = roundCurrency(matching.reduce((sum, e) => sum + e.amount, 0));
    const budget = roundCurrency(budgets[category] ?? 0);
    const sharePct = totalSpent > 0 ? Math.round((spent / totalSpent) * 1000) / 10 : 0;
    const budgetUtilizationPct =
      budget > 0 ? Math.round((spent / budget) * 1000) / 10 : spent > 0 ? 100 : 0;

    return {
      category,
      spent,
      budget,
      count: matching.length,
      sharePct,
      budgetUtilizationPct,
      overBudget: budget > 0 && spent > budget,
    };
  }).sort((a, b) => b.spent - a.spent);
}

export function calculateDailyTrend(
  expenses: ExpenseRecord[],
  maxPoints: number = 10
): DailyTrendPoint[] {
  const byDate = new Map<string, { total: number; count: number }>();

  for (const item of expenses) {
    const existing = byDate.get(item.date) ?? { total: 0, count: 0 };
    byDate.set(item.date, {
      total: roundCurrency(existing.total + item.amount),
      count: existing.count + 1,
    });
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxPoints)
    .map(([date, stats]) => ({
      date,
      label: date.slice(5), // MM-DD
      total: stats.total,
      count: stats.count,
    }));
}

export function exportExpensesToCsv(expenses: ExpenseRecord[]): string {
  const escapeCell = (val: string | number): string => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'id',
    'date',
    'title',
    'merchant',
    'category',
    'paymentMethod',
    'amount',
    'note',
  ];

  const rows = expenses.map((e) =>
    [
      escapeCell(e.id),
      escapeCell(e.date),
      escapeCell(e.title),
      escapeCell(e.merchant),
      escapeCell(e.category),
      escapeCell(e.paymentMethod),
      escapeCell(e.amount.toFixed(2)),
      escapeCell(e.note),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function buildSqliteEquivalentQuery(filters: ExpenseFilterState): string {
  const clauses: string[] = [];

  if (filters.category !== 'All') {
    clauses.push(`category = '${filters.category}'`);
  }
  if (filters.paymentMethod !== 'All') {
    clauses.push(`payment_method = '${filters.paymentMethod}'`);
  }
  if (filters.dateWindow === 'this-month') {
    clauses.push(`strftime('%Y-%m', date) = '2026-11'`);
  } else if (filters.dateWindow === 'last-30') {
    clauses.push(`date >= date('2026-11-13', '-30 days')`);
  } else if (filters.dateWindow === 'last-7') {
    clauses.push(`date >= date('2026-11-13', '-7 days')`);
  }
  if (filters.query.trim()) {
    const escaped = filters.query.trim().replace(/'/g, "''");
    clauses.push(`(title LIKE '%${escaped}%' OR merchant LIKE '%${escaped}%')`);
  }

  const orderMap: Record<ExpenseFilterState['sortBy'], string> = {
    'date-desc': 'date DESC, created_at DESC',
    'date-asc': 'date ASC, created_at ASC',
    'amount-desc': 'amount DESC',
    'amount-asc': 'amount ASC',
    category: 'category ASC, date DESC',
  };

  const whereSql = clauses.length > 0 ? `\nWHERE ${clauses.join('\n  AND ')}` : '';
  return `SELECT id, date, title, merchant, category, payment_method, amount\nFROM expenses${whereSql}\nORDER BY ${orderMap[filters.sortBy]};`;
}

function appendLog(
  state: AppState,
  actionType: string,
  summary: string,
  nextExpenses: ExpenseRecord[]
) {
  const total = roundCurrency(nextExpenses.reduce((s, e) => s + e.amount, 0));
  const entry = {
    id: `log-${Date.now()}-${state.actionLog.length + 1}`,
    actionType,
    summary,
    timestamp: new Date().toISOString(),
    recordCountAfter: nextExpenses.length,
    totalAmountAfter: total,
  };
  return [entry, ...state.actionLog].slice(0, 20);
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE_STATE': {
      return {
        ...state,
        ...action.payload,
        filters: action.payload.filters ?? state.filters,
        budgets: action.payload.budgets ?? state.budgets,
        expenses: action.payload.expenses ?? state.expenses,
        objectives: action.payload.objectives ?? state.objectives,
      };
    }

    case 'ADD_EXPENSE': {
      const nextExpenses = [action.payload, ...state.expenses];
      return {
        ...state,
        expenses: nextExpenses,
        actionLog: appendLog(
          state,
          'ADD_EXPENSE',
          `Inserted "${action.payload.title}" (${formatCurrency(action.payload.amount)})`,
          nextExpenses
        ),
      };
    }

    case 'UPDATE_EXPENSE': {
      const nextExpenses = state.expenses.map((item) =>
        item.id === action.payload.id ? action.payload : item
      );
      return {
        ...state,
        expenses: nextExpenses,
        actionLog: appendLog(
          state,
          'UPDATE_EXPENSE',
          `Updated "${action.payload.title}" (${formatCurrency(action.payload.amount)})`,
          nextExpenses
        ),
      };
    }

    case 'DELETE_EXPENSE': {
      const target = state.expenses.find((e) => e.id === action.payload.id);
      const nextExpenses = state.expenses.filter((e) => e.id !== action.payload.id);
      return {
        ...state,
        expenses: nextExpenses,
        actionLog: appendLog(
          state,
          'DELETE_EXPENSE',
          `Removed "${target?.title ?? action.payload.id}"`,
          nextExpenses
        ),
      };
    }

    case 'REPLACE_EXPENSES': {
      return {
        ...state,
        expenses: action.payload,
        actionLog: appendLog(
          state,
          'REPLACE_EXPENSES',
          `Imported ${action.payload.length} validated JSON records`,
          action.payload
        ),
      };
    }

    case 'SET_FILTER': {
      const nextFilters = { ...state.filters, ...action.payload };
      return {
        ...state,
        filters: nextFilters,
        actionLog: appendLog(
          state,
          'SET_FILTER',
          `Filter updated (${nextFilters.category}, ${nextFilters.dateWindow}, ${nextFilters.sortBy})`,
          state.expenses
        ),
      };
    }

    case 'RESET_FILTERS': {
      return {
        ...state,
        filters: DEFAULT_FILTERS,
        actionLog: appendLog(
          state,
          'RESET_FILTERS',
          'Cleared all active filters',
          state.expenses
        ),
      };
    }

    case 'SET_BUDGET': {
      const cleanLimit = Math.max(0, roundCurrency(action.payload.limit));
      const nextBudgets = {
        ...state.budgets,
        [action.payload.category]: cleanLimit,
      };
      return {
        ...state,
        budgets: nextBudgets,
        actionLog: appendLog(
          state,
          'SET_BUDGET',
          `Updated ${action.payload.category} cap to ${formatCurrency(cleanLimit)}`,
          state.expenses
        ),
      };
    }

    case 'TOGGLE_OBJECTIVE': {
      const nextObjectives = state.objectives.map((obj) =>
        obj.id === action.payload.id ? { ...obj, completed: !obj.completed } : obj
      );
      return {
        ...state,
        objectives: nextObjectives,
      };
    }

    case 'RESET_SEED_DATA': {
      return {
        ...state,
        expenses: action.payload.expenses,
        budgets: action.payload.budgets,
        filters: DEFAULT_FILTERS,
        actionLog: appendLog(
          state,
          'RESET_SEED_DATA',
          `Restored ${action.payload.expenses.length} baseline records`,
          action.payload.expenses
        ),
      };
    }

    default:
      return state;
  }
}
