import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, RefreshCw, RotateCcw, Upload, AlertCircle } from 'lucide-react';
import type { ExpenseFilterState, ExpenseRecord } from '../types/expense';
import {
  buildSqliteEquivalentQuery,
  exportExpensesToCsv,
  validateExpenseListJson,
} from '../logic/expenseRules';
import { getStorageMetrics, type StorageMetrics } from '../storage/localDb';

interface LocalDbPageProps {
  expenses: ExpenseRecord[];
  filters: ExpenseFilterState;
  onReplaceExpenses: (records: ExpenseRecord[]) => void;
  onResetSeed: () => void;
}

export const LocalDbPage: React.FC<LocalDbPageProps> = ({
  expenses,
  filters,
  onReplaceExpenses,
  onResetSeed,
}) => {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [jsonText, setJsonText] = useState<string>(() => JSON.stringify(expenses, null, 2));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    setJsonText(JSON.stringify(expenses, null, 2));
    void getStorageMetrics(expenses).then(setMetrics);
  }, [expenses]);

  const handleRefreshMetrics = () => {
    void getStorageMetrics(expenses).then(setMetrics);
    setStatusMessage('Storage metrics refreshed from local device stores.');
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setValidationErrors([]);
      setStatusMessage('JSON formatted cleanly.');
    } catch (err) {
      setValidationErrors([
        `JSON syntax error: ${err instanceof Error ? err.message : 'Unable to parse JSON.'}`,
      ]);
      setStatusMessage('');
    }
  };

  const handleValidateAndImport = () => {
    const check = validateExpenseListJson(jsonText);
    if (!check.valid) {
      setValidationErrors(check.errors);
      setStatusMessage('');
      return;
    }
    setValidationErrors([]);
    onReplaceExpenses(check.records);
    setStatusMessage(`Validated and saved ${check.records.length} records to IndexedDB.`);
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    triggerDownload('ledgerflow-expenses.json', JSON.stringify(expenses, null, 2), 'application/json');
    setStatusMessage('Exported JSON dataset.');
  };

  const handleExportCsv = () => {
    triggerDownload('ledgerflow-expenses.csv', exportExpensesToCsv(expenses), 'text/csv;charset=utf-8');
    setStatusMessage('Exported CSV ledger.');
  };

  const sqlEquivalent = buildSqliteEquivalentQuery(filters);

  return (
    <div className="space-y-6">
      {/* Device Storage Metrics */}
      <section aria-label="Local device storage metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Storage Engine</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {metrics?.engine ?? 'IndexedDB'}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">{metrics?.dbName ?? 'LedgerFlowDB'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">IndexedDB Payload</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {metrics ? `${metrics.indexedDbBytes.toLocaleString()} B` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {expenses.length} structured records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">LocalStorage Backup</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {metrics ? `${metrics.localStorageBytes.toLocaleString()} B` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Synchronous fallback mirror</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Offline Asset Cache</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {metrics ? metrics.cacheEntries : 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics?.serviceWorkerActive ? 'Service worker active' : 'PWA cache ready on build'}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live JSON Processing & Schema Validator */}
        <section
          aria-label="JSON processing and schema validation"
          className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                JSON Serialization & Schema Validator
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Inspect or edit raw serialized ExpenseRecord JSON, validate types, and commit to IndexedDB.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleFormatJson}
                className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Format JSON
              </button>
              <button
                type="button"
                onClick={handleValidateAndImport}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-indigo-700 px-3.5 text-xs font-medium text-white hover:bg-indigo-800"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Validate & Import
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="json-editor-textarea" className="sr-only">
              Expense records JSON payload
            </label>
            <textarea
              id="json-editor-textarea"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              rows={14}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-indigo-700 focus:bg-white focus:outline-none"
            />
          </div>

          {validationErrors.length > 0 && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900"
            >
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" aria-hidden="true" />
                <span>Schema validation failed ({validationErrors.length} issue{validationErrors.length === 1 ? '' : 's'})</span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-mono">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {statusMessage && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-900"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshMetrics}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Refresh Metrics
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetSeed();
                  setValidationErrors([]);
                  setStatusMessage('Restored baseline seed dataset in IndexedDB.');
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset Seed Data
              </button>
            </div>
          </div>
        </section>

        {/* SQLite / IndexedDB Query Equivalence */}
        <section
          aria-label="Local query mapping"
          className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Local Database Query Mapping
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Live SQLite query equivalent generated from your current Expense Ledger filter state.
            </p>
          </div>

          <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{sqlEquivalent}</code>
          </pre>

          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <div>
              <h3 className="font-semibold text-slate-900">Object Store Indexes</h3>
              <p className="mt-1">
                Primary key <code className="font-mono text-indigo-700">id</code> with secondary indexes on{' '}
                <code className="font-mono text-indigo-700">date</code> and{' '}
                <code className="font-mono text-indigo-700">category</code> for instant offline range scans.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Schema Invariants</h3>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>Every record requires a unique non-empty <code className="font-mono">id</code>.</li>
                <li>Amount must be finite, positive, and rounded to 2 decimal places.</li>
                <li>Dates validate against strict Gregorian <code className="font-mono">YYYY-MM-DD</code> calendars.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
