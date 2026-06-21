import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Home, Activity, Briefcase, ArrowRightLeft, Plus, Info, Settings, Calendar } from 'lucide-react';

// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';

// Utils
import {
  type Transaction,
  type RecurringTransaction,
  type SpendingGoal,
  type SpendingLimit,
  validateTransaction,
  validateTransactionList,
  validateRecurringList,
  validateGoalList,
  validateLimit,
  validateCategoryList,
} from './utils/validation';

// Components
import { SpendlyLogo } from './components/SpendlyLogo';
import { InfoTooltip } from './components/InfoTooltip';
import { NavItem, MobileNavItem } from './components/NavItem';
import { AddTransactionModal } from './components/AddTransactionModal';

// Views
import { DashboardView } from './views/DashboardView';
import { AnalyticsView } from './views/AnalyticsView';
import { BudgetPlannerView } from './views/BudgetPlannerView';
import { TransactionsView } from './views/TransactionsView';
import { AboutView } from './views/AboutView';
import { SettingsView } from './views/SettingsView';
import { CalendarView } from './views/CalendarView';

// ─────────────────────────────────────────────────────
// Flow:
//   1. Splash Screen (logo animation, 2.2s)
//   2. Landing Page (first-time visitors only)
//   3. Dashboard (after CTA click or returning users)
//
// We track onboarding status in localStorage via
// the key 'spendly_onboarded'. If the flag is missing,
// the user sees the Landing Page after the splash.
// Once they click any CTA, the flag is set and they
// go directly to Dashboard on all future visits.
// ─────────────────────────────────────────────────────

