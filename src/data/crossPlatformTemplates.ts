import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../types/expense';

export type StackKey = 'python' | 'dart' | 'typescript' | 'native';

export interface StackBlueprint {
  key: StackKey;
  label: string;
  ideName: string;
  storageEngine: string;
  statePattern: string;
  uiToolkit: string;
  offlineGuarantee: string;
  modelCode: string;
  storageCode: string;
  stateCode: string;
}

export function buildStackBlueprints(): Record<StackKey, StackBlueprint> {
  const categoriesPython = EXPENSE_CATEGORIES.map((c) => `"${c}"`).join(', ');
  const categoriesTs = EXPENSE_CATEGORIES.map((c) => `'${c}'`).join(' | ');
  const methodsTs = PAYMENT_METHODS.map((m) => `'${m}'`).join(' | ');

  return {
    python: {
      key: 'python',
      label: 'Python (SQLite + Dataclasses)',
      ideName: 'PyCharm / VS Code',
      storageEngine: 'sqlite3 (WAL Mode) + JSON',
      statePattern: 'Immutable Store + Pure Reducers',
      uiToolkit: 'Flet / BeeWare / FastAPI Local',
      offlineGuarantee: 'ACID-compliant local .db file with zero network dependency',
      modelCode: `from dataclasses import dataclass, asdict
from datetime import date
from typing import Literal
import json

Category = Literal[${categoriesPython}]

@dataclass(frozen=True)
class ExpenseRecord:
    id: str
    title: str
    merchant: str
    amount: float
    category: Category
    payment_method: str
    date: str  # YYYY-MM-DD
    note: str = ""

    def validate(self) -> None:
        if not self.title.strip():
            raise ValueError("Title is required")
        if self.amount <= 0:
            raise ValueError("Amount must be greater than zero")
        date.fromisoformat(self.date)

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2)`,
      storageCode: `import sqlite3
from pathlib import Path

DB_PATH = Path.home() / ".ledgerflow" / "expenses.db"

def init_local_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            merchant TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            category TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT DEFAULT ''
        );
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_exp_date ON expenses(date DESC);")
    conn.commit()
    return conn`,
      stateCode: `def reduce_totals(records: list[ExpenseRecord], category: str = "All") -> dict:
    filtered = [
        r for r in records
        if category == "All" or r.category == category
    ]
    total = round(sum(r.amount for r in filtered), 2)
    avg = round(total / len(filtered), 2) if filtered else 0.0
    return {
        "count": len(filtered),
        "total": total,
        "average": avg,
        "records": filtered,
    }`,
    },
    dart: {
      key: 'dart',
      label: 'Dart / Flutter (Drift + Riverpod)',
      ideName: 'Android Studio / VS Code',
      storageEngine: 'Drift (SQLite) + SharedPreferences',
      statePattern: 'Riverpod StateNotifier',
      uiToolkit: 'Flutter Skia / Impeller 120Hz',
      offlineGuarantee: 'Native ARM SQLite FFI compiled directly into mobile binary',
      modelCode: `enum ExpenseCategory { ${EXPENSE_CATEGORIES.map((c) => c.toLowerCase()).join(', ')} }

class ExpenseRecord {
  final String id;
  final String title;
  final String merchant;
  final double amount;
  final ExpenseCategory category;
  final String paymentMethod;
  final DateTime date;
  final String note;

  const ExpenseRecord({
    required this.id,
    required this.title,
    required this.merchant,
    required this.amount,
    required this.category,
    required this.paymentMethod,
    required this.date,
    this.note = '',
  });

  factory ExpenseRecord.fromJson(Map<String, dynamic> json) => ExpenseRecord(
        id: json['id'] as String,
        title: json['title'] as String,
        merchant: json['merchant'] as String,
        amount: (json['amount'] as num).toDouble(),
        category: ExpenseCategory.values.byName((json['category'] as String).toLowerCase()),
        paymentMethod: json['paymentMethod'] as String,
        date: DateTime.parse(json['date'] as String),
        note: (json['note'] as String?) ?? '',
      );
}`,
      storageCode: `import 'package:drift/drift.dart';

class Expenses extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 80)();
  TextColumn get merchant => text().withLength(min: 1, max: 60)();
  RealColumn get amount => real()();
  TextColumn get category => text()();
  TextColumn get paymentMethod => text()();
  TextColumn get date => text()();
  TextColumn get note => text().withDefault(const Constant(''))();

  @override
  Set<Column> get primaryKey => {id};
}`,
      stateCode: `class ExpenseLedgerNotifier extends Notifier<LedgerState> {
  @override
  LedgerState build() => const LedgerState.initial();

  void addExpense(ExpenseRecord record) {
    if (record.amount <= 0 || record.title.trim().isEmpty) return;
    final next = [record, ...state.expenses];
    state = state.copyWith(
      expenses: next,
      totalSpent: next.fold(0.0, (sum, e) => sum + e.amount),
    );
  }
}`,
    },
    typescript: {
      key: 'typescript',
      label: 'TypeScript / React (IndexedDB + Reducer)',
      ideName: 'VS Code / WebStorm',
      storageEngine: 'IndexedDB + Service Worker Cache',
      statePattern: 'Pure useReducer + Typed Actions',
      uiToolkit: 'React 19 + Tailwind CSS + PWA',
      offlineGuarantee: 'Workbox precache + browser-native IndexedDB transaction store',
      modelCode: `export type ExpenseCategory = ${categoriesTs};
export type PaymentMethod = ${methodsTs};

export interface ExpenseRecord {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  note: string;
}`,
      storageCode: `export async function persistExpenses(records: ExpenseRecord[]): Promise<void> {
  const db = await openIndexedDb('LedgerFlowDB', 1);
  const tx = db.transaction(['expenses'], 'readwrite');
  const store = tx.objectStore('expenses');
  store.clear();
  for (const record of records) {
    store.put(record);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}`,
      stateCode: `export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [action.payload, ...state.expenses],
      };
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    default:
      return state;
  }
}`,
    },
    native: {
      key: 'native',
      label: 'Native IDEs (SwiftData / Kotlin Room)',
      ideName: 'Xcode 16 & Android Studio',
      storageEngine: 'SwiftData (iOS) / Room SQLite (Android)',
      statePattern: 'Observable ViewModel + Unidirectional Flow',
      uiToolkit: 'SwiftUI & Jetpack Compose',
      offlineGuarantee: 'Zero-latency hardware-accelerated local persistence',
      modelCode: `// Kotlin (Android Room)
@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey val id: String,
    val title: String,
    val merchant: String,
    val amount: Double,
    val category: String,
    val paymentMethod: String,
    val isoDate: String,
    val note: String = ""
)`,
      storageCode: `// Kotlin Room DAO
@Dao
interface ExpenseDao {
    @Query("SELECT * FROM expenses ORDER BY isoDate DESC")
    fun observeAll(): Flow<List<ExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(expense: ExpenseEntity)

    @Query("SELECT SUM(amount) FROM expenses WHERE category = :category")
    fun totalByCategory(category: String): Flow<Double?>
}`,
      stateCode: `// SwiftUI @Observable Store (Xcode)
@Observable
final class LedgerViewModel {
    var expenses: [ExpenseEntity] = []
    var selectedCategory: String = "All"

    var filteredTotal: Double {
        expenses
            .filter { selectedCategory == "All" || $0.category == selectedCategory }
            .reduce(0) { $0 + $1.amount }
    }
}`,
    },
  };
}
