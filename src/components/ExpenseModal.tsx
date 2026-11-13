import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  type ExpenseDraft,
  type ExpenseRecord,
  PAYMENT_METHODS,
} from '../types/expense';
import { DEFAULT_REFERENCE_DATE, validateExpenseInput } from '../logic/expenseRules';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense: ExpenseRecord | null;
  onClose: () => void;
  onSave: (draft: ExpenseDraft, existingId?: string) => void;
}

const EMPTY_DRAFT: ExpenseDraft = {
  title: '',
  merchant: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'Card',
  date: DEFAULT_REFERENCE_DATE,
  note: '',
};

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  editingExpense,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<ExpenseDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseDraft, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      setDraft({
        title: editingExpense.title,
        merchant: editingExpense.merchant,
        amount: editingExpense.amount.toFixed(2),
        category: editingExpense.category,
        paymentMethod: editingExpense.paymentMethod,
        date: editingExpense.date,
        note: editingExpense.note,
      });
    } else {
      setDraft(EMPTY_DRAFT);
    }
    setErrors({});
    setSubmitted(false);
  }, [isOpen, editingExpense]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const result = validateExpenseInput(draft);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    onSave(draft, editingExpense?.id);
    onClose();
  };

  const handleChange = <K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (submitted) {
      const check = validateExpenseInput(next);
      setErrors(check.errors);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div className="w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white p-6 sm:rounded-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 id="expense-modal-title" className="text-lg font-semibold text-slate-900">
              {editingExpense ? 'Edit Expense' : 'Log Expense'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Validated against ExpenseRecord schema and stored locally.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expense dialog"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="expense-title" className="block text-sm font-medium text-slate-800">
              Title
            </label>
            <input
              id="expense-title"
              type="text"
              required
              value={draft.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Metro Transit Pass"
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none"
            />
            {errors.title && (
              <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expense-merchant" className="block text-sm font-medium text-slate-800">
                Merchant
              </label>
              <input
                id="expense-merchant"
                type="text"
                required
                value={draft.merchant}
                onChange={(e) => handleChange('merchant', e.target.value)}
                placeholder="e.g., City Transit"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none"
              />
              {errors.merchant && (
                <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                  {errors.merchant}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-800">
                Amount (USD)
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={draft.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none"
              />
              {errors.amount && (
                <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="expense-category" className="block text-sm font-medium text-slate-800">
                Category
              </label>
              <select
                id="expense-category"
                value={draft.category}
                onChange={(e) => handleChange('category', e.target.value as ExpenseDraft['category'])}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-700 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="expense-method" className="block text-sm font-medium text-slate-800">
                Payment Method
              </label>
              <select
                id="expense-method"
                value={draft.paymentMethod}
                onChange={(e) =>
                  handleChange('paymentMethod', e.target.value as ExpenseDraft['paymentMethod'])
                }
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-700 focus:outline-none"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.paymentMethod && (
                <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                  {errors.paymentMethod}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-sm font-medium text-slate-800">
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                required
                value={draft.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-indigo-700 focus:outline-none"
              />
              {errors.date && (
                <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="expense-note" className="block text-sm font-medium text-slate-800">
              Note (optional)
            </label>
            <input
              id="expense-note"
              type="text"
              value={draft.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Receipt details or budget context"
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none"
            />
            {errors.note && (
              <p className="mt-1 text-xs font-medium text-rose-700" role="alert">
                {errors.note}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-indigo-700 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            >
              {editingExpense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
