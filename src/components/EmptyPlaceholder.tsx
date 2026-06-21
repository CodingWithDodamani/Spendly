interface EmptyPlaceholderProps {
  message: string;
}

/**
 * A minimal dashed-border placeholder for empty-state sections.
 */
export function EmptyPlaceholder({ message }: EmptyPlaceholderProps) {
  return (
    <div className="h-48 w-full border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-[2rem] flex items-center justify-center text-slate-400 dark:text-slate-500 text-[15px] font-bold bg-slate-50/50 dark:bg-slate-800/50">
      {message}
    </div>
  );
}
