/**
 * Transaction schema and validation for Spendly.
 * Ensures data integrity for localStorage persistence
 * and protects against corrupted or malformed entries.
 */

/** Valid payment modes for Indian users */
export const PAYMENT_MODES = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'] as const;

/** Default expense categories (always present, cannot be deleted) */
export const DEFAULT_CATEGORIES = [
  'Food & Drink', 'Transport', 'Shopping', 'Bills',
  'Groceries', 'Entertainment', 'Health', 'Education',
  'Travel', 'Personal', 'Gifts', 'Subscriptions',
] as const;

export function validateCategoryList(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}
export type PaymentMode = typeof PAYMENT_MODES[number];

/** Strict transaction shape — the single source of truth for all transaction data. */
export interface Transaction {
  /** Unique identifier (timestamp-based) */
  id: number;
  /** Monetary value — always a positive number */
  amount: number;
  /** Direction of money flow */
  type: 'income' | 'expense';
  /** Spending category (e.g., "Food & Drink", "Transport") */
  category: string;
  /** User-provided note describing the transaction */
  description: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Budget bucket for 50/30/20 rule: Needs, Wants, Savings, or Income */
  budgetCategory: string;
  /** How the payment was made (Cash, UPI, Credit Card, etc.) */
  paymentMode: PaymentMode;
}

/** Recurring transaction template */
export interface RecurringTransaction {
  /** Unique identifier */
  id: number;
  /** Transaction template fields */
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  budgetCategory: string;
  paymentMode: PaymentMode;
  /** Recurrence frequency */
  frequency: 'daily' | 'weekly' | 'monthly';
  /** ISO date string (YYYY-MM-DD) when this was last auto-logged */
  lastTriggered: string;
  /** ISO date string (YYYY-MM-DD) when this recurring entry was created */
  createdDate: string;
  /** Whether this recurring entry is active */
  active: boolean;
}

const VALID_TYPES: ReadonlyArray<Transaction['type']> = ['income', 'expense'];

/**
 * Validates and normalizes a raw input into a strict Transaction shape.
 * Applies defensive defaults for any missing or invalid fields.
 */
export function validateTransaction(input: Partial<Transaction>): Transaction {
  const type = VALID_TYPES.includes(input.type as Transaction['type'])
    ? (input.type as Transaction['type'])
    : 'expense';

  return {
    id: typeof input.id === 'number' && input.id > 0 ? input.id : Date.now(),
    amount:
      typeof input.amount === 'number' && !isNaN(input.amount) && input.amount >= 0
        ? input.amount
        : 0,
    type,
    category:
      typeof input.category === 'string' && input.category.trim()
        ? input.category.trim()
        : type === 'income'
          ? 'Income'
          : 'Uncategorized',
    description:
      typeof input.description === 'string' && input.description.trim()
        ? input.description.trim()
        : 'Untitled',
    date:
      typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
        ? input.date
        : new Date().toISOString().split('T')[0],
    budgetCategory:
      typeof input.budgetCategory === 'string' && input.budgetCategory.trim()
        ? input.budgetCategory.trim()
        : type === 'income'
          ? 'Income'
          : 'Needs',
    paymentMode:
      typeof input.paymentMode === 'string' && (PAYMENT_MODES as readonly string[]).includes(input.paymentMode)
        ? input.paymentMode
        : 'Cash',
  };
}

/**
 * Validates an array of transactions hydrated from localStorage.
 * Silently filters out entries that can't be salvaged.
 */
export function validateTransactionList(data: unknown): Transaction[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object',
    )
    .map((item) => validateTransaction(item as Partial<Transaction>));
}

/**
 * Validates a recurring transaction from localStorage.
 */
export function validateRecurringTransaction(input: Partial<RecurringTransaction>): RecurringTransaction {
  const type = VALID_TYPES.includes(input.type as Transaction['type'])
    ? (input.type as Transaction['type'])
    : 'expense';

  const today = new Date().toISOString().split('T')[0];

  return {
    id: typeof input.id === 'number' && input.id > 0 ? input.id : Date.now(),
    amount: typeof input.amount === 'number' && !isNaN(input.amount) && input.amount >= 0 ? input.amount : 0,
    type,
    category: typeof input.category === 'string' && input.category.trim() ? input.category.trim() : 'Uncategorized',
    description: typeof input.description === 'string' && input.description.trim() ? input.description.trim() : 'Untitled',
    budgetCategory: typeof input.budgetCategory === 'string' && input.budgetCategory.trim() ? input.budgetCategory.trim() : 'Needs',
    paymentMode: typeof input.paymentMode === 'string' && (PAYMENT_MODES as readonly string[]).includes(input.paymentMode) ? input.paymentMode : 'Cash',
    frequency: (['daily', 'weekly', 'monthly'] as const).includes(input.frequency as 'daily' | 'weekly' | 'monthly') ? input.frequency! : 'monthly',
    lastTriggered: typeof input.lastTriggered === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.lastTriggered) ? input.lastTriggered : today,
    createdDate: typeof input.createdDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.createdDate) ? input.createdDate : today,
    active: typeof input.active === 'boolean' ? input.active : true,
  };
}

// ─────────────────────────────────────────────────────
// Spending Goals
// ─────────────────────────────────────────────────────

export interface SpendingGoal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  icon: string;
}

export function validateGoal(input: Partial<SpendingGoal>): SpendingGoal {
  return {
    id: typeof input.id === 'number' && input.id > 0 ? input.id : Date.now(),
    title: typeof input.title === 'string' && input.title.trim() ? input.title.trim() : 'Untitled Goal',
    targetAmount: typeof input.targetAmount === 'number' && !isNaN(input.targetAmount) && input.targetAmount > 0 ? input.targetAmount : 0,
    currentAmount: typeof input.currentAmount === 'number' && !isNaN(input.currentAmount) && input.currentAmount >= 0 ? input.currentAmount : 0,
    createdAt: typeof input.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.createdAt) ? input.createdAt : new Date().toISOString().split('T')[0],
    icon: typeof input.icon === 'string' ? input.icon : '🎯',
  };
}

export function validateGoalList(data: unknown): SpendingGoal[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => validateGoal(item as Partial<SpendingGoal>));
}

// ─────────────────────────────────────────────────────
// Spending Limits
// ─────────────────────────────────────────────────────

export interface SpendingLimit {
  enabled: boolean;
  period: 'daily' | 'weekly' | 'monthly';
  amount: number;
}

export function validateLimit(input: unknown): SpendingLimit {
  const data = (input && typeof input === 'object' ? input : {}) as Partial<SpendingLimit>;
  return {
    enabled: typeof data.enabled === 'boolean' ? data.enabled : false,
    period: (['daily', 'weekly', 'monthly'] as const).includes(data.period as 'daily' | 'weekly' | 'monthly') ? data.period! : 'daily',
    amount: typeof data.amount === 'number' && !isNaN(data.amount) && data.amount > 0 ? data.amount : 0,
  };
}

/**
 * Validates an array of recurring transactions from localStorage.
 */
export function validateRecurringList(data: unknown): RecurringTransaction[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => validateRecurringTransaction(item as Partial<RecurringTransaction>));
}
