import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ObjectiveProgress } from '../types/expense';
import { buildStackBlueprints, type StackKey } from '../data/crossPlatformTemplates';

interface ArchitecturePageProps {
  objectives: ObjectiveProgress[];
  onToggleObjective: (id: number) => void;
}

const STACK_KEYS: StackKey[] = ['python', 'dart', 'typescript', 'native'];

export const ArchitecturePage: React.FC<ArchitecturePageProps> = ({
  objectives,
  onToggleObjective,
}) => {
  const blueprints = useMemo(() => buildStackBlueprints(), []);
  const [activeStack, setActiveStack] = useState<StackKey>('python');
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);

  const current = blueprints[activeStack];

  const handleCopy = async (slot: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSlot(slot);
      setTimeout(() => setCopiedSlot((prev) => (prev === slot ? null : prev)), 1500);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Objectives Checklist (from Reference) */}
      <section aria-label="Key learning and engineering objectives" className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Key Engineering Objectives
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Track completion across language baselines, local storage, expense ledger logic, and schema design.
            </p>
          </div>
          <span className="font-mono text-xs font-medium tabular-nums text-slate-600">
            {objectives.filter((o) => o.completed).length} of {objectives.length} completed
          </span>
        </div>

        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {objectives.map((obj) => (
            <li key={obj.id}>
              <button
                type="button"
                onClick={() => onToggleObjective(obj.id)}
                aria-pressed={obj.completed}
                className={`flex min-h-[72px] w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors ${
                  obj.completed
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold tabular-nums ${
                    obj.completed
                      ? 'bg-indigo-700 text-white'
                      : 'border border-slate-300 bg-slate-50 text-rose-700'
                  }`}
                >
                  {obj.completed ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : obj.id}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{obj.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{obj.description}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Cross-Platform & Native IDE Stack Workbench */}
      <section aria-label="Cross-platform architecture workbench" className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Cross-Platform App Logic & Local Data Blueprints
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Inspect equivalent schema, local database, and state management baselines across Python, Dart/Flutter, TypeScript, and Native IDEs.
          </p>

          <div
            role="tablist"
            aria-label="Select target framework or language"
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            {STACK_KEYS.map((key) => {
              const bp = blueprints[key];
              const isSelected = activeStack === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveStack(key)}
                  className={`min-h-[40px] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {bp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stack Metadata Grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 border-b border-slate-100 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Native / Cross-Platform IDE</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{current.ideName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Local Storage Engine</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{current.storageEngine}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">State Management Baseline</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{current.statePattern}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">High-Performance UI Layer</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{current.uiToolkit}</p>
          </div>
        </div>

        {/* Synchronized Code Blocks */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[
            { id: 'model', title: '01. Data Model & Schema', code: current.modelCode, wide: false },
            { id: 'storage', title: '02. Local Database Persistence', code: current.storageCode, wide: false },
            { id: 'state', title: '03. State Logic & Totals', code: current.stateCode, wide: true },
          ].map((block) => (
            <div
              key={block.id}
              className={`flex flex-col rounded-xl border border-slate-200 bg-slate-950 ${
                block.wide ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                <h3 className="text-xs font-semibold text-slate-200">{block.title}</h3>
                <button
                  type="button"
                  onClick={() => handleCopy(block.id, block.code)}
                  aria-label={`Copy ${block.title} code`}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {copiedSlot === block.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="flex-1 overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-100">
                <code>{block.code}</code>
              </pre>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Offline Architecture Guarantee: {current.offlineGuarantee}
        </p>
      </section>
    </div>
  );
};
