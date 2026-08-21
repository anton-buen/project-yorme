import type { ComponentType, ReactNode } from 'react';

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

interface IconHintProps {
  icon: IconComponent;
  /** Primary label shown in the hover tooltip */
  label: string;
  /** Optional secondary line in the tooltip */
  detail?: string;
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
  /** Tooltip opens above (default) or below the icon */
  side?: 'top' | 'bottom';
}

/**
 * Compact symbol with a hover/focus tooltip for the full label.
 * Keeps the UI scannable while preserving discoverability and a11y.
 */
export default function IconHint({
  icon: Icon,
  label,
  detail,
  className = '',
  iconClassName = 'w-4 h-4',
  children,
  side = 'top',
}: IconHintProps) {
  const tip = detail ? `${label} — ${detail}` : label;
  const tipPosition =
    side === 'bottom'
      ? 'left-1/2 top-full mt-2 -translate-x-1/2'
      : 'left-1/2 bottom-full mb-2 -translate-x-1/2';

  return (
    <span
      className={`relative inline-flex items-center justify-center group/hint outline-none ${className}`}
      tabIndex={0}
      aria-label={tip}
      title={tip}
    >
      {children ?? (
        <Icon
          className={`${iconClassName} transition-opacity duration-150 group-hover/hint:opacity-80`}
          aria-hidden={true}
        />
      )}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-sm bg-slate-900 px-2.5 py-1.5 text-left opacity-0 shadow-lg ring-1 ring-slate-700/80 transition-opacity duration-150 group-hover/hint:opacity-100 group-focus-visible/hint:opacity-100 ${tipPosition}`}
      >
        <span className="block text-[11px] font-semibold text-white leading-tight">{label}</span>
        {detail && (
          <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">{detail}</span>
        )}
      </span>
    </span>
  );
}
