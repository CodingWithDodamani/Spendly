import { TrendingUp, Target, Receipt } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Transaction } from '../utils/validation';

interface TransactionRowProps {
  tx: Transaction;
  compact?: boolean;
}

/**
 * A single transaction entry row.
 * Visually distinguishes income, savings transfers, and expenses.
 */
export function TransactionRow({ tx, compact = false }: TransactionRowProps) {
  const isIncome = tx.type === 'income';
  const isTransfer = tx.budgetCategory === 'Savings';

  return (
    <div
      className={`flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-[1.5rem] transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600 cursor-pointer ${
        compact ? 'py-3 p-3' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
            isIncome
              ? 'bg-emerald-100 text-emerald-600'
              : isTransfer
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-rose-100 text-rose-500'
          }`}
        >
          {isIncome ? <TrendingUp size={24} /> : isTransfer ? <Target size={24} /> : <Receipt size={24} />}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-extrabold text-slate-800 dark:text-white truncate pr-2 text-[16px]">
            {tx.description}
          </h4>
          <div className="flex items-center gap-2 text-[14px] text-slate-500 dark:text-slate-400 mt-1 font-medium flex-wrap">
            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg">{tx.category}</span>
            <span className="hidden sm:inline text-slate-400">{tx.budgetCategory}</span>
            {tx.paymentMode && tx.paymentMode !== 'Cash' && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline" />
                <span className="hidden sm:inline bg-slate-100 px-2 py-0.5 rounded-lg text-[12px]">
                  {tx.paymentMode}
                </span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline" />
            <span className="hidden sm:inline whitespace-nowrap">
              {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
      <div
        className={`font-extrabold shrink-0 pl-2 tracking-tight ${compact ? 'text-[16px]' : 'text-xl'} ${
          isIncome ? 'text-emerald-500' : 'text-slate-800 dark:text-white'
        }`}
      >
        {isIncome ? '+' : '-'}
        {formatCurrency(tx.amount)}
      </div>
    </div>
  );
}
