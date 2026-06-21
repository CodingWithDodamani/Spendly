import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, TrendingDown, Repeat } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Transaction, RecurringTransaction } from '../utils/validation';

interface CalendarViewProps {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
}

interface DayInfo {
  date: number;
  dateStr: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  totalExpense: number;
  totalIncome: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonthDays(year: number, month: number): { date: number; dayOfWeek: number }[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: number; dayOfWeek: number }[] = [];
  // Leading blanks
  for (let i = 0; i < firstDay; i++) {
    days.push({ date: 0, dayOfWeek: i });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    days.push({ date: d, dayOfWeek: dow });
  }
  return days;
}

function pad(n: number): string { return String(n).padStart(2, '0'); }

function getRecurringDayOfMonth(rec: RecurringTransaction): number {
  // Use lastTriggered day as the expected day of month for monthly recurring
  const d = new Date(rec.lastTriggered + 'T00:00:00');
  return d.getDate();
}

function getRecurringDayOfWeek(rec: RecurringTransaction): number {
  const d = new Date(rec.lastTriggered + 'T00:00:00');
  return d.getDay();
}

export function CalendarView({ transactions, recurringTransactions }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);

  // Recurring expenses for this month
  const recurringThisMonth = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const result: { dateStr: string; rec: RecurringTransaction }[] = [];

    recurringTransactions.filter((r) => r.active).forEach((rec) => {
      if (rec.frequency === 'daily') {
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
          result.push({ dateStr, rec });
        }
      } else if (rec.frequency === 'weekly') {
        const dow = getRecurringDayOfWeek(rec);
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(viewYear, viewMonth, d);
          if (dateObj.getDay() === dow) {
            result.push({ dateStr: `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`, rec });
          }
        }
      } else if (rec.frequency === 'monthly') {
        let day = getRecurringDayOfMonth(rec);
        if (day > daysInMonth) day = daysInMonth;
        const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
        result.push({ dateStr, rec });
      }
    });

    return result;
  }, [recurringTransactions, viewYear, viewMonth]);

  // Build day info grid
  const days = useMemo(() => {
    const monthStr = `${viewYear}-${pad(viewMonth + 1)}`;

    const expenseByDate: Record<string, number> = {};
    const incomeByDate: Record<string, number> = {};
    const txsByDate: Record<string, Transaction[]> = {};

    transactions.filter((t) => t.date.startsWith(monthStr)).forEach((t) => {
      if (!txsByDate[t.date]) txsByDate[t.date] = [];
      txsByDate[t.date].push(t);
      if (t.type === 'income') {
        incomeByDate[t.date] = (incomeByDate[t.date] || 0) + t.amount;
      } else if (t.budgetCategory !== 'Savings') {
        expenseByDate[t.date] = (expenseByDate[t.date] || 0) + t.amount;
      }
    });

    const recByDate: Record<string, RecurringTransaction[]> = {};
    recurringThisMonth.forEach(({ dateStr, rec }) => {
      if (!recByDate[dateStr]) recByDate[dateStr] = [];
      recByDate[dateStr].push(rec);
    });

    const calendarDays = getMonthDays(viewYear, viewMonth);
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    return calendarDays.map((d) => {
      const dateStr = d.date > 0 ? `${viewYear}-${pad(viewMonth + 1)}-${pad(d.date)}` : '';
      return {
        date: d.date,
        dateStr,
        isToday: dateStr === todayStr,
        isCurrentMonth: d.date > 0,
        transactions: txsByDate[dateStr] || [],
        recurring: recByDate[dateStr] || [],
        totalExpense: expenseByDate[dateStr] || 0,
        totalIncome: incomeByDate[dateStr] || 0,
      };
    });
  }, [transactions, recurringThisMonth, viewYear, viewMonth, today]);

  // Month summary
  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const monthStr = `${viewYear}-${pad(viewMonth + 1)}`;

    // From actual transactions
    transactions.filter((t) => t.date.startsWith(monthStr)).forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.budgetCategory !== 'Savings') expense += t.amount;
    });

    // From recurring (estimate for rest of month)
    const todayDay = today.getMonth() === viewMonth && today.getFullYear() === viewYear ? today.getDate() : 1;
    recurringThisMonth.forEach(({ dateStr, rec }) => {
      const day = parseInt(dateStr.split('-')[2], 10);
      if (day >= todayDay) {
        if (rec.type === 'income') income += rec.amount;
        else expense += rec.amount;
      }
    });

    return { income, expense };
  }, [transactions, recurringThisMonth, viewYear, viewMonth, today]);

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  }, [viewMonth]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  }, [viewMonth]);

  const handleToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(null);
  }, [today]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Summary Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Bill Calendar</h3>
            <p className="text-[13px] text-slate-400 font-medium">Upcoming recurring expenses & paydays</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800">
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Expected Income</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthSummary.income)}</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-800">
            <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-1">Expected Expenses</p>
            <p className="text-2xl font-extrabold text-rose-500">{formatCurrency(monthSummary.expense)}</p>
          </div>
        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button onClick={handlePrevMonth} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all" title="Previous month">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button onClick={handleNextMonth} className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all" title="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-emerald-700 dark:text-emerald-400 text-[13px] transition-all"
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 sm:p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day, i) => {
              if (!day.isCurrentMonth) {
                return <div key={`empty-${i}`} />;
              }

              const hasRecurring = day.recurring.length > 0;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDay(selectedDay?.dateStr === day.dateStr ? null : day)}
                  className={`relative flex flex-col items-center justify-start p-2 min-h-[60px] sm:min-h-[72px] rounded-2xl border transition-all ${
                    day.isToday
                      ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  } ${selectedDay?.dateStr === day.dateStr ? 'ring-2 ring-emerald-300 dark:ring-emerald-600' : ''}`}
                >
                  <span className={`text-[13px] font-bold leading-tight ${
                    day.isToday ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {day.date}
                  </span>

                  {/* Dots for activity */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hasRecurring && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Recurring" />
                    )}
                    {day.totalIncome > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Income" />
                    )}
                    {day.totalExpense > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Expense" />
                    )}
                  </div>

                  {/* Amount label for significant days */}
                  {(day.totalExpense > 0 || day.totalIncome > 0) && (
                    <span className="text-[9px] font-bold leading-tight mt-0.5 truncate max-w-full">
                      {day.totalIncome > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(day.totalIncome).replace('₹', '')}</span>
                      )}
                      {day.totalExpense > 0 && (
                        <span className="text-rose-500">-{formatCurrency(day.totalExpense).replace('₹', '')}</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected Day Details ── */}
        {selectedDay && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-6 sm:px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-extrabold text-slate-800 dark:text-white">
                {new Date(selectedDay.dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h4>
              <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600 text-[13px] font-bold">Close</button>
            </div>

            {/* Recurring items */}
            {selectedDay.recurring.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-bold text-purple-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Repeat size={14} /> Recurring
                </p>
                <div className="space-y-1.5">
                  {selectedDay.recurring.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 border border-purple-100 dark:border-purple-900">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rec.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-500'}`}>
                          {rec.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white">{rec.description}</p>
                          <p className="text-[11px] text-slate-400 font-medium capitalize">{rec.frequency}</p>
                        </div>
                      </div>
                      <span className={`font-extrabold text-[14px] ${rec.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                        {rec.type === 'income' ? '+' : '-'}{formatCurrency(rec.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actual transactions */}
            {selectedDay.transactions.length > 0 ? (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logged Entries</p>
                <div className="space-y-1.5">
                  {selectedDay.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 border border-slate-100 dark:border-slate-600">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-500'}`}>
                          {tx.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{tx.description}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{tx.category}</p>
                        </div>
                      </div>
                      <span className={`font-extrabold text-[14px] shrink-0 pl-2 ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDay.recurring.length === 0 ? (
              <p className="text-slate-400 text-[14px] font-medium text-center py-4">No entries scheduled for this day.</p>
            ) : null}
          </div>
        )}

        {/* Legend */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Recurring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Expense</span>
          </div>
        </div>
      </div>
    </div>
  );
}