export default function App() {
  // ── Splash Screen ──────────────────────────────────
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  // ── Onboarding Check ───────────────────────────────
  // Determine if user has completed onboarding (seen landing & clicked CTA)
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    try {
      return localStorage.getItem('spendly_onboarded') === 'true';
    } catch {
      return false;
    }
  });

  // ── Navigation & Modal State ───────────────────────
  // First-time users start on 'about' (landing page)
  // Returning users start on 'dashboard'
  const [activeTab, setActiveTab] = useState(hasOnboarded ? 'dashboard' : 'about');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Track if the main app area has been revealed (for entrance animation)
  const [appRevealed, setAppRevealed] = useState(hasOnboarded);

  // Stable navigation handler for child components
  const handleNavigate = useCallback((tab: string) => {
    // If navigating away from the landing page for the first time,
    // mark onboarding as complete so future visits skip landing
    if (!hasOnboarded && tab !== 'about') {
      try {
        localStorage.setItem('spendly_onboarded', 'true');
      } catch {
        // Silently fail if localStorage is unavailable
      }
      setHasOnboarded(true);

      // Trigger entrance animation for main app
      setAppRevealed(false);
      // Allow a brief tick for the state change, then reveal
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAppRevealed(true);
        });
      });
    }

    setActiveTab(tab);
  }, [hasOnboarded]);

  // ── Dark Mode ──────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('spendly_dark') === 'true';
    } catch { return false; }
  });

  // Apply dark class to <html> and persist preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('spendly_dark', String(isDark)); } catch { }
  }, [isDark]);

  // ── Persisted State (localStorage) ─────────────────
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    'spendly_transactions',
    [],
    validateTransactionList,
  );

  const [salaryConfig, setSalaryConfig] = useLocalStorage<string>(
    'spendly_salaryConfig',
    '',
  );

  const [recurringTransactions, setRecurringTransactions] = useLocalStorage<RecurringTransaction[]>(
    'spendly_recurring',
    [],
    validateRecurringList,
  );

  const [goals, setGoals] = useLocalStorage<SpendingGoal[]>(
    'spendly_goals',
    [],
    validateGoalList,
  );

  const [spendingLimit, setSpendingLimit] = useLocalStorage<SpendingLimit>(
    'spendly_limit',
    { enabled: false, period: 'daily', amount: 0 },
    validateLimit,
  );

  const [customCategories, setCustomCategories] = useLocalStorage<string[]>(
    'spendly_categories',
    [],
    validateCategoryList,
  );

  // ── Edit Transaction State ─────────────────────────
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // ── Splash Timer ───────────────────────────────────
  useEffect(() => {
    const exitTimer = setTimeout(() => setIsSplashExiting(true), 1800);
    const removeTimer = setTimeout(() => setShowSplash(false), 2200);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // ── Financial Calculations ─────────────────────────
  // Balance = income - expenses (savings tracked separately)
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let savings = 0;

    transactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        if (t.budgetCategory === 'Savings') {
          savings += t.amount;
        } else {
          expenses += t.amount;
        }
      }
    });

    return {
      income,
      expenses,
      savings,
      balance: income - expenses,
    };
  }, [transactions]);

  // ── Expenses by Category ───────────────────────────
  const expensesByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // ── Add Transaction Handler ────────────────────────
  const handleAddTransaction = (newTx: Transaction) => {
    const validated = validateTransaction(newTx);
    if (editingTransaction) {
      // Edit mode: replace existing transaction in-place
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === validated.id ? validated : tx))
      );
      setEditingTransaction(null);
    } else {
      // Add mode: prepend new transaction
      setTransactions((prev) => [validated, ...prev]);
    }
    setIsAddModalOpen(false);
  };

  // ── Delete Transaction Handler ─────────────────────
  const handleDeleteTransaction = useCallback((id: number) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, [setTransactions]);

  // ── Edit Transaction Handler ───────────────────────
  const handleEditTransaction = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  }, []);

  // ── Recurring Transactions Engine ──────────────────
  // Uses a ref to avoid stale closures in the interval callback,
  // while still reading the latest recurringTransactions state on each tick.
  const processRecurringRef = useRef<() => void>(() => {});

  useEffect(() => {
    processRecurringRef.current = () => {
      if (recurringTransactions.length === 0) return;

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const newTransactions: Transaction[] = [];
      let updated = false;

      const updatedRecurring = recurringTransactions.map((rec) => {
        if (!rec.active) return rec;

        const lastDate = new Date(rec.lastTriggered + 'T00:00:00');
        let shouldTrigger = false;

        if (rec.frequency === 'daily') {
          shouldTrigger = rec.lastTriggered < todayStr;
        } else if (rec.frequency === 'weekly') {
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
          shouldTrigger = diffDays >= 7;
        } else if (rec.frequency === 'monthly') {
          shouldTrigger =
            lastDate.getMonth() !== today.getMonth() ||
            lastDate.getFullYear() !== today.getFullYear();
        }

        if (shouldTrigger) {
          updated = true;
          newTransactions.push(
            validateTransaction({
              id: Date.now() + Math.random(),
              amount: rec.amount,
              type: rec.type,
              category: rec.category,
              description: `${rec.description} (auto)`,
              budgetCategory: rec.budgetCategory,
              date: todayStr,
              paymentMode: rec.paymentMode,
            })
          );
          return { ...rec, lastTriggered: todayStr };
        }
        return rec;
      });

      if (updated) {
        setRecurringTransactions(updatedRecurring);
        setTransactions((prev) => [...newTransactions, ...prev]);
      }
    };
  }, [recurringTransactions, setRecurringTransactions, setTransactions]);

  // Run once on mount, then check every hour so recurring txn fire even if tab stays open for days
  useEffect(() => {
    processRecurringRef.current();
    const interval = setInterval(() => processRecurringRef.current(), 3_600_000);
    return () => clearInterval(interval);
  }, []);

  const isFirstTimeUser = transactions.length === 0;
  const isAboutPage = activeTab === 'about';

  // ── Render ─────────────────────────────────────────
  return (
    <>
      {/* ━━━ SPLASH SCREEN ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {showSplash && (
        <div
          className={`splash-wrapper fixed inset-0 bg-[#FFFDFB] flex flex-col items-center justify-center z-[100] transition-all duration-400 ease-in-out ${
            isSplashExiting
              ? 'opacity-0 scale-105 blur-sm pointer-events-none'
              : 'opacity-100 scale-100 blur-0'
          }`}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes popIn {
                  0% { opacity: 0; transform: scale(0.8) translateY(15px); }
                  60% { transform: scale(1.05) translateY(-3px); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes float {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-6px); }
                }
                @keyframes slideUpFade {
                  0% { opacity: 0; transform: translateY(12px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseSoft {
                  0%, 100% { transform: scale(1); opacity: 0.5; }
                  50% { transform: scale(1.05); opacity: 0.8; }
                }
                .splash-logo { opacity: 0; animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, float 4s ease-in-out infinite 0.5s; }
                .splash-title { opacity: 0; animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; }
                .splash-subtitle { opacity: 0; animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; }
                .splash-loader { opacity: 0; animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; }
                .splash-glow { animation: pulseSoft 3s infinite; }

                @media (prefers-reduced-motion: reduce) {
                  .splash-logo, .splash-title, .splash-subtitle, .splash-loader {
                    animation: none !important; opacity: 1 !important; transform: none !important;
                  }
                  .splash-glow { animation: none !important; opacity: 0.4 !important; }
                  .splash-wrapper { transition: opacity 0.4s ease !important; transform: none !important; filter: none !important; }
                }
              `,
            }}
          />

          <div className="flex flex-col items-center justify-center relative">
            <div className="splash-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl" />
            <SpendlyLogo className="splash-logo w-32 h-32 mb-4 z-10" />
            <h1 className="splash-title text-4xl font-extrabold text-slate-800 tracking-tight z-10">
              Spendly
            </h1>
            <p className="splash-subtitle mt-2 text-[15px] font-medium text-slate-500 z-10">
              Track daily, spend happily. ✨
            </p>
            <div className="splash-loader mt-10 flex gap-2 z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '100ms' }} />
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '200ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* ━━━ ABOUT / LANDING PAGE (Full-Screen Takeover) ━━━ */}
      {isAboutPage && (
        <div className={`transition-opacity duration-500 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
          <AboutView onNavigate={handleNavigate} />
        </div>
      )}

      {/* ━━━ MAIN APP LAYOUT (Hidden when About is active) ━━━ */}
      {!isAboutPage && (
        <div
          className={`min-h-screen bg-[#FDFCFB] dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:flex-row selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-900 dark:selection:text-emerald-100 transition-all duration-700 ease-out ${
            appRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 fixed h-full z-10">
            <div className="p-8 flex items-center gap-3">
              <SpendlyLogo className="w-10 h-10" />
              <span className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Spendly</span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-2">
              <NavItem icon={<Home />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <NavItem icon={<Activity />} label="Insights" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
              <NavItem icon={<Briefcase />} label="Budget Plan" isActive={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
              <NavItem icon={<Calendar />} label="Calendar" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
              <NavItem icon={<ArrowRightLeft />} label="History" isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
              <NavItem icon={<Settings />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>

            {/* About link at bottom of sidebar */}
            <div className="px-4 pb-6">
              <NavItem icon={<Info />} label="About" isActive={false} onClick={() => setActiveTab('about')} />
            </div>
          </aside>

          {/* ── Main Content Area ── */}
          <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-screen">
            <header className="sticky top-0 z-10 bg-[#FDFCFB]/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-700 px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white capitalize tracking-tight flex items-center">
                {activeTab === 'budget'
                  ? 'Budget Plan'
                  : activeTab === 'analytics'
                    ? 'Insights'
                    : activeTab === 'settings'
                      ? 'Settings'
                      : activeTab === 'transactions'
                        ? 'History'
                        : activeTab === 'calendar'
                          ? 'Calendar'
                          : activeTab}
                <InfoTooltip
                  text={`This is your ${activeTab} view. Manage and review your daily tracking here.`}
                />
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('about')}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-500 hover:border-emerald-100"
                  title="About Spendly"
                >
                  <Info size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setIsDark((d) => !d)}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:hover:text-amber-400"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  aria-label="Toggle dark mode"
                >
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  )}
                </button>
              </div>
            </header>

            <div className="p-3 md:p-8 max-w-[1400px] mx-auto space-y-4 md:space-y-8">
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  transactions={transactions}
                  expensesByCategory={expensesByCategory}
                  isFirstTime={isFirstTimeUser}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  goals={goals}
                  spendingLimit={spendingLimit}
                />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsView
                  transactions={transactions}
                  expensesByCategory={expensesByCategory}
                  isFirstTime={isFirstTimeUser}
                />
              )}
              {activeTab === 'budget' && (
                <BudgetPlannerView
                  transactions={transactions}
                  salaryConfig={salaryConfig}
                  setSalaryConfig={setSalaryConfig}
                  goals={goals}
                  setGoals={setGoals}
                />
              )}
              {activeTab === 'calendar' && (
                <CalendarView
                  transactions={transactions}
                  recurringTransactions={recurringTransactions}
                />
              )}
              {activeTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  isFirstTime={isFirstTimeUser}
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditTransaction}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  transactions={transactions}
                  recurringTransactions={recurringTransactions}
                  setRecurringTransactions={setRecurringTransactions}
                  spendingLimit={spendingLimit}
                  setSpendingLimit={setSpendingLimit}
                />
              )}
            </div>
          </main>

          {/* ── Mobile Bottom Nav ── */}
          <nav className="md:hidden fixed bottom-0 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-700 pb-safe z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
            <div className="flex items-end justify-around h-[64px] px-2">
              <MobileNavItem icon={<Home />} label="Home" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <MobileNavItem icon={<Activity />} label="Insights" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />

              <div className="relative flex items-center justify-center" style={{ width: '56px', minWidth: '56px' }}>
                {isFirstTimeUser && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg animate-bounce z-10">
                    Start here! 👆
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>
                )}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="ripple w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transform transition-transform active:scale-90 border-4 border-[#FDFCFB] dark:border-slate-900 -mt-2"
                  title="Add new entry"
                  aria-label="Add new entry"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>

              <MobileNavItem icon={<Calendar />} label="Calendar" isActive={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
              <MobileNavItem icon={<Briefcase />} label="Budget" isActive={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
              <MobileNavItem icon={<ArrowRightLeft />} label="History" isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
            </div>
          </nav>

          {/* ── Desktop FAB ── */}
          <div className="hidden md:flex fixed bottom-10 right-10 flex-col items-end z-20">
            {isFirstTimeUser && (
              <div className="mb-4 bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 relative animate-in fade-in slide-in-from-bottom-4">
                <span className="text-sm font-medium">Log your first coffee ☕</span>
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-800 rotate-45" />
              </div>
            )}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className={`ripple w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300 active:scale-95 ${
                isFirstTimeUser ? 'ring-4 ring-emerald-200 animate-pulse' : ''
              }`}
              title="Add new entry"
              aria-label="Add new entry"
            >
              <Plus size={28} strokeWidth={3} />
            </button>
          </div>

          {/* ── Add/Edit Transaction Modal ── */}
          {isAddModalOpen && (
            <AddTransactionModal
              onClose={() => {
                setIsAddModalOpen(false);
                setEditingTransaction(null);
              }}
              onAdd={handleAddTransaction}
              editTransaction={editingTransaction}
              categories={customCategories}
            />
          )}
        </div>
      )}
    </>
  );
}
