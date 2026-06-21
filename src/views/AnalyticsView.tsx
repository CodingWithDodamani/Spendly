import { useMemo, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  PieChart as PieChartIcon, TrendingUp, TrendingDown,
  Flame, Calendar, Zap,
} from 'lucide-react';
import { formatCurrency, formatCompact } from '../utils/formatters';
import { tokens } from '../utils/colors';
import { InfoTooltip } from '../components/InfoTooltip';
import type { Transaction } from '../utils/validation';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface CategoryData {
  name: string;
  value: number;
}

interface AnalyticsViewProps {
  expensesByCategory: CategoryData[];
  transactions: Transaction[];
  isFirstTime: boolean;
}

interface HeatmapCell {
  date: string;
  amount: number;
  label: string;
  isToday: boolean;
  isEmpty: boolean;
}

interface InsightCardData {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

/** Convert Date to local YYYY-MM-DD string (timezone-safe) */
const toLocalDateStr = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Shared tooltip styles matching Spendly design */
const TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
  fontWeight: 600,
  fontSize: '13px',
  padding: '10px 14px',
  backgroundColor: '#ffffff',
};

/** Get heatmap cell color based on spending intensity */
const getHeatColor = (amount: number, max: number): string => {
  if (amount <= 0) return '#f1f5f9'; // slate-100
  const r = amount / max;
  if (r < 0.15) return '#d1fae5'; // emerald-100
  if (r < 0.3) return '#a7f3d0'; // emerald-200
  if (r < 0.5) return '#6ee7b7'; // emerald-300
  if (r < 0.7) return '#34d399'; // emerald-400
  if (r < 0.85) return '#10b981'; // emerald-500
  return '#059669'; // emerald-600
};

/** Day labels for heatmap rows (only show Mon/Wed/Fri for compactness) */
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────

