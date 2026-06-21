import { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

/**
 * Accessible info tooltip that reveals explanatory text on click/tap.
 * Uses fixed positioning to avoid being clipped by overflow-hidden parents.
 * Works on both desktop (hover + click) and mobile (tap).
 */
export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 224; // w-56 = 14rem = 224px
    const tooltipHeight = 80; // approximate

    // Position above the icon, centered
    let top = rect.top - tooltipHeight - 8;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // If tooltip would go above viewport, show below instead
    if (top < 8) {
      top = rect.bottom + 8;
    }

    // Clamp horizontal position to viewport
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }

    setPosition({ top, left });
  }, []);

  const toggle = useCallback(() => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, updatePosition]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as unknown as EventListener);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as unknown as EventListener);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        onMouseEnter={() => {
          updatePosition();
          setIsOpen(true);
        }}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center justify-center ml-2 align-middle focus:outline-none"
        aria-label="More info"
      >
        <HelpCircle
          size={15}
          className={`cursor-help transition-colors duration-300 ${
            isOpen ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'
          }`}
        />
      </button>

      {/* Tooltip rendered via fixed positioning — never clipped */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed w-56 p-3.5 bg-slate-800 text-white text-[12.5px] leading-relaxed rounded-2xl shadow-2xl font-medium normal-case tracking-normal text-left animate-in fade-in duration-150"
          style={{
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
        >
          {text}
          <div
            className="absolute w-3 h-3 bg-slate-800 rotate-45"
            style={{
              bottom: -5,
              left: '50%',
              marginLeft: -6,
            }}
          />
        </div>
      )}
    </>
  );
}
