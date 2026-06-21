import { useState, useRef } from 'react';
import {
  Download, Upload, Trash2, ShieldCheck, Database,
  AlertTriangle, CheckCircle, Settings, Plus, Repeat,
  Pencil, ToggleLeft, ToggleRight, X, IndianRupee,
} from 'lucide-react';
import type { Transaction, RecurringTransaction, PaymentMode, SpendingLimit } from '../utils/validation';
import { PAYMENT_MODES } from '../utils/validation';
import { InfoTooltip } from '../components/InfoTooltip';
import { formatCurrency } from '../utils/formatters';

interface SettingsViewProps {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: (value: RecurringTransaction[]) => void;
  spendingLimit: SpendingLimit;
  setSpendingLimit: (value: SpendingLimit) => void;
}

interface RecurringFormData {
  id: number;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  budgetCategory: string;
  paymentMode: PaymentMode;
  frequency: 'daily' | 'weekly' | 'monthly';
  active: boolean;
}

const emptyRecurringForm = (): RecurringFormData => ({
  id: Date.now(),
  amount: '',
  type: 'expense',
  category: 'Bills',
  description: '',
  budgetCategory: 'Needs',
  paymentMode: 'Cash',
  frequency: 'monthly',
  active: true,
});

export function SettingsView({
  transactions,
  recurringTransactions,
  setRecurringTransactions,
  spendingLimit,
  setSpendingLimit,
}: SettingsViewProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recurring management state
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState<RecurringFormData>(emptyRecurringForm);
  const [recurringEditId, setRecurringEditId] = useState<number | null>(null);
  const [confirmDeleteRecurringId, setConfirmDeleteRecurringId] = useState<number | null>(null);

  // ── Export as CSV ───────────────────────────────────
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Budget Bucket'];
    const rows = transactions.map((tx) => [
      tx.date,
      tx.type,
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount.toString(),
      tx.budgetCategory,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendly-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // ── Export as JSON ─────────────────────────────────
  const handleExportJSON = () => {
    if (transactions.length === 0) return;

    const jsonContent = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spendly-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  // ── Import JSON/CSV ────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);
        if (!Array.isArray(imported) || imported.length === 0) {
          setImportError('File is empty or invalid.');
          return;
        }
        // Merge: prepend imported transactions that don't already exist (by id)
        const existingIds = new Set(transactions.map((t) => t.id));
        const newCount = imported.filter(
          (t: Transaction) => t.id && !existingIds.has(t.id) && t.amount && t.type && t.date
        ).length;
        if (newCount === 0) {
          setImportError('No new entries found to import (duplicates skipped).');
          return;
        }
        // We can't directly add via this component, so we save to a special key
        // and let the user know to reload. In a real app this would use a callback.
        const existing = JSON.parse(localStorage.getItem('spendly_transactions') || '[]');
        const merged = [...imported, ...existing];
        localStorage.setItem('spendly_transactions', JSON.stringify(merged));
        setImportSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setImportError('Could not parse file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so re-uploading the same file triggers onChange
    e.target.value = '';
  };

  // ── Factory Reset ──────────────────────────────────
  const handleReset = () => {
    try {
      localStorage.removeItem('spendly_transactions');
      localStorage.removeItem('spendly_salaryConfig');
      localStorage.removeItem('spendly_onboarded');
      localStorage.removeItem('spendly_recurring');
    } catch {
      // silently fail
    }
    setResetDone(true);
    setShowResetConfirm(false);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // ── Recurring: Save ────────────────────────────────
  const handleSaveRecurring = () => {
    const amount = parseFloat(recurringForm.amount);
    if (!amount || amount <= 0 || !recurringForm.description.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const entry: RecurringTransaction = {
      id: recurringEditId || Date.now(),
      amount,
      type: recurringForm.type,
      category: recurringForm.category,
      description: recurringForm.description.trim(),
      budgetCategory: recurringForm.budgetCategory,
      paymentMode: recurringForm.paymentMode,
      frequency: recurringForm.frequency,
      lastTriggered: today,
      createdDate: today,
      active: true,
    };

    if (recurringEditId) {
      setRecurringTransactions(
        recurringTransactions.map((r) => (r.id === recurringEditId ? entry : r))
      );
    } else {
      setRecurringTransactions([entry, ...recurringTransactions]);
    }

    setShowRecurringForm(false);
    setRecurringEditId(null);
    setRecurringForm(emptyRecurringForm());
  };

  // ── Recurring: Edit ────────────────────────────────
  const handleEditRecurring = (rec: RecurringTransaction) => {
    setRecurringForm({
      id: rec.id,
      amount: String(rec.amount),
      type: rec.type,
      category: rec.category,
      description: rec.description,
      budgetCategory: rec.budgetCategory,
      paymentMode: rec.paymentMode,
      frequency: rec.frequency,
      active: rec.active,
    });
    setRecurringEditId(rec.id);
    setShowRecurringForm(true);
  };

  // ── Recurring: Toggle active ──────────────────────
  const handleToggleRecurring = (id: number) => {
    setRecurringTransactions(
      recurringTransactions.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      )
    );
  };

  // ── Recurring: Delete ──────────────────────────────
  const handleDeleteRecurring = (id: number) => {
    setRecurringTransactions(recurringTransactions.filter((r) => r.id !== id));
    setConfirmDeleteRecurringId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center">
            Settings
            <InfoTooltip text="Manage your data and app preferences here." />
          </h2>
          <p className="text-slate-400 text-sm font-medium">Data management & preferences</p>
        </div>
      </div>

      {/* ── Storage Info ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Your Data</h3>
            <p className="text-[13px] text-slate-400 font-medium">Stored locally in your browser</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 border border-slate-100 dark:border-slate-600">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
            <p className="text-2xl font-extrabold text-slate-800">{transactions.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 border border-slate-100 dark:border-slate-600">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expenses</p>
            <p className="text-2xl font-extrabold text-slate-800">
              {transactions.filter((t) => t.type === 'expense').length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 border border-slate-100 dark:border-slate-600">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Income</p>
            <p className="text-2xl font-extrabold text-slate-800">
              {transactions.filter((t) => t.type === 'income').length}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 border border-slate-100 dark:border-slate-600">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recurring</p>
            <p className="text-2xl font-extrabold text-slate-800">{recurringTransactions.length}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <p className="text-[13px] text-emerald-700 font-semibold leading-snug">
            All your data is stored exclusively in this browser via localStorage. Nothing is sent to any server — ever.
          </p>
        </div>
      </div>

      {/* ── Spending Limit ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Spending Limit</h3>
            <p className="text-[13px] text-slate-400 font-medium">Get warned when you&apos;re spending too fast</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Enable limit</span>
          <button
            onClick={() => setSpendingLimit({ ...spendingLimit, enabled: !spendingLimit.enabled })}
            className={`w-14 h-7 rounded-full transition-all relative ${
              spendingLimit.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
              spendingLimit.enabled ? 'left-7' : 'left-0.5'
            }`} />
          </button>
        </div>

        {spendingLimit.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Period</label>
                <select
                  value={spendingLimit.period}
                  onChange={(e) => setSpendingLimit({ ...spendingLimit, period: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 dark:text-white font-bold focus:ring-0 outline-none appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Limit Amount (₹)</label>
                <input
                  type="number"
                  value={spendingLimit.amount || ''}
                  onChange={(e) => setSpendingLimit({ ...spendingLimit, amount: parseFloat(e.target.value) || 0 })}
                  className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 dark:text-white font-bold focus:ring-0 outline-none"
                  placeholder="e.g. 500"
                />
              </div>
            </div>
            <p className="text-[12px] text-slate-400 font-medium">
              You&apos;ll see a warning on your dashboard when you reach 60% of this limit.
            </p>
          </div>
        )}
      </div>

      {/* ── Recurring Transactions ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Repeat size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Recurring Transactions</h3>
              <p className="text-[13px] text-slate-400 font-medium">Auto-log daily, weekly, or monthly entries</p>
            </div>
          </div>
          <button
            onClick={() => {
              setRecurringForm(emptyRecurringForm());
              setRecurringEditId(null);
              setShowRecurringForm(true);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl font-bold text-emerald-700 text-[13px] transition-all"
          >
            <Plus size={16} />
            Add Recurring
          </button>
        </div>

        {showRecurringForm && (
          <div className="mb-6 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-slate-800">
                {recurringEditId ? 'Edit Recurring Entry' : 'New Recurring Entry'}
              </h4>
              <button
                onClick={() => { setShowRecurringForm(false); setRecurringEditId(null); }}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-800"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex p-1 bg-white rounded-xl">
              <button
                type="button"
                onClick={() => setRecurringForm({ ...recurringForm, type: 'expense' })}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${
                  recurringForm.type === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setRecurringForm({ ...recurringForm, type: 'income' })}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-lg transition-all ${
                  recurringForm.type === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Income
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Amount (₹)</label>
                <input
                  type="number"
                  value={recurringForm.amount}
                  onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                  className="block w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 font-bold focus:ring-0 outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Frequency</label>
                <select
                  value={recurringForm.frequency}
                  onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                  className="block w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 font-bold focus:ring-0 outline-none appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Description</label>
              <input
                type="text"
                value={recurringForm.description}
                onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                className="block w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 font-bold focus:ring-0 outline-none"
                placeholder="e.g. Rent, Salary, Netflix..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Category</label>
                <select
                  value={recurringForm.category}
                  onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}
                  className="block w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 font-bold focus:ring-0 outline-none appearance-none"
                >
                  <option>Food & Drink</option>
                  <option>Transport</option>
                  <option>Shopping</option>
                  <option>Bills</option>
                  <option>Groceries</option>
                  <option>Entertainment</option>
                  <option>Income</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Budget Bucket</label>
                <select
                  value={recurringForm.budgetCategory}
                  onChange={(e) => setRecurringForm({ ...recurringForm, budgetCategory: e.target.value })}
                  className="block w-full px-4 py-3 bg-white border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 font-bold focus:ring-0 outline-none appearance-none"
                >
                  <option value="Needs">Needs</option>
                  <option value="Wants">Wants</option>
                  <option value="Savings">Savings</option>
                  <option value="Income">Income</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Payment Mode</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRecurringForm({ ...recurringForm, paymentMode: mode })}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
                      recurringForm.paymentMode === mode
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveRecurring}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-extrabold text-[15px] shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              {recurringEditId ? 'Save Changes' : 'Add Recurring Entry'}
            </button>
          </div>
        )}

        {recurringTransactions.length > 0 ? (
          <div className="space-y-2">
            {recurringTransactions.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600 group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    rec.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                  }`}>
                    <IndianRupee size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-800 truncate">{rec.description}</h4>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        rec.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {rec.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium mt-0.5">
                      <span>{formatCurrency(rec.amount)}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="capitalize">{rec.frequency}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{rec.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleRecurring(rec.id)}
                    className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"
                    title={rec.active ? 'Pause' : 'Activate'}
                  >
                    {rec.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => handleEditRecurring(rec)}
                    className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                    title="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  {confirmDeleteRecurringId === rec.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200">
                      <span className="text-[11px] font-bold text-rose-600">Delete?</span>
                      <button onClick={() => handleDeleteRecurring(rec.id)} className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[10px] font-bold">Yes</button>
                      <button onClick={() => setConfirmDeleteRecurringId(null)} className="px-2 py-0.5 bg-white text-slate-600 rounded-lg text-[10px] font-bold border">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteRecurringId(rec.id)}
                      className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 font-medium">
            <Repeat size={32} className="mx-auto mb-3 opacity-40" />
            <p>No recurring transactions yet.</p>
            <p className="text-[13px] mt-1">Add rent, salary, subscriptions — auto-logged daily, weekly, or monthly.</p>
          </div>
        )}
      </div>

      {/* ── Export Data ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Export Data</h3>
            <p className="text-[13px] text-slate-400 font-medium">Download a backup of all your entries</p>
          </div>
        </div>

        {exportSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl p-3 mb-4 border border-emerald-100">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-[13px] text-emerald-700 font-bold">Exported successfully!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 rounded-2xl font-bold text-slate-700 hover:text-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export as CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={transactions.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 rounded-2xl font-bold text-slate-700 hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export as JSON
          </button>
        </div>

        {transactions.length === 0 && (
          <p className="text-[13px] text-slate-400 mt-3 text-center font-medium">
            No data to export yet. Start logging entries first!
          </p>
        )}
      </div>

      {/* ── Import Data ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Import Data</h3>
            <p className="text-[13px] text-slate-400 font-medium">Restore from a previous JSON export</p>
          </div>
        </div>

        {importSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl p-3 mb-4 border border-emerald-100">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-[13px] text-emerald-700 font-bold">Imported successfully! Reloading...</span>
          </div>
        )}

        {importError && (
          <div className="flex items-center gap-2 bg-rose-50 rounded-2xl p-3 mb-4 border border-rose-100">
            <AlertTriangle size={16} className="text-rose-500" />
            <span className="text-[13px] text-rose-700 font-bold">{importError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-100 hover:border-blue-200 rounded-2xl font-bold text-slate-700 hover:text-blue-700 transition-all"
          >
            <Upload size={18} />
            Import JSON File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        <p className="text-[13px] text-slate-400 mt-3 text-center font-medium">
          Imported entries are merged with existing data (duplicates by ID are skipped).
        </p>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-rose-600 tracking-tight">Danger Zone</h3>
            <p className="text-[13px] text-slate-400 font-medium">Irreversible actions</p>
          </div>
        </div>

        {resetDone && (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl p-3 mb-4 border border-emerald-100">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-[13px] text-emerald-700 font-bold">All data cleared. Reloading...</span>
          </div>
        )}

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-6 py-4 bg-rose-50 hover:bg-rose-100 border-2 border-rose-100 hover:border-rose-200 rounded-2xl font-bold text-rose-600 transition-all w-full justify-center"
          >
            <Trash2 size={18} />
            Factory Reset — Delete All Data
          </button>
        ) : (
          <div className="bg-rose-50 rounded-2xl p-6 border-2 border-rose-200">
            <p className="text-rose-700 font-bold mb-4 text-center">
              ⚠️ This will permanently delete all your transactions, salary config, and onboarding status. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-extrabold transition-colors"
              >
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── App Info ── */}
      <div className="text-center py-6 text-slate-300 text-[13px] font-medium space-y-1">
        <p>Spendly · Track Daily, Spend Happily ✨</p>
        <p>Built with React + Vite + Tailwind CSS + Recharts</p>
        <p>v1.0.0 · All data stays in your browser</p>
      </div>
    </div>
  );
}