import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Zap, Shield, BarChart3, PieChart, ArrowRight, ChevronRight,
  TrendingUp, Lock, Star,
  Clock, Code2, Heart, Sparkles, IndianRupee, Flame,
  Eye, Target, Layers, MousePointerClick, Rocket,
} from 'lucide-react';
import { SpendlyLogo } from '../components/SpendlyLogo';

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface AboutViewProps {
  onNavigate: (tab: string) => void;
}

// ─────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Zap size={24} />,
    title: 'Quick Expense Logging',
    description: 'Tap, pick from 19+ Indian daily presets like chai, auto, Swiggy — and you\'re done. Under 2 seconds.',
    color: 'amber' as const,
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Smart Insights',
    description: 'Auto-generated trend analysis, weekly heatmaps, and smart cards that surface your spending patterns.',
    color: 'blue' as const,
  },
  {
    icon: <PieChart size={24} />,
    title: 'Beautiful Reports',
    description: 'Five chart types — area trends, donuts, heatmaps, comparisons — all responsive and silky smooth.',
    color: 'emerald' as const,
  },
  {
    icon: <Shield size={24} />,
    title: 'Privacy Friendly',
    description: 'Zero servers. Zero accounts. Zero tracking. Everything stays in your browser\'s localStorage. Period.',
    color: 'violet' as const,
  },
];

const STEPS = [
  {
    num: 1,
    icon: <MousePointerClick size={28} />,
    title: 'Tap the + Button',
    description: 'Hit the big green button anywhere in the app. Pick from smart presets or type your own.',
  },
  {
    num: 2,
    icon: <IndianRupee size={28} />,
    title: 'Enter the Amount',
    description: 'Type how much you spent or earned. Spendly auto-categorizes it into Needs, Wants, or Savings.',
  },
  {
    num: 3,
    icon: <Eye size={28} />,
    title: 'See Your Story',
    description: 'Dashboard, insights, charts, and budgets update instantly. Watch your financial story unfold.',
  },
];

