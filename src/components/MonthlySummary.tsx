import { useMemo } from 'react';
import { TrendingUp, TrendingDown, CalendarCheck, Award, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Transaction } from '../utils/validation';

interface MonthlySummaryProps {
  transactions: Transaction[];
}

export function MonthlySummary({ transactions }: MonthlySummaryProps) {
  const summary = useMemo(() => {
    const now = new Date();
    // Get previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthLabel = prevMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Current month
    const currMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Previous month stats
    let prevIncome = 0, prevExpenses = 0, prevSavings = 0;
    const prevCatMap: Record<string, number> = {};
    transactions.forEach((t) => {
      if (!t.date.startsWith(prevMonthKey)) return;
      if (t.type === 'income') prevIncome += t.amount;
      if (t.type === 'expense') {
        if (t.budgetCategory === 'Savings') {
          prevSavings += t.amount;
        } else {
          prevExpenses += t.amount;
          prevCatMap[t.category] = (prevCatMap[t.category] || 0) + t.amount;
        }
      }
    });

    // Current month stats (for comparison)
    let currExpenses = 0;
    transactions.forEach((t) => {
      if (!t.date.startsWith(currMonthKey)) return;
      if (t.type === 'expense' && t.budgetCategory !== 'Savings') currExpenses += t.amount;
    });

    // Top 3 categories
    const topCategories = Object.entries(prevCatMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));

    // Savings rate
    const savingsRate = prevIncome > 0 ? Math.round(((prevIncome - prevExpenses) / prevIncome) * 100) : 0;

    // Month-over-month change
    const changePercent = prevExpenses > 0 && currExpenses > 0
      ? Math.round(((currExpenses - prevExpenses) / prevExpenses) * 100)
      : null;

    const hasData = prevIncome > 0 || prevExpenses > 0;

    return {
      prevMonthLabel,
      prevIncome,
      prevExpenses,
      prevSavings,
      topCategories,
      savingsRate,
      changePercent,
      hasData,
      isGood: savingsRate >= 15,
    };
  }, [transactions]);

  if (!summary.hasData) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-violet-200 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <CalendarCheck size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight">Month in Review</h3>
            <p className="text-white/60 text-[13px] font-medium">{summary.prevMonthLabel}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Earned</p>
            <p className="text-lg font-extrabold">{formatCurrency(summary.prevIncome)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Spent</p>
            <p className="text-lg font-extrabold">{formatCurrency(summary.prevExpenses)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Saved</p>
            <p className="text-lg font-extrabold">{formatCurrency(summary.prevSavings)}</p>
          </div>
        </div>

        {/* Top Categories */}
        {summary.topCategories.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-3">Top Spending</p>
            <div className="flex flex-wrap gap-2">
              {summary.topCategories.map((cat, i) => (
                <span key={cat.name} className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[13px] font-bold border border-white/10">
                  <span className="text-yellow-200">{['🥇', '🥈', '🥉'][i]}</span>
                  {cat.name}
                  <span className="text-white/50 ml-1">{formatCurrency(cat.value)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verdict */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 border ${
          summary.isGood
            ? 'bg-emerald-500/20 border-emerald-400/20'
            : 'bg-amber-500/20 border-amber-400/20'
        }`}>
          {summary.isGood ? (
            <Award size={24} className="text-emerald-300 shrink-0" />
          ) : (
            <AlertTriangle size={24} className="text-amber-300 shrink-0" />
          )}
          <div>
            <p className="font-extrabold text-[15px]">
              {summary.isGood
                ? `You saved ${summary.savingsRate}% of income! 🎉`
                : summary.savingsRate > 0
                  ? `You saved ${summary.savingsRate}% — try for 20%+ next month`
                  : 'You overspent last month ⚠️'
              }
            </p>
            {summary.changePercent !== null && (
              <p className="text-white/50 text-[13px] font-medium mt-0.5 flex items-center gap-1">
                {summary.changePercent > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {summary.changePercent > 0 ? '+' : ''}{summary.changePercent}% vs this month so far
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