export function AnalyticsView({ expensesByCategory, transactions, isFirstTime }: AnalyticsViewProps) {
  // ── All hooks MUST be called unconditionally (Rules of Hooks) ──

  // Heatmap tooltip state
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    label: string;
    amount: number;
  } | null>(null);

  const handleCellHover = useCallback(
    (e: React.MouseEvent, cell: HeatmapCell) => {
      if (cell.isEmpty) return;
      setHoveredCell({
        x: e.clientX,
        y: e.clientY,
        label: cell.label,
        amount: cell.amount,
      });
    },
    [],
  );

  const handleCellLeave = useCallback(() => setHoveredCell(null), []);

  // Total expenses (simple derived value)
  const totalExpenses = expensesByCategory.reduce((acc, c) => acc + c.value, 0);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. MONTHLY SPENDING TREND — last 30 days
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const { dailySpending, trendPercent } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a spending lookup from expense transactions
    const spendMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        spendMap[t.date] = (spendMap[t.date] || 0) + t.amount;
      });

    // Generate 30 data points (one per day)
    const data: { date: string; amount: number; label: string }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateStr(d);
      data.push({
        date: dateStr,
        amount: spendMap[dateStr] || 0,
        label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      });
    }

    // Trend: compare last 7 days vs previous 7 days
    const last7 = data.slice(-7).reduce((s, d) => s + d.amount, 0);
    const prev7 = data.slice(-14, -7).reduce((s, d) => s + d.amount, 0);
    const trend = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

    return { dailySpending: data, trendPercent: trend };
  }, [transactions]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. DONUT CHART — Top 5 categories + "Others"
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const donutData = useMemo(() => {
    if (expensesByCategory.length <= 5) return expensesByCategory;
    const top5 = expensesByCategory.slice(0, 5);
    const othersValue = expensesByCategory
      .slice(5)
      .reduce((acc, c) => acc + c.value, 0);
    if (othersValue > 0) {
      return [...top5, { name: 'Others', value: othersValue }];
    }
    return top5;
  }, [expensesByCategory]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. WEEKLY HEATMAP — last 12 weeks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Expense spending by date
    const spendMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        spendMap[t.date] = (spendMap[t.date] || 0) + t.amount;
      });

    // Align to weeks: Monday = row 0, Sunday = row 6
    const todayDow = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const adjustedDow = todayDow === 0 ? 6 : todayDow - 1; // Mon=0 ... Sun=6

    // 11 full previous weeks + current partial week
    const totalDays = 11 * 7 + adjustedDow + 1;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    const cells: HeatmapCell[] = [];
    let maxAmount = 1; // avoid division by zero

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = toLocalDateStr(d);
      const amount = spendMap[dateStr] || 0;
      if (amount > maxAmount) maxAmount = amount;

      cells.push({
        date: dateStr,
        amount,
        label: d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        isToday: dateStr === toLocalDateStr(today),
        isEmpty: false,
      });
    }

    // Pad the last column so the grid stays rectangular
    const remainder = totalDays % 7;
    if (remainder > 0) {
      for (let j = 0; j < 7 - remainder; j++) {
        cells.push({
          date: '',
          amount: 0,
          label: '',
          isToday: false,
          isEmpty: true,
        });
      }
    }

    // Month labels: detect when Monday (row 0) enters a new month
    const monthLabels: { label: string; colStart: number }[] = [];
    let lastMonth = -1;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].isEmpty) continue;
      const row = i % 7;
      const col = Math.floor(i / 7);
      if (row === 0) {
        const d = new Date(cells[i].date + 'T00:00:00');
        const month = d.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            label: d.toLocaleDateString('en-IN', { month: 'short' }),
            colStart: col,
          });
          lastMonth = month;
        }
      }
    }

    const totalCols = Math.ceil(cells.length / 7);

    return { cells, maxAmount, totalCols, monthLabels };
  }, [transactions]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. SMART INSIGHTS — rule-based analysis cards
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const insights = useMemo(() => {
    const cards: InsightCardData[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expenses = transactions.filter((t) => t.type === 'expense');
    const total = expensesByCategory.reduce((a, c) => a + c.value, 0);

    // — Insight 1: Highest spending category
    if (expensesByCategory.length > 0) {
      const top = expensesByCategory[0];
      const pct = total > 0 ? Math.round((top.value / total) * 100) : 0;
      cards.push({
        icon: <Flame size={20} />,
        title: 'Top Category',
        value: top.name,
        subtitle: `${formatCurrency(top.value)} · ${pct}% of spending`,
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50 border-amber-100',
      });
    }

    // — Insight 2: Week-over-week spending change
    const thisWeekTotal = expenses
      .filter((t) => {
        const diff =
          (now.getTime() - new Date(t.date + 'T00:00:00').getTime()) / 86_400_000;
        return diff >= 0 && diff < 7;
      })
      .reduce((s, t) => s + t.amount, 0);

    const lastWeekTotal = expenses
      .filter((t) => {
        const diff =
          (now.getTime() - new Date(t.date + 'T00:00:00').getTime()) / 86_400_000;
        return diff >= 7 && diff < 14;
      })
      .reduce((s, t) => s + t.amount, 0);

    if (lastWeekTotal > 0) {
      const change = Math.round(
        ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100,
      );
      const isUp = change > 0;
      cards.push({
        icon: isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
        title: 'Weekly Trend',
        value: `${isUp ? '+' : ''}${change}%`,
        subtitle: isUp
          ? 'Spending more than last week'
          : 'Spending less — nice! 🎉',
        colorClass: isUp ? 'text-rose-500' : 'text-emerald-600',
        bgClass: isUp ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100',
      });
    } else if (thisWeekTotal > 0) {
      cards.push({
        icon: <TrendingUp size={20} />,
        title: 'This Week',
        value: formatCompact(thisWeekTotal),
        subtitle: 'Your first week of tracking!',
        colorClass: 'text-sky-600',
        bgClass: 'bg-sky-50 border-sky-100',
      });
    }

    // — Insight 3: Highest spending day of week
    const dayTotals: Record<string, number> = {};
    expenses.forEach((t) => {
      const dayName = new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long',
      });
      dayTotals[dayName] = (dayTotals[dayName] || 0) + t.amount;
    });
    const topDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    if (topDay) {
      cards.push({
        icon: <Calendar size={20} />,
        title: 'Spendy Day',
        value: topDay[0] + 's',
        subtitle: `You spend the most on ${topDay[0]}s`,
        colorClass: 'text-violet-600',
        bgClass: 'bg-violet-50 border-violet-100',
      });
    }

    // — Insight 4: Average daily spend
    if (expenses.length > 0) {
      const uniqueDates = new Set(expenses.map((t) => t.date));
      const avgDaily = total / uniqueDates.size;
      cards.push({
        icon: <Zap size={20} />,
        title: 'Daily Average',
        value: formatCurrency(avgDaily),
        subtitle: `Across ${uniqueDates.size} active day${uniqueDates.size !== 1 ? 's' : ''}`,
        colorClass: 'text-sky-600',
        bgClass: 'bg-sky-50 border-sky-100',
      });
    }

    return cards.slice(0, 4); // max 4 cards
  }, [transactions, expensesByCategory]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. INCOME VS EXPENSE — last 6 months
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const incomeVsExpense = useMemo(() => {
    const now = new Date();
    const months: { month: string; Income: number; Expenses: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
      });

      let income = 0;
      let expense = 0;

      transactions.forEach((t) => {
        if (t.date.startsWith(monthKey)) {
          if (t.type === 'income') income += t.amount;
          if (t.type === 'expense') expense += t.amount;
        }
      });

      months.push({ month: label, Income: income, Expenses: expense });
    }

    return months;
  }, [transactions]);

  const hasComparisonData = incomeVsExpense.some(
    (m) => m.Income > 0 || m.Expenses > 0,
  );

  // Heatmap column month labels as a flat array (one per column)
  const colMonthLabels = useMemo(() => {
    const labels: string[] = Array(heatmapData.totalCols).fill('');
    heatmapData.monthLabels.forEach((m) => {
      if (m.colStart < labels.length) {
        labels[m.colStart] = m.label;
      }
    });
    return labels;
  }, [heatmapData]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EMPTY STATE (after all hooks)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (isFirstTime || expensesByCategory.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-300 mb-6">
          <PieChartIcon size={40} />
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
          It&apos;s a bit quiet here
        </h3>
        <p className="text-slate-500 max-w-md leading-relaxed text-lg">
          Log a few daily expenses to see beautiful, colorful charts breaking down
          your spending habits.
        </p>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MAIN RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ────────────────────────────────────────────────
          1. SMART INSIGHT CARDS
          ──────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((card) => (
            <div
              key={card.title}
              className={`bg-white dark:bg-slate-800 rounded-[1.75rem] p-5 shadow-sm border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 ${card.bgClass}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.colorClass} bg-white/70`}
              >
                {card.icon}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {card.title}
              </p>
              <p className={`text-lg sm:text-xl font-extrabold tracking-tight ${card.colorClass}`}>
                {card.value}
              </p>
              <p className="text-[12px] sm:text-[13px] text-slate-500 mt-1 font-medium leading-snug">
                {card.subtitle}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ────────────────────────────────────────────────
           2. MONTHLY SPENDING TREND (Area Chart)
           ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center">
            Spending Momentum
            <InfoTooltip text="Your daily spending over the last 30 days. Spot patterns and control impulse buys." />
          </h3>
          {trendPercent !== 0 && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold self-start ${
                trendPercent > 0
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {trendPercent > 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {trendPercent > 0 ? '+' : ''}
              {trendPercent}% vs last week
            </div>
          )}
        </div>

        <div className="h-56 sm:h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailySpending}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={tokens.primary[500]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={tokens.primary[500]}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                tickFormatter={(v) => formatCompact(Number(v))}
                width={55}
              />
              <RechartsTooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [formatCurrency(Number(value)), 'Spent']}
                labelStyle={{
                  fontWeight: 700,
                  color: '#334155',
                  marginBottom: 4,
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={tokens.primary[500]}
                strokeWidth={2.5}
                fill="url(#spendingFill)"
                animationDuration={800}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: tokens.primary[500],
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          3. CATEGORY DONUT + WEEKLY HEATMAP (side by side on lg)
          ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Donut Chart ── */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6 sm:mb-8 flex items-center tracking-tight">
            Category Split
            <InfoTooltip text="Top 5 spending categories. Everything else is grouped as 'Others'." />
          </h3>

          <div className="h-64 sm:h-72 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={8}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {donutData.map((_entry, index) => (
                    <Cell
                      key={`donut-${index}`}
                      fill={tokens.chart[index % tokens.chart.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value, name) => {
                    const pct =
                      totalExpenses > 0
                        ? Math.round((Number(value) / totalExpenses) * 100)
                        : 0;
                    return [
                      `${formatCurrency(Number(value))} (${pct}%)`,
                      String(name),
                    ];
                  }}
                  contentStyle={TOOLTIP_STYLE}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">
                  Total
                </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white">
                {formatCompact(totalExpenses)}
              </span>
            </div>
          </div>

          {/* Legend pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {donutData.map((cat, idx) => (
              <div
                key={cat.name}
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-600 text-[12px] sm:text-[13px]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: tokens.chart[idx % tokens.chart.length],
                  }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{cat.name}</span>
                <span className="font-extrabold text-slate-800">
                  {totalExpenses > 0
                    ? Math.round((cat.value / totalExpenses) * 100)
                    : 0}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly Spending Heatmap ── */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center tracking-tight">
            Spending Heatmap
            <InfoTooltip text="Your spending intensity over the last 12 weeks. Darker green = more money spent that day." />
          </h3>
          <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium mb-5">
            Last 12 weeks · Hover for details
          </p>

          <div className="flex-1 flex flex-col justify-center">
            {/* Month labels row */}
            <div className="flex mb-1.5" style={{ paddingLeft: '36px' }}>
              <div className="flex" style={{ gap: '3px' }}>
                {colMonthLabels.map((label, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-bold text-slate-400 overflow-visible whitespace-nowrap"
                    style={{ width: '18px' }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Grid: day labels + heatmap cells */}
            <div className="flex gap-1.5">
              {/* Day-of-week labels (Mon / Wed / Fri / Sun) */}
              <div className="flex flex-col" style={{ gap: '3px' }}>
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="text-[10px] font-bold text-slate-400 flex items-center justify-end pr-0.5"
                    style={{ width: '30px', height: '18px' }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Heatmap cells (CSS Grid: 7 rows, auto columns) */}
              <div className="flex-1 overflow-x-auto pb-1">
                <div
                  className="grid"
                  style={{
                    gridTemplateRows: 'repeat(7, 18px)',
                    gridAutoFlow: 'column',
                    gridAutoColumns: '18px',
                    gap: '3px',
                    width: 'fit-content',
                  }}
                >
                  {heatmapData.cells.map((cell, i) => (
                    <div
                      key={cell.date || `pad-${i}`}
                      className={`rounded-[4px] transition-all duration-150 ${
                        cell.isEmpty
                          ? 'pointer-events-none'
                          : 'cursor-pointer hover:scale-[1.3] hover:ring-2 hover:ring-emerald-300 hover:z-10'
                      } ${cell.isToday ? 'ring-2 ring-slate-500 ring-offset-1' : ''}`}
                      style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: cell.isEmpty
                          ? 'transparent'
                          : getHeatColor(cell.amount, heatmapData.maxAmount),
                      }}
                      onMouseEnter={(e) => handleCellHover(e, cell)}
                      onMouseLeave={handleCellLeave}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Intensity legend */}
            <div className="flex items-center justify-end gap-1.5 mt-4">
              <span className="text-[10px] font-bold text-slate-400 mr-1">
                Less
              </span>
              {[
                '#f1f5f9',
                '#d1fae5',
                '#a7f3d0',
                '#6ee7b7',
                '#34d399',
                '#10b981',
                '#059669',
              ].map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-[3px]"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span className="text-[10px] font-bold text-slate-400 ml-1">
                More
              </span>
            </div>
          </div>

          {/* Heatmap floating tooltip */}
          {hoveredCell && (
            <div
              className="fixed z-[9999] bg-slate-800 text-white px-3.5 py-2.5 rounded-xl shadow-xl pointer-events-none"
              style={{
                top: Math.max(8, hoveredCell.y - 60),
                left: Math.max(
                  8,
                  Math.min(
                    typeof window !== 'undefined'
                      ? window.innerWidth - 160
                      : 600,
                    hoveredCell.x - 70,
                  ),
                ),
              }}
            >
              <p className="font-bold text-white/80 text-[11px] mb-0.5">
                {hoveredCell.label}
              </p>
              <p className="font-extrabold text-white text-[14px]">
                {hoveredCell.amount > 0
                  ? formatCurrency(hoveredCell.amount)
                  : 'No spending'}
              </p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          4. INCOME VS EXPENSE COMPARISON
          ──────────────────────────────────────────────── */}
      {hasComparisonData && (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center">
              Income vs Expenses
              <InfoTooltip text="Compare your monthly earnings against spending over the last 6 months." />
            </h3>

            {/* Custom legend */}
            <div className="flex items-center gap-4 self-start">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tokens.primary[500] }}
                />
                <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                  Income
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tokens.danger[500] }}
                />
                <span className="text-[13px] font-bold text-slate-600">
                  Expenses
                </span>
              </div>
            </div>
          </div>

          <div className="h-60 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={incomeVsExpense}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="incomeFillGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={tokens.primary[500]}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={tokens.primary[500]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient
                    id="expenseFillGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={tokens.danger[500]}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={tokens.danger[500]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(v) => formatCompact(Number(v))}
                  width={55}
                />
                <RechartsTooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => formatCurrency(Number(value))}
                  labelStyle={{
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 4,
                  }}
                />
                <Area
                  type="monotone"
                  name="Income"
                  dataKey="Income"
                  stroke={tokens.primary[500]}
                  strokeWidth={2.5}
                  fill="url(#incomeFillGrad)"
                  animationDuration={800}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: tokens.primary[500],
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
                <Area
                  type="monotone"
                  name="Expenses"
                  dataKey="Expenses"
                  stroke={tokens.danger[500]}
                  strokeWidth={2.5}
                  fill="url(#expenseFillGrad)"
                  animationDuration={800}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: tokens.danger[500],
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