// ─────────────────────────────────────────────────────
// Scroll Reveal Hook (per-element)
// ─────────────────────────────────────────────────────

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.classList.add('revealed');
      return;
    }

    if (delay > 0) {
      el.style.transitionDelay = `${delay}ms`;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────

export function AboutView({ onNavigate }: AboutViewProps) {
  const [navSolid, setNavSolid] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Sticky nav background on scroll
  useEffect(() => {
    const handler = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Smooth exit transition before navigating to dashboard
  const handleCTAClick = useCallback((tab: string) => {
    setIsExiting(true);
    // Let the exit animation play, then navigate
    setTimeout(() => {
      onNavigate(tab);
    }, 400);
  }, [onNavigate]);

  const goToDashboard = useCallback(() => handleCTAClick('dashboard'), [handleCTAClick]);

  return (
    <div
      className={`min-h-screen bg-[#FDFCFB] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden transition-all duration-500 ease-out ${
        isExiting ? 'opacity-0 scale-[0.98] blur-sm' : 'opacity-100 scale-100 blur-0'
      }`}
    >

      {/* ━━━ 1. FLOATING NAVBAR ━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          navSolid
            ? 'bg-white/85 backdrop-blur-2xl shadow-[0_1px_3px_rgb(0,0,0,0.05)] border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SpendlyLogo className="w-8 h-8 sm:w-9 sm:h-9" />
            <span className={`text-lg sm:text-xl font-extrabold tracking-tight transition-colors duration-300 ${navSolid ? 'text-slate-800' : 'text-white'}`}>
              Spendly
            </span>
          </div>
          <button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          >
            Open Dashboard
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </nav>

      {/* ━━━ 2. HERO SECTION ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_60%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_30%,rgba(20,184,166,0.08),transparent)]" />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 right-[15%] w-72 h-72 bg-emerald-500/8 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-32 left-[10%] w-56 h-56 bg-teal-400/6 rounded-full blur-[80px]" style={{ animationDelay: '2s', animationDuration: '4s' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-24 pb-16 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/[0.07] backdrop-blur-sm px-4 py-1.5 rounded-full mb-8 border border-white/[0.08]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/60 text-[11px] sm:text-[12px] font-bold tracking-wider uppercase">
                  Free &amp; Open · Made for India
                </span>
              </div>

              <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.2rem] font-extrabold tracking-tight leading-[1.08] mb-6">
                <span className="text-white">Track every</span>
                <br />
                <span className="landing-gradient-text">rupee, effortlessly.</span>
              </h1>

              <p className="text-white/50 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                From your morning
                <span className="text-amber-300/90 font-semibold"> ₹10 chai </span>
                to your monthly
                <span className="text-emerald-300/90 font-semibold"> ₹50K salary </span>
                — Spendly makes daily expense tracking feel like second nature. No sign-ups. No cloud. Just you.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={goToDashboard}
                  className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300 active:scale-[0.97] w-full sm:w-auto justify-center"
                >
                  <Rocket size={20} />
                  Start Tracking
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-white/30 text-sm font-medium">
                  No sign-up needed · 100% free
                </p>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="shrink-0 hidden md:block">
              <PhoneMockup />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white text-[11px] font-bold tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ━━━ 3. TRUST / STATS BAR ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative -mt-1 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <StatPill icon={<Zap size={18} />} value="2-Second" label="Expense Logging" color="amber" />
            <StatPill icon={<Lock size={18} />} value="100%" label="Private & Offline" color="violet" />
            <StatPill icon={<IndianRupee size={18} />} value="₹0" label="Forever Free" color="emerald" />
            <StatPill icon={<Flame size={18} />} value="19+" label="Smart Quick Picks" color="rose" />
          </div>
        </div>
      </section>

      {/* ━━━ 4. FEATURES SECTION ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 bg-[#FDFCFB]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeader
            badge="Features"
            badgeIcon={<Sparkles size={14} />}
            badgeColor="emerald"
            title="Everything you need, nothing you don't"
            subtitle="Spendly replaces messy notes and spreadsheets with a beautiful, instant experience built for how Indians actually spend money."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 5. HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-[#FDFCFB] border-y border-emerald-100/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeader
            badge="How it works"
            badgeIcon={<Clock size={14} />}
            badgeColor="teal"
            title="Start tracking in 30 seconds"
            subtitle="Three simple steps. No tutorials, no learning curve."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 z-0" />

            {STEPS.map((s, i) => (
              <StepCard key={s.num} {...s} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 6. INSIGHTS HIGHLIGHT ━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 bg-[#FDFCFB]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <InsightsShowcase />
        </div>
      </section>

      {/* ━━━ 7. DEVELOPER / ABOUT SECTION ━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-24 bg-white border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <DeveloperSection />
        </div>
      </section>

      {/* ━━━ 8. FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.12),transparent)]" />
        <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-white/[0.06] rounded-full blur-3xl" />
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-white/[0.04] rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-20 sm:py-28 text-center">
          <RevealBlock>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full mb-8 border border-white/15">
              <Star size={14} className="text-yellow-200" />
              <span className="text-white/80 text-[12px] font-bold tracking-wider uppercase">Start your journey</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Ready to take control<br className="hidden sm:block" /> of your money?
            </h2>

            <p className="text-white/60 text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
              Your first entry is just a tap away. Open the dashboard, hit the
              <span className="inline-flex items-center justify-center w-7 h-7 bg-white/20 rounded-lg text-white text-sm font-extrabold mx-1.5 align-middle">+</span>
              button, and go.
            </p>

            <button
              onClick={goToDashboard}
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-emerald-600 font-extrabold text-lg shadow-2xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 active:scale-[0.97]"
            >
              <Rocket size={20} />
              Go to Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </button>

            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {['✨ Free forever', '🇮🇳 Made for India', '🔒 No sign-up', '❤️ Built with love'].map((t) => (
                <span key={t} className="bg-white/10 backdrop-blur-sm text-white/70 px-4 py-2 rounded-xl text-sm font-semibold border border-white/10">
                  {t}
                </span>
              ))}
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ━━━ 9. FOOTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-slate-950 text-white/40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <SpendlyLogo className="w-8 h-8" />
              <div>
                <span className="text-white font-extrabold text-lg tracking-tight">Spendly</span>
                <p className="text-[13px] mt-0.5">Track daily, spend happily. ✨</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm font-medium">
              <button onClick={goToDashboard} className="hover:text-white/70 transition-colors">Dashboard</button>
              <button onClick={() => handleCTAClick('analytics')} className="hover:text-white/70 transition-colors">Insights</button>
              <button onClick={() => handleCTAClick('budget')} className="hover:text-white/70 transition-colors">Budget</button>
              <button onClick={() => handleCTAClick('transactions')} className="hover:text-white/70 transition-colors">History</button>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px]">
            <p>© {new Date().getFullYear()} Spendly. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart size={13} className="text-rose-400 fill-rose-400" /> in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────

/** Scroll-reveal wrapper */
function RevealBlock({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useReveal(delay);
  return <div ref={ref} className={`reveal-on-scroll ${className}`}>{children}</div>;
}

/** Section header with badge + title */
function SectionHeader({
  badge, badgeIcon, badgeColor, title, subtitle,
}: {
  badge: string; badgeIcon: React.ReactNode; badgeColor: string; title: string; subtitle: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    teal: 'bg-teal-50 border-teal-100 text-teal-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
  };

  const ref = useReveal();

  return (
    <div ref={ref} className="reveal-on-scroll text-center mb-14 sm:mb-16">
      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border ${colorMap[badgeColor] || colorMap.emerald}`}>
        <span className="opacity-70">{badgeIcon}</span>
        <span className="text-[12px] font-bold uppercase tracking-wider">{badge}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-4 leading-tight">
        {title}
      </h2>
      <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

/** Stats bar pill */
function StatPill({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  const ref = useReveal();

  return (
    <div ref={ref} className="reveal-on-scroll flex flex-col items-center text-center gap-3 group">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center ${colorMap[color]} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">{value}</p>
        <p className="text-[12px] sm:text-[13px] text-slate-400 font-semibold mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/** Feature card */
function FeatureCard({ icon, title, description, color, delay }: {
  icon: React.ReactNode; title: string; description: string; color: 'amber' | 'blue' | 'emerald' | 'violet'; delay: number;
}) {
  const colorMap = {
    amber:   { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-600 bg-white shadow-amber-100/50' },
    blue:    { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600 bg-white shadow-blue-100/50' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600 bg-white shadow-emerald-100/50' },
    violet:  { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-600 bg-white shadow-violet-100/50' },
  };
  const c = colorMap[color];
  const ref = useReveal(delay);

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${c.bg} rounded-[2rem] p-7 sm:p-8 border ${c.border} group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 cursor-default`}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${c.icon} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-2.5 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-[14px] sm:text-[15px] leading-relaxed">{description}</p>
    </div>
  );
}

/** Step card */
function StepCard({ num, icon, title, description, delay }: {
  num: number; icon: React.ReactNode; title: string; description: string; delay: number;
}) {
  const colors = ['from-emerald-500 to-emerald-600', 'from-teal-500 to-teal-600', 'from-cyan-500 to-cyan-600'];
  const ref = useReveal(delay);

  return (
    <div ref={ref} className="reveal-on-scroll relative z-10">
      <div className="bg-white rounded-[2rem] p-7 sm:p-8 border border-slate-100 shadow-sm text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-400 h-full flex flex-col">
        {/* Number badge */}
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-br ${colors[num - 1]} text-white w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-extrabold shadow-lg`}>
          {num}
        </div>

        <div className={`w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br ${colors[num - 1]} rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto mb-6 mt-3`}>
          {icon}
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-2.5 tracking-tight">{title}</h3>
        <p className="text-slate-500 text-[14px] sm:text-[15px] leading-relaxed flex-1">{description}</p>
      </div>
    </div>
  );
}

/** Insights showcase section */
function InsightsShowcase() {
  const ref = useReveal();

  return (
    <div
      ref={ref}
      className="reveal-on-scroll relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden"
    >
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_50%,rgba(16,185,129,0.1),transparent)]" />
      <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/[0.06] rounded-full blur-[80px]" />

      <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left: Copy */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/[0.07] px-4 py-1.5 rounded-full mb-6 border border-white/[0.08]">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-white/60 text-[12px] font-bold tracking-wider uppercase">Smart Analytics</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-5 leading-tight">
            Insights that tell your<br className="hidden sm:block" />
            <span className="landing-gradient-text">money story</span>
          </h2>

          <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
            Five beautiful chart types that reveal your spending patterns, highlight trends, and help you understand where every rupee goes — all automatically.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-2">
            {['📈 Area Trends', '🍩 Donut Chart', '🟩 Heatmap', '🧠 Smart Cards', '📊 Income vs Expense'].map((tag) => (
              <span key={tag} className="px-3.5 py-1.5 bg-white/[0.08] text-white/70 rounded-xl text-[13px] font-semibold border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: CSS chart mockups */}
        <div className="shrink-0 w-full max-w-xs lg:max-w-sm">
          <div className="space-y-4">
            {/* Mini bar chart */}
            <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06]">
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-4">Weekly Spending</p>
              <div className="flex items-end gap-2 h-24">
                {[40, 70, 55, 90, 65, 45, 80].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md transition-all duration-700"
                    style={{
                      height: `${h}%`,
                      background: `linear-gradient(to top, ${i === 3 ? '#14B8A6' : '#10B981'}${i === 3 ? '' : '99'}, ${i === 3 ? '#10B981' : '#10B981'}44)`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="flex-1 text-center text-[10px] text-white/25 font-bold">{d}</span>
                ))}
              </div>
            </div>

            {/* Mini donut + categories */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06] flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: 'conic-gradient(#10B981 0% 38%, #14B8A6 38% 58%, #0EA5E9 58% 76%, #F59E0B 76% 88%, #F43F5E 88% 100%)',
                    }}
                  />
                  <div className="absolute inset-[25%] bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-[11px] font-extrabold text-white/80">₹25K</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06] space-y-2.5">
                {[
                  { c: '#10B981', l: 'Food', p: '38%' },
                  { c: '#14B8A6', l: 'Travel', p: '20%' },
                  { c: '#0EA5E9', l: 'Bills', p: '18%' },
                  { c: '#F59E0B', l: 'Fun', p: '12%' },
                ].map((item) => (
                  <div key={item.l} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.c }} />
                    <span className="text-white/50 text-[11px] font-semibold flex-1">{item.l}</span>
                    <span className="text-white/70 text-[11px] font-bold">{item.p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Developer / about section */
function DeveloperSection() {
  const ref = useReveal();

  return (
    <div ref={ref} className="reveal-on-scroll text-center">
      {/* Avatar */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100/50 border-4 border-white">
        <Code2 size={32} className="text-emerald-600" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-4">
        Built by someone who tracks<br className="hidden sm:block" /> every ₹10 chai too.
      </h2>

      <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
        Spendly started as a personal frustration — spreadsheets were too slow, apps wanted sign-ups,
        and nothing felt <em>made</em> for Indian daily life. So I built exactly what I wanted to use.
        Simple, fast, beautiful, and private.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {[
          { icon: <Layers size={14} />, label: 'React + Vite' },
          { icon: <Sparkles size={14} />, label: 'Tailwind CSS' },
          { icon: <BarChart3 size={14} />, label: 'Recharts' },
          { icon: <Heart size={14} />, label: 'Made with love' },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-sm">
            <span className="text-emerald-500">{b.icon}</span>
            <span className="text-slate-600 font-semibold">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Phone mockup with fake Spendly UI */
function PhoneMockup() {
  return (
    <div className="phone-tilt relative">
      {/* Glow behind phone */}
      <div className="absolute inset-0 bg-emerald-500/10 rounded-[3rem] blur-[60px] scale-110" />

      {/* Phone frame */}
      <div className="relative w-[270px] sm:w-[290px] h-[550px] sm:h-[580px] rounded-[2.5rem] border-[5px] border-slate-700/80 bg-slate-800 shadow-2xl shadow-black/40 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-800 rounded-b-2xl z-20" />
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-20" />

        {/* Screen */}
        <div className="absolute inset-[1px] rounded-[2.3rem] bg-[#FDFCFB] overflow-hidden">
          {/* Status bar */}
          <div className="h-11 bg-white flex items-end justify-between px-7 pb-1">
            <span className="text-[10px] font-bold text-slate-800">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-2 border border-slate-800 rounded-sm relative">
                <div className="absolute inset-[1px] bg-emerald-500 rounded-[1px]" style={{ width: '65%' }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="px-4 py-2.5 flex items-center gap-2">
            <SpendlyLogo className="w-5 h-5" />
            <span className="text-[13px] font-extrabold text-slate-800">Dashboard</span>
          </div>

          {/* Balance card */}
          <div className="mx-3.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-3.5 text-white shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] text-slate-300 font-semibold">Available Cash</p>
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <Target size={10} className="text-white/70" />
              </div>
            </div>
            <p className="text-xl font-extrabold tracking-tight">₹24,500</p>
          </div>

          {/* Mini stat cards */}
          <div className="grid grid-cols-2 gap-2 mx-3.5 mt-2.5">
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
              <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">Income</p>
              <p className="text-[14px] font-extrabold text-slate-800 mt-0.5">₹50,000</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-2.5 border border-rose-100">
              <p className="text-[8px] text-rose-500 font-bold uppercase tracking-wider">Spent</p>
              <p className="text-[14px] font-extrabold text-slate-800 mt-0.5">₹25,500</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="mx-3.5 mt-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">Recent</p>
            {[
              { emoji: '☕', name: 'Morning Chai', amount: '-₹15', cat: 'Food', color: 'bg-amber-100' },
              { emoji: '🛺', name: 'Auto Ride', amount: '-₹40', cat: 'Transport', color: 'bg-yellow-100' },
              { emoji: '🛒', name: 'Groceries', amount: '-₹350', cat: 'Groceries', color: 'bg-emerald-100' },
              { emoji: '💰', name: 'Salary Credit', amount: '+₹50K', cat: 'Income', color: 'bg-emerald-50', income: true },
            ].map((tx) => (
              <div key={tx.name} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-2 border border-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 ${tx.color} rounded-lg flex items-center justify-center text-[12px]`}>
                    {tx.emoji}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{tx.name}</p>
                    <p className="text-[8px] text-slate-400 font-medium">{tx.cat}</p>
                  </div>
                </div>
                <p className={`text-[10px] font-extrabold ${tx.income ? 'text-emerald-500' : 'text-slate-700'}`}>
                  {tx.amount}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom FAB */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 text-lg font-bold">
              +
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
