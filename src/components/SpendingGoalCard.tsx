import { Target, Pencil, Trash2 } from 'lucide-react';
import { formatCompact } from '../utils/formatters';
import type { SpendingGoal } from '../utils/validation';

interface SpendingGoalCardProps {
  goal: SpendingGoal;
  onEdit: (goal: SpendingGoal) => void;
  onDelete: (id: number) => void;
}

export function SpendingGoalCard({ goal, onEdit, onDelete }: SpendingGoalCardProps) {
  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center text-2xl shadow-sm border border-amber-100 dark:border-amber-800">
            {goal.icon}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 dark:text-white text-[15px]">{goal.title}</h4>
            <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {formatCompact(goal.currentAmount)} of {formatCompact(goal.targetAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(goal)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all" title="Edit goal">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(goal.id)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all" title="Delete goal">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner mb-3">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-blue-400'
          }`}
          style={{ width: `${pct}%` }}
        />
        {pct > 0 && pct < 100 && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[13px] font-extrabold text-slate-800 dark:text-white">{pct}%</span>
        {remaining > 0 ? (
          <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">{formatCompact(remaining)} to go</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            <Target size={14} />
            Goal reached!
          </span>
        )}
      </div>
    </div>
  );
}