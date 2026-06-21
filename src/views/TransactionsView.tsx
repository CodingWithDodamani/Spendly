import { useState, useMemo } from 'react';
import { FileText, Search, Filter, Trash2, Pencil, X } from 'lucide-react';
import type { Transaction } from '../utils/validation';
import { InfoTooltip } from '../components/InfoTooltip';
import { TransactionRow } from '../components/TransactionRow';

interface TransactionsViewProps {
  transactions: Transaction[];
  isFirstTime: boolean;
  onDelete: (id: number) => void;
  onEdit: (tx: Transaction) => void;
}

type FilterType = 'all' | 'income' | 'expense' | 'Needs' | 'Wants' | 'Savings';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'Needs', label: 'Needs' },
  { value: 'Wants', label: 'Wants' },
  { value: 'Savings', label: 'Savings' },
];

/** Format a YYYY-MM-DD string into a friendly label */
function formatDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-IN', { weekday: 'long' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TransactionsView({ transactions, isFirstTime, onDelete, onEdit }: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Filter & search
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeFilter === 'income' && tx.type !== 'income') return false;
      if (activeFilter === 'expense' && tx.type !== 'expense') return false;
      if (['Needs', 'Wants', 'Savings'].includes(activeFilter) && tx.budgetCategory !== activeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.paymentMode && tx.paymentMode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; date: string; txs: Transaction[] }[] = [];
    let lastDate = '';
    filtered.forEach((tx) => {
      if (tx.date !== lastDate) {
        lastDate = tx.date;
        groups.push({ label: formatDateLabel(tx.date), date: tx.date, txs: [] });
      }
      groups[groups.length - 1].txs.push(tx);
    });
    return groups;
  }, [filtered]);

  const handleDelete = (id: number) => {
    onDelete(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[60vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center tracking-tight">
            History
            <InfoTooltip text="Everything you've bought, paid, or earned in one place. Use search and filters to find specific entries." />
          </h3>
          {!isFirstTime && (
            <p className="text-slate-400 text-sm font-medium mt-1">
              {filtered.length} of {transactions.length} entries
            </p>
          )}
        </div>
      </div>

      {isFirstTime ? (
        <div className="text-center py-24">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6 mx-auto">
            <FileText size={40} />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Nothing here yet</h4>
          <p className="text-slate-500 text-lg">Tap the big + button below to log your first entry.</p>
        </div>
      ) : (
        <>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-semibold text-[15px] focus:ring-0 focus:bg-white transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Filter size={16} className="text-slate-400" />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as FilterType)}
                title="Filter transactions"
                aria-label="Filter transactions"
                className="block pl-10 pr-8 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-semibold text-[15px] focus:ring-0 outline-none appearance-none cursor-pointer"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pill */}
          {activeFilter !== 'all' && (
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[13px] font-bold border border-emerald-100">
                Showing: {FILTER_OPTIONS.find(o => o.value === activeFilter)?.label}
                <button onClick={() => setActiveFilter('all')} className="ml-1 hover:text-emerald-900" title="Clear filter" aria-label="Clear filter">
                  <X size={14} />
                </button>
              </span>
            </div>
          )}

          {/* Grouped Transaction List */}
          {grouped.length > 0 ? (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {group.label}
                    </h4>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <div className="space-y-1">
                    {group.txs.map((tx) => (
                      <div key={tx.id} className="group relative">
                        <TransactionRow tx={tx} />
                        {/* Action buttons on hover */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                          {confirmDeleteId === tx.id ? (
                            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 shadow-sm">
                              <span className="text-[12px] font-bold text-rose-600">Delete?</span>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[11px] font-bold hover:bg-rose-600 transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 bg-white text-slate-600 rounded-lg text-[11px] font-bold border border-slate-200 hover:bg-slate-50 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => onEdit(tx)}
                                className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all"
                                title="Edit transaction"
                                aria-label="Edit transaction"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(tx.id)}
                                className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                                title="Delete transaction"
                                aria-label="Delete transaction"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 mx-auto">
                <Search size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1 tracking-tight">No matches found</h4>
              <p className="text-slate-500">Try adjusting your search or filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
