import { type ReactElement } from 'react';
import { formatCurrency, formatCompact } from '../utils/formatters';

interface BudgetCardProps {
  title: string;
  description: string;
  budgeted: number;
  spent: number;
  color: 'blue' | 'rose' | 'emerald';
  icon: ReactElement;
}

const bgColors: Record<BudgetCardProps['color'], string> = {
  blue: 'bg-blue-500',
  rose: 'bg-rose-400',
  emerald: 'bg-emerald-400',
};

const textColors: Record<BudgetCardProps['color'], string> = {
  blue: 'text-blue-600',
  rose: 'text-rose-500',
  emerald: 'text-emerald-500',
};

const lightBgs: Record<BudgetCardProps['color'], string> = {
  blue: 'bg-blue-50',
  rose: 'bg-rose-50',
  emerald: 'bg-emerald-50',
};

export function BudgetCard({ title, description, budgeted, spent, color, icon }: BudgetCardProps) {
  const percentage = Math.min(100, Math.round((spent / budgeted) * 100)) || 0;
  const isOver = spent > budgeted;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-8">
        <div
          className={`w-14 h-14 rounded-2xl ${lightBgs[color]} ${textColors[color]} flex items-center justify-center shrink-0 shadow-sm`}
        >
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Limit</p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-white">{formatCompact(budgeted)}</p>
        </div>
      </div>
      <div className="mb-8 flex-1">
        <h4 className="font-extrabold text-slate-800 text-xl mb-2 tracking-tight">{title}</h4>
        <p className="text-[15px] text-slate-500 leading-relaxed font-medium">{description}</p>
      </div>
      <div>
        <div className="flex justify-between text-[15px] font-bold mb-3">
          <span className={isOver ? 'text-rose-500' : 'text-slate-800'}>
            {formatCompact(spent)} spent
          </span>
          <span className="text-slate-400">{percentage}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full ${isOver ? 'bg-rose-500' : bgColors[color]} transition-all duration-1000 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {isOver && (
          <p className="text-[14px] text-rose-500 font-bold mt-3">
            Over budget by {formatCurrency(spent - budgeted)}
          </p>
        )}
      </div>
    </div>
  );
}
