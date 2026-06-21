import { useState, useEffect } from 'react';
import {
  IndianRupee,
  Coffee,
  Bike,
  ShoppingCart,
  Zap,
  Smartphone,
  Pill,
  Home,
  Clapperboard,
  UtensilsCrossed,
  Fuel,
  Droplets,
  Shirt,
  Gift,
  Scissors,
  Bus,
  GraduationCap,
  Dumbbell,
  type LucideIcon,
  CreditCard,
  Banknote,
  Wallet,
  Globe,
  QrCode,
  Calendar,
} from 'lucide-react';
import { type Transaction, type PaymentMode, PAYMENT_MODES, validateTransaction } from '../utils/validation';

// ────────────────────────────────────────────────────
// Quick-select presets for common Indian daily expenses
// ────────────────────────────────────────────────────

interface QuickOption {
  label: string;
  emoji: string;
  icon: LucideIcon;
  category: string;
  budgetCategory: 'Needs' | 'Wants' | 'Savings';
  color: string;
  bgColor: string;
}

const EXPENSE_QUICK_OPTIONS: QuickOption[] = [
  { label: 'Chai / Coffee', emoji: '☕', icon: Coffee, category: 'Food & Drink', budgetCategory: 'Wants', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { label: 'Swiggy / Zomato', emoji: '🍕', icon: UtensilsCrossed, category: 'Food & Drink', budgetCategory: 'Wants', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { label: 'Auto / Ola / Uber', emoji: '🛺', icon: Bike, category: 'Transport', budgetCategory: 'Needs', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { label: 'Groceries / Kirana', emoji: '🛒', icon: ShoppingCart, category: 'Groceries', budgetCategory: 'Needs', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { label: 'Petrol / Diesel', emoji: '⛽', icon: Fuel, category: 'Transport', budgetCategory: 'Needs', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { label: 'Mobile Recharge', emoji: '📱', icon: Smartphone, category: 'Bills', budgetCategory: 'Needs', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { label: 'Electricity Bill', emoji: '💡', icon: Zap, category: 'Bills', budgetCategory: 'Needs', color: 'text-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  { label: 'Water Bill', emoji: '💧', icon: Droplets, category: 'Bills', budgetCategory: 'Needs', color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100' },
  { label: 'Medical / Pharmacy', emoji: '💊', icon: Pill, category: 'Bills', budgetCategory: 'Needs', color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { label: 'Rent', emoji: '🏠', icon: Home, category: 'Bills', budgetCategory: 'Needs', color: 'text-violet-600', bgColor: 'bg-violet-50 border-violet-200 hover:bg-violet-100' },
  { label: 'Amazon / Flipkart', emoji: '📦', icon: ShoppingCart, category: 'Shopping', budgetCategory: 'Wants', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { label: 'Movies / Netflix', emoji: '🎬', icon: Clapperboard, category: 'Entertainment', budgetCategory: 'Wants', color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
  { label: 'Dining Out', emoji: '🍽️', icon: UtensilsCrossed, category: 'Food & Drink', budgetCategory: 'Wants', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
  { label: 'Metro / Bus', emoji: '🚌', icon: Bus, category: 'Transport', budgetCategory: 'Needs', color: 'text-sky-600', bgColor: 'bg-sky-50 border-sky-200 hover:bg-sky-100' },
  { label: 'Clothes / Fashion', emoji: '👕', icon: Shirt, category: 'Shopping', budgetCategory: 'Wants', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100' },
  { label: 'Salon / Grooming', emoji: '💇', icon: Scissors, category: 'Shopping', budgetCategory: 'Wants', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { label: 'Gym / Fitness', emoji: '🏋️', icon: Dumbbell, category: 'Bills', budgetCategory: 'Needs', color: 'text-lime-600', bgColor: 'bg-lime-50 border-lime-200 hover:bg-lime-100' },
  { label: 'Tuition / Coaching', emoji: '📚', icon: GraduationCap, category: 'Bills', budgetCategory: 'Needs', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { label: 'Gift / Shagun', emoji: '🎁', icon: Gift, category: 'Shopping', budgetCategory: 'Wants', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200 hover:bg-red-100' },
];

const INCOME_QUICK_OPTIONS: { label: string; emoji: string }[] = [
  { label: 'Salary', emoji: '💰' },
  { label: 'Freelance', emoji: '💻' },
  { label: 'Refund', emoji: '↩️' },
  { label: 'Gift Received', emoji: '🎁' },
  { label: 'Cashback', emoji: '🏷️' },
  { label: 'Interest', emoji: '🏦' },
  { label: 'Side Hustle', emoji: '🚀' },
  { label: 'Sold Item', emoji: '🏪' },
];

const PAYMENT_MODE_ICONS: Record<PaymentMode, React.ReactNode> = {
  'Cash': <Banknote size={16} />,
  'UPI': <QrCode size={16} />,
  'Credit Card': <CreditCard size={16} />,
  'Debit Card': <CreditCard size={16} />,
  'Net Banking': <Globe size={16} />,
  'Wallet': <Wallet size={16} />,
};

// ────────────────────────────────────────────────────

interface AddTransactionModalProps {
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  /** If provided, the modal is in edit mode and pre-fills with this transaction */
  editTransaction?: Transaction | null;
}

export function AddTransactionModal({ onClose, onAdd, editTransaction }: AddTransactionModalProps) {
  const isEditing = !!editTransaction;

  const [type, setType] = useState<'income' | 'expense'>(editTransaction?.type ?? 'expense');
  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '');
  const [category, setCategory] = useState(editTransaction?.category ?? 'Groceries');
  const [description, setDescription] = useState(editTransaction?.description ?? '');
  const [budgetCategory, setBudgetCategory] = useState(editTransaction?.budgetCategory ?? 'Needs');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(editTransaction?.paymentMode ?? 'Cash');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(editTransaction?.date ?? today);
  const [selectedQuick, setSelectedQuick] = useState<number | null>(null);

  // Pre-select quick option if editing and description matches
  useEffect(() => {
    if (editTransaction && editTransaction.type === 'expense') {
      const idx = EXPENSE_QUICK_OPTIONS.findIndex((o) => o.label === editTransaction.description);
      if (idx >= 0) setSelectedQuick(idx);
    }
  }, [editTransaction]);

  // When user picks a quick option, auto-fill all fields
  const handleQuickSelect = (index: number, option: QuickOption) => {
    setSelectedQuick(index);
    setDescription(option.label);
    setCategory(option.category);
    setBudgetCategory(option.budgetCategory);
  };

  const handleIncomeQuickSelect = (index: number, label: string) => {
    setSelectedQuick(index);
    setDescription(label);
  };

  // Reset quick-select when switching type
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setSelectedQuick(null);
    setDescription('');
    setCategory('Groceries');
    setBudgetCategory('Needs');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const validated = validateTransaction({
      id: editTransaction?.id ?? Date.now(),
      type,
      amount: parseFloat(amount),
      category: type === 'income' ? 'Income' : category,
      description,
      budgetCategory: type === 'income' ? 'Income' : budgetCategory,
      date,
      paymentMode,
    });

    onAdd(validated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-0 md:px-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white dark:bg-slate-800 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-in md:zoom-in-95 fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300 ease-out overflow-hidden max-h-[92vh] flex flex-col">
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isEditing ? 'Edit Entry' : 'Add Entry'}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-5 md:space-y-6 overflow-y-auto flex-1">
          {/* Type toggle */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-700 rounded-2xl relative">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-3 text-[15px] font-bold rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-600 text-rose-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-700'
                }`}
              >
                Spent Money
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-3 text-[15px] font-bold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-600 text-emerald-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-700'
                }`}
            >
              Got Paid
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <IndianRupee size={20} className="text-slate-400" />
              </div>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-extrabold text-xl focus:ring-0 focus:bg-white transition-all outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* ── Quick Select Pills ── */}
          <div>
            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">
              {type === 'expense' ? '⚡ Quick Pick — What did you spend on?' : '⚡ Quick Pick — Where did it come from?'}
            </label>

            {type === 'expense' ? (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 pb-1 scrollbar-thin">
                {EXPENSE_QUICK_OPTIONS.map((option, idx) => {
                  const isSelected = selectedQuick === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickSelect(idx, option)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-bold border transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]'
                          : `${option.bgColor} ${option.color} border`
                      }`}
                    >
                      <span className="text-sm">{option.emoji}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {INCOME_QUICK_OPTIONS.map((option, idx) => {
                  const isSelected = selectedQuick === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIncomeQuickSelect(idx, option.label)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-bold border transition-all duration-200 active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 scale-[1.02]'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <span className="text-sm">{option.emoji}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── OR Custom Description ── */}
          <div>
            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-8 h-px bg-slate-200" />
              Or type your own
              <span className="w-8 h-px bg-slate-200" />
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSelectedQuick(null); // deselect pill if user types custom
              }}
              className="block w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-bold text-lg focus:ring-0 focus:bg-white transition-all outline-none"
              placeholder={
                type === 'expense'
                  ? 'e.g. Swiggy, Uber, Chai...'
                  : 'e.g. Salary, Freelance...'
              }
            />
          </div>

          {/* ── Date Picker ── */}
          <div>
            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <Calendar size={14} />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-bold focus:ring-0 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Category & Budget Bucket (expenses only) */}
          {type === 'expense' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-bold focus:ring-0 outline-none appearance-none"
                  title="Select category"
                  aria-label="Select category"
                >
                  <option>Food & Drink</option>
                  <option>Transport</option>
                  <option>Shopping</option>
                  <option>Bills</option>
                  <option>Groceries</option>
                  <option>Entertainment</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-2 block whitespace-nowrap">
                  Budget Bucket
                </label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-200 rounded-2xl text-slate-800 font-bold focus:ring-0 outline-none appearance-none"
                  title="Select budget bucket"
                  aria-label="Select budget bucket"
                >
                  <option value="Needs">Needs</option>
                  <option value="Wants">Wants</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Payment Mode ── */}
          <div>
            <label className="text-[12px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">
              💳 Paid Via
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold border transition-all duration-200 active:scale-95 ${
                    paymentMode === mode
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {PAYMENT_MODE_ICONS[mode]}
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="ripple w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-extrabold text-lg shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98]"
          >
            {isEditing ? 'Save Changes' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
