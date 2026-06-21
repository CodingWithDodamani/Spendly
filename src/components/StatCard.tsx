import { type ReactElement } from 'react';
import { formatCurrency } from '../utils/formatters';
import { InfoTooltip } from './InfoTooltip';

interface StatCardProps {
  title: string;
  amount: number;
  icon: ReactElement;
  tooltip: string;
  color: 'emerald' | 'rose' | 'blue';
  className?: string;
}

const colorStyles: Record<StatCardProps['color'], string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-500',
  blue: 'bg-blue-50 text-blue-500',
};

export function StatCard({ title, amount, icon, tooltip, color, className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-shadow duration-300 hover:shadow-md ${className}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold uppercase tracking-wider mb-1 flex items-center">
          {title}
          <InfoTooltip text={tooltip} />
        </p>
        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          {formatCurrency(amount)}
        </h3>
      </div>
    </div>
  );
}
