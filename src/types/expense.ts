export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Software',
  'Health',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = [
  'Card',
  'Cash',
  'Bank Transfer',
  'Wallet',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category';

export type DateWindow = 'all' | 'this-month' | 'last-30' | 'last-7';

export type AppPage = 'expenses' | 'analytics' | 'storage' | 'architecture';

export interface ExpenseRecord {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface ExpenseDraft {
  title: string;
  merchant: string;
  amount: string | number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string;
  note: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ExpenseDraft, string>>;
  generalErrors: string[];
}

export interface ExpenseFilterState {
  query: string;
  category: ExpenseCategory | 'All';
  paymentMethod: PaymentMethod | 'All';
  dateWindow: DateWindow;
  sortBy: SortOption;
}

export type CategoryBudgetMap = Record<ExpenseCategory, number>;

export interface StateLogEntry {
  id: string;
  actionType: string;
  summary: string;
  timestamp: string;
  recordCountAfter: number;
  totalAmountAfter: number;
}

export interface ObjectiveProgress {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface AppState {
  expenses: ExpenseRecord[];
  budgets: CategoryBudgetMap;
  filters: ExpenseFilterState;
  actionLog: StateLogEntry[];
  objectives: ObjectiveProgress[];
  referenceDate: string; // YYYY-MM-DD used for deterministic date windowing
}

export type AppAction =
  | { type: 'HYDRATE_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_EXPENSE'; payload: ExpenseRecord }
  | { type: 'UPDATE_EXPENSE'; payload: ExpenseRecord }
  | { type: 'DELETE_EXPENSE'; payload: { id: string } }
  | { type: 'REPLACE_EXPENSES'; payload: ExpenseRecord[] }
  | { type: 'SET_FILTER'; payload: Partial<ExpenseFilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_BUDGET'; payload: { category: ExpenseCategory; limit: number } }
  | { type: 'TOGGLE_OBJECTIVE'; payload: { id: number } }
  | { type: 'RESET_SEED_DATA'; payload: { expenses: ExpenseRecord[]; budgets: CategoryBudgetMap } };

export interface ExpenseSummary {
  filteredTotal: number;
  allTimeTotal: number;
  filteredCount: number;
  allTimeCount: number;
  averageAmount: number;
  highestAmount: number;
  totalBudgetLimit: number;
  budgetRemaining: number;
  budgetUtilizationPct: number;
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  spent: number;
  budget: number;
  count: number;
  sharePct: number;
  budgetUtilizationPct: number;
  overBudget: boolean;
}

export interface DailyTrendPoint {
  date: string;
  label: string;
  total: number;
  count: number;
}
