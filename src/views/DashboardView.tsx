import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Wallet, Activity, Sparkles, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { tokens } from '../utils/colors';
import type { Transaction, SpendingGoal, SpendingLimit } from '../utils/validation';
import { InfoTooltip } from '../components/InfoTooltip';
import { StatCard } from '../components/StatCard';
import { TransactionRow } from '../components/TransactionRow';
import { EmptyPlaceholder } from '../components/EmptyPlaceholder';
import { MonthlySummary } from '../components/MonthlySummary';
import { SpendingGoalCard } from '../components/SpendingGoalCard';

interface Stats {
  income: number;
  expenses: number;
  savings: number;
  balance: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface DashboardViewProps {
  stats: Stats;
  transactions: Transaction[];
  expensesByCategory: CategoryData[];
  isFirstTime: boolean;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: number) => void;
  goals?: SpendingGoal[];
  spendingLimit?: SpendingLimit;
}

export function DashboardView({
  stats,
  transactions,
  expensesByCategory,
  isFirstTime,
  onEdit,
  onDelete,
  goals = [],
  spendingLimit,
}: DashboardViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    onDelete?.(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ━━━ First-time Welcome Banner ━━━ */}
      {isFirstTime && (
        <div className="relative rounded-[2.5rem] overflow-hidden shadow-lg">
          {/* Gradient background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-transparent to-yellow-300/20" />

          {/* Floating decorative shapes */}
          <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute right-20 bottom-10 w-24 h-24 bg-yellow-300/15 rounded-full blur-xl" />

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

          {/* Content */}
          <div className="relative z-10 p-5 md:p-12 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8">
            <div className="text-center md:text-left max-w-2xl">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-5">
                <Sparkles size={14} className="text-yellow-200" />
                <span className="text-white/90 text-[13px] font-bold tracking-wide uppercase">Your Money, Your Rules</span>
              </div>

              {/* Hero heading with gradient text */}
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.15] tracking-tight mb-5">
                <span className="text-white">Every </span>
                <span className="text-yellow-200">₹10 chai</span>
                <span className="text-white"> tells a </span>
                <br className="hidden md:block" />
                <span className="text-white">story. </span>
                <span className="bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">Start writing yours.</span>
              </h2>

              {/* Description */}
              <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-xl mb-6">
                No spreadsheets. No complicated apps. Just tap{' '}
                <span className="inline-flex items-center justify-center w-6 h-6 bg-white/25 rounded-lg text-white text-xs font-extrabold mx-0.5 align-middle">+</span>{' '}
                every time you spend — from your morning chai to that Swiggy order at midnight. Watch your spending habits unfold like magic.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {[
                  { emoji: '⚡', text: '2-second logging' },
                  { emoji: '📊', text: 'Auto insights' },
                  { emoji: '🎯', text: '50/30/20 budget' },
                  { emoji: '🔒', text: 'Your data stays here' },
                ].map((feature) => (
                  <span
                    key={feature.text}
                    className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 px-3.5 py-1.5 rounded-xl text-[13px] font-semibold border border-white/10"
                  >
                    <span>{feature.emoji}</span>
                    {feature.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Decorative card illustration */}
            <div className="shrink-0 hidden md:flex flex-col items-center gap-3">
              {/* Fake mini transaction cards */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 w-52 flex items-center gap-3 transform rotate-2 hover:rotate-0 transition-transform">
                <span className="text-xl">☕</span>
                <div>
                  <p className="text-white text-sm font-bold">Morning Chai</p>
                  <p className="text-white/60 text-xs font-medium">Just now</p>
                </div>
                <span className="ml-auto text-yellow-200 font-extrabold text-sm">-₹15</span>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 w-52 flex items-center gap-3 transform -rotate-1 hover:rotate-0 transition-transform">
                <span className="text-xl">🛺</span>
                <div>
                  <p className="text-white text-sm font-bold">Auto Rickshaw</p>
                  <p className="text-white/60 text-xs font-medium">2 min ago</p>
                </div>
                <span className="ml-auto text-yellow-200 font-extrabold text-sm">-₹40</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/25 w-52 flex items-center gap-3 transform rotate-1 hover:rotate-0 transition-transform shadow-lg">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-white text-sm font-bold">Salary Credited</p>
                  <p className="text-white/60 text-xs font-medium">Today</p>
                </div>
                <span className="ml-auto text-emerald-200 font-extrabold text-sm">+₹50K</span>
              </div>
            </div>
          </div>

          {/* Bottom wave accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300/50 via-emerald-200/50 to-cyan-300/50" />
        </div>
      )}

      {/* ━━━ Balance + Stat Cards ━━━ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Hero Card */}
        <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-110" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8 md:mb-12">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                Available Cash
                <InfoTooltip text="Total income minus spending. Savings are tracked separately and not deducted here." />
              </span>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Wallet className="text-white" size={20} />
              </div>
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
                {formatCurrency(stats.balance)}
              </h2>
              {!isFirstTime && (
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm mt-4">
                  <Activity size={14} className="text-emerald-400" />
                  <p className="text-slate-200 text-xs font-semibold">
                    {transactions.length} entries tracked
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 md:gap-6">
          <StatCard
            title="Total Income"
            tooltip="All money received — salary, gifts, refunds, etc."
            amount={stats.income}
            icon={<TrendingUp size={24} />}
            color="emerald"
          />
          <StatCard
            title="Total Spent"
            tooltip="All money spent on needs and wants (excludes savings transfers)."
            amount={stats.expenses}
            icon={<TrendingDown size={24} />}
            color="rose"
          />
          <StatCard
            title="Savings Stashed"
            tooltip="Money you've set aside as savings. Not deducted from your available cash."
            amount={stats.savings}
            icon={<Target size={24} />}
            color="blue"
            className="col-span-2"
          />
        </div>
      </div>

      {/* ━━━ Spending Limit Alert ━━━ */}
      {!isFirstTime && spendingLimit?.enabled && spendingLimit.amount > 0 && (
        <DailyLimitBanner transactions={transactions} limit={spendingLimit} />
      )}

      {/* ━━━ Active Goals ━━━ */}
      {!isFirstTime && goals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Target size={16} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Active Goals</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.filter((g) => g.currentAmount < g.targetAmount).slice(0, 3).map((goal) => (
              <SpendingGoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* ━━━ Monthly Summary Report ━━━ */}
      {!isFirstTime && (
        <MonthlySummary transactions={transactions} />
      )}

      {/* ━━━ Charts + Recent Transactions ━━━ */}
      {!isFirstTime && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spending Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center mb-8">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                Where is it going?
              </h3>
              <InfoTooltip text="A quick look at your top spending categories." />
            </div>
            {expensesByCategory.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expensesByCategory.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                      width={100}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                        fontWeight: 'bold',
                      }}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={36}>
                      {expensesByCategory.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={tokens.chart[index % tokens.chart.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyPlaceholder message="Nothing spent yet! Keep it up." />
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Recent Drops</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-1">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="group relative">
                  <TransactionRow tx={tx} compact />
                  {onEdit && onDelete && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                      {confirmDeleteId === tx.id ? (
                        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/50 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 shadow-sm">
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Delete?</span>
                          <button onClick={() => handleDelete(tx.id)} className="px-2 py-0.5 bg-rose-500 text-white rounded-lg text-[10px] font-bold">Yes</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold border dark:border-slate-500">No</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => onEdit(tx)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setConfirmDeleteId(tx.id)} className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-all" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Daily Spending Limit Banner ──────────────────────

function DailyLimitBanner({ transactions, limit }: { transactions: Transaction[]; limit: SpendingLimit }) {
  const spent = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const monthStr = todayStr.slice(0, 7);

    return transactions
      .filter((t) => t.type === 'expense' && t.budgetCategory !== 'Savings' && t.budgetCategory !== 'Income')
      .reduce((acc, t) => {
        if (limit.period === 'daily' && t.date === todayStr) acc += t.amount;
        else if (limit.period === 'weekly' && t.date >= weekStartStr) acc += t.amount;
        else if (limit.period === 'monthly' && t.date.startsWith(monthStr)) acc += t.amount;
        return acc;
      }, 0);
  }, [transactions, limit.period]);

  const pct = limit.amount > 0 ? Math.round((spent / limit.amount) * 100) : 0;
  if (pct < 60) return null;

  const isOver = pct >= 100;

  return (
    <div
      className={`rounded-[2rem] p-5 flex items-center gap-4 border shadow-sm ${
        isOver
          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        isOver
          ? 'bg-rose-100 dark:bg-rose-800 text-rose-500 dark:text-rose-300'
          : 'bg-amber-100 dark:bg-amber-800 text-amber-500 dark:text-amber-300'
      }`}>
        <AlertTriangle size={20} />
      </div>
      <div className="flex-1">
        <p className={`font-extrabold text-[15px] ${isOver ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
          {isOver
            ? `Over your ${limit.period} limit by ${formatCurrency(spent - limit.amount)}`
            : `${pct}% of your ${limit.period} limit used`
          }
        </p>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {formatCurrency(spent)} of {formatCurrency(limit.amount)} spent
        </p>
      </div>
      {!isOver && (
        <div className="shrink-0 w-14 h-14 relative">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-600" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
              strokeDasharray={`${pct * 0.97}, 100`}
              className={pct >= 80 ? 'text-rose-400' : 'text-amber-400'}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-slate-700 dark:text-slate-300">{pct}%</span>
        </div>
      )}
    </div>
  );
}
