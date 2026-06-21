import { useMemo, useState } from 'react';
import { Home, ShoppingBag, Target, IndianRupee, Plus, X } from 'lucide-react';
import type { Transaction, SpendingGoal } from '../utils/validation';
import { InfoTooltip } from '../components/InfoTooltip';
import { BudgetCard } from '../components/BudgetCard';
import { SpendingGoalCard } from '../components/SpendingGoalCard';

interface BudgetPlannerViewProps {
  transactions: Transaction[];
  salaryConfig: string;
  setSalaryConfig: (value: string) => void;
  goals: SpendingGoal[];
  setGoals: (goals: SpendingGoal[]) => void;
}

const rules = {
  needs: { percentage: 0.5, label: 'Needs (50%)', description: 'Rent, groceries, utilities.' },
  wants: { percentage: 0.3, label: 'Wants (30%)', description: 'Shopping, dining out, fun.' },
  savings: { percentage: 0.2, label: 'Savings (20%)', description: 'Investments, emergency fund.' },
} as const;

const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '🎓', '💍', '🏥', '📱', '💻', '🏋️', '🎮', '👶', '🌴', '🏦', '💰'];

export function BudgetPlannerView({
  transactions,
  salaryConfig,
  setSalaryConfig,
  goals,
  setGoals,
}: BudgetPlannerViewProps) {
  const currentSalary = Number(salaryConfig) || 0;
  const budgets = {
    needs: currentSalary * rules.needs.percentage,
    wants: currentSalary * rules.wants.percentage,
    savings: currentSalary * rules.savings.percentage,
  };

  const spent = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let savings = 0;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    transactions.forEach((t) => {
      if (t.type === 'expense' && t.date.startsWith(currentMonthStr)) {
        if (t.budgetCategory === 'Needs') needs += t.amount;
        if (t.budgetCategory === 'Wants') wants += t.amount;
        if (t.budgetCategory === 'Savings') savings += t.amount;
      }
    });
    return { needs, wants, savings };
  }, [transactions]);

  // ── Goal management ──
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SpendingGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('🎯');

  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalTarget('');
    setGoalIcon('🎯');
    setShowGoalForm(true);
  };

  const openEditGoal = (goal: SpendingGoal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTarget(String(goal.targetAmount));
    setGoalIcon(goal.icon);
    setShowGoalForm(true);
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim() || !parseFloat(goalTarget) || parseFloat(goalTarget) <= 0) return;
    if (editingGoal) {
      setGoals(goals.map((g) => g.id === editingGoal.id ? { ...g, title: goalTitle.trim(), targetAmount: parseFloat(goalTarget), icon: goalIcon } : g));
    } else {
      setGoals([{ id: Date.now(), title: goalTitle.trim(), targetAmount: parseFloat(goalTarget), currentAmount: 0, createdAt: new Date().toISOString().split('T')[0], icon: goalIcon }, ...goals]);
    }
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Income Input */}
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 w-full">
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 flex items-center tracking-tight">
            50/30/20 Guide
            <InfoTooltip text="A simple rule: half on needs, a bit on fun, and save the rest." />
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl leading-relaxed text-lg">
            Tell us your expected monthly income, and we&apos;ll show you exactly how much you can
            comfortably spend.
          </p>
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <IndianRupee size={22} className="text-slate-400" />
            </div>
            <input
              type="number"
              value={salaryConfig}
              onChange={(e) => setSalaryConfig(e.target.value)}
              placeholder="e.g. 50000"
              className="block w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-emerald-200 rounded-[1.5rem] text-slate-800 dark:text-white font-extrabold text-xl focus:ring-0 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Budget Cards */}
      {currentSalary > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BudgetCard
            title={rules.needs.label}
            description={rules.needs.description}
            budgeted={budgets.needs}
            spent={spent.needs}
            color="blue"
            icon={<Home size={22} />}
          />
          <BudgetCard
            title={rules.wants.label}
            description={rules.wants.description}
            budgeted={budgets.wants}
            spent={spent.wants}
            color="rose"
            icon={<ShoppingBag size={22} />}
          />
          <BudgetCard
            title={rules.savings.label}
            description={rules.savings.description}
            budgeted={budgets.savings}
            spent={spent.savings}
            color="emerald"
            icon={<Target size={22} />}
          />
        </div>
      ) : (
        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 border-dashed rounded-[2.5rem] p-16 text-center text-emerald-500 dark:text-emerald-400 font-bold text-lg">
          Pop in your monthly income above to see the magic happen! ✨
        </div>
      )}

      {/* ── Savings Goals ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Savings Goals</h3>
              <p className="text-[13px] text-slate-400 dark:text-slate-500 font-medium">Track progress toward what matters</p>
            </div>
          </div>
          <button
            onClick={openAddGoal}
            className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-2xl font-bold text-amber-700 dark:text-amber-400 text-[13px] transition-all"
          >
            <Plus size={16} />
            New Goal
          </button>
        </div>

        {/* Goal Form */}
        {showGoalForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-slate-800 dark:text-white">{editingGoal ? 'Edit Goal' : 'New Goal'}</h4>
              <button onClick={() => { setShowGoalForm(false); setEditingGoal(null); }} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={14} /></button>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Title</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 dark:text-white font-bold focus:ring-0 outline-none"
                placeholder="e.g. Trip to Goa, Emergency Fund..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Target Amount (₹)</label>
              <input
                type="number"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-emerald-200 rounded-xl text-slate-800 dark:text-white font-bold focus:ring-0 outline-none"
                placeholder="e.g. 50000"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setGoalIcon(ic)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
                      goalIcon === ic
                        ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 scale-110 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveGoal}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-extrabold text-[15px] shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
            >
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        )}

        {/* Goal List */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <SpendingGoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditGoal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        ) : !showGoalForm && (
          <div className="bg-amber-50/30 dark:bg-amber-900/10 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-2xl p-12 text-center">
            <span className="text-4xl mb-3 block">🎯</span>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No goals yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-[14px] mt-1">Set a savings goal and track your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
}