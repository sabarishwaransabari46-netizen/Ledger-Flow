import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appReducer,
  buildSqliteEquivalentQuery,
  calculateCategoryBreakdown,
  calculateExpenseSummary,
  DEFAULT_BUDGETS,
  DEFAULT_FILTERS,
  DEFAULT_REFERENCE_DATE,
  exportExpensesToCsv,
  filterAndSortExpenses,
  validateExpenseInput,
  validateExpenseListJson,
} from './expenseRules';
import type { AppState, ExpenseRecord } from '../types/expense';

const SAMPLE_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    title: 'Whole Foods Market',
    merchant: 'Whole Foods',
    amount: 84.25,
    category: 'Food',
    paymentMethod: 'Card',
    date: '2026-11-12',
    note: 'Weekly produce and pantry',
    createdAt: '2026-11-12T10:00:00.000Z',
    updatedAt: '2026-11-12T10:00:00.000Z',
  },
  {
    id: 'exp-2',
    title: 'Monthly Metro Pass',
    merchant: 'City Transit',
    amount: 120.0,
    category: 'Transport',
    paymentMethod: 'Wallet',
    date: '2026-11-01',
    note: 'Commuter pass',
    createdAt: '2026-11-01T08:30:00.000Z',
    updatedAt: '2026-11-01T08:30:00.000Z',
  },
  {
    id: 'exp-3',
    title: 'Cloud Database Hosting',
    merchant: 'DigitalOcean',
    amount: 42.5,
    category: 'Software',
    paymentMethod: 'Card',
    date: '2026-10-18',
    note: 'Staging droplet',
    createdAt: '2026-10-18T14:00:00.000Z',
    updatedAt: '2026-10-18T14:00:00.000Z',
  },
];

function createTestState(): AppState {
  return {
    expenses: SAMPLE_EXPENSES,
    budgets: { ...DEFAULT_BUDGETS },
    filters: { ...DEFAULT_FILTERS },
    actionLog: [],
    objectives: [],
    referenceDate: DEFAULT_REFERENCE_DATE,
  };
}

test('validateExpenseInput rejects empty title, negative amount, and invalid date', () => {
  const result = validateExpenseInput({
    title: '   ',
    merchant: '',
    amount: '-12',
    category: 'Food',
    paymentMethod: 'Card',
    date: '2026-02-30',
    note: '',
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.title);
  assert.ok(result.errors.merchant);
  assert.ok(result.errors.amount);
  assert.ok(result.errors.date);
});

test('validateExpenseInput accepts a clean valid expense draft', () => {
  const result = validateExpenseInput({
    title: 'Espresso & Toast',
    merchant: 'Blue Bottle',
    amount: '14.50',
    category: 'Food',
    paymentMethod: 'Card',
    date: '2026-11-13',
    note: 'Morning coffee',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('filterAndSortExpenses filters by category, search query, and date window', () => {
  const byCategory = filterAndSortExpenses(
    SAMPLE_EXPENSES,
    { ...DEFAULT_FILTERS, category: 'Food' },
    DEFAULT_REFERENCE_DATE
  );
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, 'exp-1');

  const byLast7 = filterAndSortExpenses(
    SAMPLE_EXPENSES,
    { ...DEFAULT_FILTERS, dateWindow: 'last-7' },
    DEFAULT_REFERENCE_DATE
  );
  assert.equal(byLast7.length, 1);
  assert.equal(byLast7[0].id, 'exp-1');

  const byQueryAndSort = filterAndSortExpenses(
    SAMPLE_EXPENSES,
    { ...DEFAULT_FILTERS, query: 'metro', sortBy: 'amount-asc' },
    DEFAULT_REFERENCE_DATE
  );
  assert.equal(byQueryAndSort.length, 1);
  assert.equal(byQueryAndSort[0].merchant, 'City Transit');
});

test('calculateExpenseSummary and calculateCategoryBreakdown compute accurate totals', () => {
  const filtered = filterAndSortExpenses(
    SAMPLE_EXPENSES,
    { ...DEFAULT_FILTERS, category: 'Transport' },
    DEFAULT_REFERENCE_DATE
  );
  const summary = calculateExpenseSummary(SAMPLE_EXPENSES, filtered, DEFAULT_BUDGETS);

  assert.equal(summary.filteredTotal, 120);
  assert.equal(summary.allTimeTotal, 246.75);
  assert.equal(summary.filteredCount, 1);
  assert.equal(summary.allTimeCount, 3);
  assert.equal(summary.averageAmount, 120);

  const breakdown = calculateCategoryBreakdown(SAMPLE_EXPENSES, DEFAULT_BUDGETS);
  const transport = breakdown.find((b) => b.category === 'Transport');
  assert.ok(transport);
  assert.equal(transport.spent, 120);
  assert.equal(transport.overBudget, false);
});

test('validateExpenseListJson rejects malformed JSON and duplicate IDs', () => {
  const malformed = validateExpenseListJson('{not-json');
  assert.equal(malformed.valid, false);
  assert.ok(malformed.errors[0].includes('JSON syntax error'));

  const duplicateIds = validateExpenseListJson(
    JSON.stringify([SAMPLE_EXPENSES[0], SAMPLE_EXPENSES[0]])
  );
  assert.equal(duplicateIds.valid, false);
  assert.ok(duplicateIds.errors.some((e) => e.includes('Duplicate id')));

  const validBatch = validateExpenseListJson(JSON.stringify(SAMPLE_EXPENSES));
  assert.equal(validBatch.valid, true);
  assert.equal(validBatch.records.length, 3);
});

test('appReducer handles ADD_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE, and SET_BUDGET', () => {
  let state = createTestState();

  const added: ExpenseRecord = {
    id: 'exp-4',
    title: 'Pharmacy',
    merchant: 'CVS',
    amount: 28.4,
    category: 'Health',
    paymentMethod: 'Cash',
    date: '2026-11-13',
    note: '',
    createdAt: '2026-11-13T10:00:00.000Z',
    updatedAt: '2026-11-13T10:00:00.000Z',
  };

  state = appReducer(state, { type: 'ADD_EXPENSE', payload: added });
  assert.equal(state.expenses.length, 4);
  assert.equal(state.actionLog[0].actionType, 'ADD_EXPENSE');

  state = appReducer(state, {
    type: 'UPDATE_EXPENSE',
    payload: { ...added, amount: 30.0 },
  });
  assert.equal(state.expenses.find((e) => e.id === 'exp-4')?.amount, 30.0);

  state = appReducer(state, { type: 'DELETE_EXPENSE', payload: { id: 'exp-4' } });
  assert.equal(state.expenses.length, 3);

  state = appReducer(state, {
    type: 'SET_BUDGET',
    payload: { category: 'Food', limit: 600 },
  });
  assert.equal(state.budgets.Food, 600);
});

test('exportExpensesToCsv and buildSqliteEquivalentQuery format clean output', () => {
  const csv = exportExpensesToCsv(SAMPLE_EXPENSES);
  assert.ok(csv.startsWith('id,date,title,merchant,category,paymentMethod,amount,note'));
  assert.ok(csv.includes('Whole Foods Market'));

  const sql = buildSqliteEquivalentQuery({
    ...DEFAULT_FILTERS,
    category: 'Food',
    query: 'Whole',
  });
  assert.ok(sql.includes("category = 'Food'"));
  assert.ok(sql.includes("title LIKE '%Whole%'"));
});
