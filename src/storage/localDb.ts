import type {
  CategoryBudgetMap,
  ExpenseRecord,
  ObjectiveProgress,
} from '../types/expense';
import { DEFAULT_BUDGETS } from '../logic/expenseRules';

const DB_NAME = 'LedgerFlowDB';
const DB_VERSION = 1;
const EXPENSES_STORE = 'expenses';
const META_STORE = 'meta';
const FALLBACK_KEY = 'ledgerflow_local_snapshot_v1';

export const SEED_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-101',
    title: 'Trader Joe’s Weekly Groceries',
    merchant: 'Trader Joe’s',
    amount: 92.4,
    category: 'Food',
    paymentMethod: 'Card',
    date: '2026-11-12',
    note: 'Produce, oats, and espresso beans',
    createdAt: '2026-11-12T18:20:00.000Z',
    updatedAt: '2026-11-12T18:20:00.000Z',
  },
  {
    id: 'exp-102',
    title: 'Apartment Lease Installment',
    merchant: 'Parkside Residences',
    amount: 1280.0,
    category: 'Housing',
    paymentMethod: 'Bank Transfer',
    date: '2026-11-01',
    note: 'November rent via ACH',
    createdAt: '2026-11-01T09:00:00.000Z',
    updatedAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'exp-103',
    title: 'JetBrains & GitHub Copilot',
    merchant: 'JetBrains s.r.o.',
    amount: 34.0,
    category: 'Software',
    paymentMethod: 'Card',
    date: '2026-11-09',
    note: 'Native IDE tooling subscription',
    createdAt: '2026-11-09T11:15:00.000Z',
    updatedAt: '2026-11-09T11:15:00.000Z',
  },
  {
    id: 'exp-104',
    title: 'Municipal Electric & Fiber',
    merchant: 'Pacific Grid & Fiber',
    amount: 146.85,
    category: 'Utilities',
    paymentMethod: 'Bank Transfer',
    date: '2026-11-06',
    note: 'Home power and gigabit internet',
    createdAt: '2026-11-06T14:40:00.000Z',
    updatedAt: '2026-11-06T14:40:00.000Z',
  },
  {
    id: 'exp-105',
    title: 'Metro Rail Monthly Pass',
    merchant: 'Bay Transit Authority',
    amount: 88.0,
    category: 'Transport',
    paymentMethod: 'Wallet',
    date: '2026-11-03',
    note: 'NFC mobile wallet pass',
    createdAt: '2026-11-03T07:50:00.000Z',
    updatedAt: '2026-11-03T07:50:00.000Z',
  },
  {
    id: 'exp-106',
    title: 'Dental Checkup Copay',
    merchant: 'Civic Dental Studio',
    amount: 65.0,
    category: 'Health',
    paymentMethod: 'Card',
    date: '2026-11-08',
    note: 'Preventive cleaning',
    createdAt: '2026-11-08T16:10:00.000Z',
    updatedAt: '2026-11-08T16:10:00.000Z',
  },
  {
    id: 'exp-107',
    title: 'Blue Bottle Espresso & Pastry',
    merchant: 'Blue Bottle Coffee',
    amount: 13.75,
    category: 'Food',
    paymentMethod: 'Cash',
    date: '2026-11-13',
    note: 'Morning study session',
    createdAt: '2026-11-13T08:15:00.000Z',
    updatedAt: '2026-11-13T08:15:00.000Z',
  },
  {
    id: 'exp-108',
    title: 'Airport Shuttle Ride',
    merchant: 'Metro Express',
    amount: 42.5,
    category: 'Transport',
    paymentMethod: 'Card',
    date: '2026-10-25',
    note: 'Late October trip',
    createdAt: '2026-10-25T19:05:00.000Z',
    updatedAt: '2026-10-25T19:05:00.000Z',
  },
];

export const SEED_OBJECTIVES: ObjectiveProgress[] = [
  {
    id: 1,
    title: 'Programming Languages & State Management Baselines',
    description:
      'Compare Dart, JavaScript/TypeScript, Python, and native Swift/Kotlin patterns with deterministic reducer state rules.',
    completed: true,
  },
  {
    id: 2,
    title: 'Device Storage, JSON Processing & Local Database',
    description:
      'Inspect IndexedDB object stores, localStorage key-value serialization, strict JSON schema parsing, and SQLite query mapping.',
    completed: true,
  },
  {
    id: 3,
    title: 'Mobile Expense Tracker with Filters & Totals',
    description:
      'Add, edit, delete, search, and filter expense records offline with real-time total and budget calculations.',
    completed: false,
  },
  {
    id: 4,
    title: 'Application Data Models, Schemas & Clean State Rules',
    description:
      'Validate records against strict field constraints and enforce pure state transitions with zero side-effect leakage.',
    completed: false,
  },
];

export interface PersistedPayload {
  expenses: ExpenseRecord[];
  budgets: CategoryBudgetMap;
  objectives: ObjectiveProgress[];
  lastSavedAt: string;
}

