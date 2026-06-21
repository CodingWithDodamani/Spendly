import React, { type ReactElement } from 'react';

/** Prop shape accepted by lucide-react icon components */
interface IconProps {
  size?: number;
  strokeWidth?: number;
}

/* ── Desktop Sidebar Nav Item ─────────────────────── */

interface NavItemProps {
  icon: ReactElement<IconProps>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`ripple w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
        isActive
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
      }`}
    >
      <span
        className={`${
          isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-500'
        } transition-colors`}
      >
        {React.cloneElement(icon, { size: 22 })}
      </span>
      {label}
    </button>
  );
}

/* ── Mobile Bottom Nav Item ───────────────────────── */

interface MobileNavItemProps {
  icon: ReactElement<IconProps>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function MobileNavItem({ icon, label, isActive, onClick }: MobileNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[56px] gap-0.5 px-1 transition-colors duration-200 ${
        isActive ? 'text-emerald-500' : 'text-slate-400'
      }`}
    >
      <span className={isActive ? '' : ''}>
        {React.cloneElement(icon, { size: 22, strokeWidth: isActive ? 3 : 1.5 })}
      </span>
      <span
        className={`text-[10px] font-bold tracking-wide leading-tight ${
          isActive ? 'opacity-100' : 'opacity-70'
        }`}
      >
        {label}
      </span>
      {isActive && (
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-emerald-500" />
      )}
    </button>
  );
}