export interface StorageMetrics {
  engine: 'IndexedDB + LocalStorage' | 'LocalStorage Fallback';
  dbName: string;
  expenseCount: number;
  indexedDbBytes: number;
  localStorageBytes: number;
  cacheEntries: number;
  serviceWorkerActive: boolean;
  lastSavedAt: string | null;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EXPENSES_STORE)) {
        const store = db.createObjectStore(EXPENSES_STORE, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
  });
}

function writeLocalFallback(payload: PersistedPayload): void {
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors in restricted sandboxes
  }
}

function readLocalFallback(): PersistedPayload | null {
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedPayload>;
    if (!Array.isArray(parsed.expenses)) return null;
    return {
      expenses: parsed.expenses,
      budgets: parsed.budgets ?? { ...DEFAULT_BUDGETS },
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : SEED_OBJECTIVES,
      lastSavedAt: parsed.lastSavedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function loadPersistedState(): Promise<PersistedPayload> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([EXPENSES_STORE, META_STORE], 'readonly');
    const expensesReq = tx.objectStore(EXPENSES_STORE).getAll();
    const budgetsReq = tx.objectStore(META_STORE).get('budgets');
    const objectivesReq = tx.objectStore(META_STORE).get('objectives');
    const savedAtReq = tx.objectStore(META_STORE).get('lastSavedAt');

    const result = await new Promise<{
      expenses: ExpenseRecord[];
      budgets?: CategoryBudgetMap;
      objectives?: ObjectiveProgress[];
      lastSavedAt?: string;
    }>((resolve, reject) => {
      tx.oncomplete = () => {
        resolve({
          expenses: (expensesReq.result as ExpenseRecord[]) ?? [],
          budgets: budgetsReq.result?.value as CategoryBudgetMap | undefined,
          objectives: objectivesReq.result?.value as ObjectiveProgress[] | undefined,
          lastSavedAt: savedAtReq.result?.value as string | undefined,
        });
      };
      tx.onerror = () => reject(tx.error ?? new Error('Failed to read IndexedDB.'));
    });

    db.close();

    // First run initialization: check fallback or seed
    if (!result.lastSavedAt && result.expenses.length === 0) {
      const fallback = readLocalFallback();
      const initial: PersistedPayload = fallback ?? {
        expenses: SEED_EXPENSES,
        budgets: { ...DEFAULT_BUDGETS },
        objectives: SEED_OBJECTIVES,
        lastSavedAt: new Date().toISOString(),
      };
      await savePersistedState(initial);
      return initial;
    }

    return {
      expenses: result.expenses,
      budgets: result.budgets ?? { ...DEFAULT_BUDGETS },
      objectives: result.objectives ?? SEED_OBJECTIVES,
      lastSavedAt: result.lastSavedAt ?? new Date().toISOString(),
    };
  } catch {
    const fallback = readLocalFallback();
    if (fallback) return fallback;
    const initial: PersistedPayload = {
      expenses: SEED_EXPENSES,
      budgets: { ...DEFAULT_BUDGETS },
      objectives: SEED_OBJECTIVES,
      lastSavedAt: new Date().toISOString(),
    };
    writeLocalFallback(initial);
    return initial;
  }
}

export async function savePersistedState(payload: PersistedPayload): Promise<void> {
  writeLocalFallback(payload);

  try {
    const db = await openDatabase();
    const tx = db.transaction([EXPENSES_STORE, META_STORE], 'readwrite');
    const expStore = tx.objectStore(EXPENSES_STORE);
    const metaStore = tx.objectStore(META_STORE);

    expStore.clear();
    for (const expense of payload.expenses) {
      expStore.put(expense);
    }

    metaStore.put({ key: 'budgets', value: payload.budgets });
    metaStore.put({ key: 'objectives', value: payload.objectives });
    metaStore.put({ key: 'lastSavedAt', value: payload.lastSavedAt });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save to IndexedDB.'));
    });

    db.close();
  } catch {
    // Fallback already written to localStorage
  }
}

export async function getStorageMetrics(expenses: ExpenseRecord[]): Promise<StorageMetrics> {
  const serializedExpenses = JSON.stringify(expenses);
  const indexedDbBytes = new Blob([serializedExpenses]).size;

  let localStorageBytes = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        const val = window.localStorage.getItem(key) ?? '';
        localStorageBytes += new Blob([key, val]).size;
      }
    }
  } catch {
    localStorageBytes = 0;
  }

  let cacheEntries = 0;
  try {
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      for (const name of cacheNames) {
        const cache = await window.caches.open(name);
        const keys = await cache.keys();
        cacheEntries += keys.length;
      }
    }
  } catch {
    cacheEntries = 0;
  }

  const serviceWorkerActive =
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    !!navigator.serviceWorker.controller;

  const fallback = readLocalFallback();

  return {
    engine:
      typeof window !== 'undefined' && 'indexedDB' in window
        ? 'IndexedDB + LocalStorage'
        : 'LocalStorage Fallback',
    dbName: DB_NAME,
    expenseCount: expenses.length,
    indexedDbBytes,
    localStorageBytes,
    cacheEntries,
    serviceWorkerActive,
    lastSavedAt: fallback?.lastSavedAt ?? null,
  };
}
