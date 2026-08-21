import type { ComponentType, ReactNode } from 'react';

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

interface IconHintProps {
  icon: IconComponent;
  /** Primary label — shown inline when showLabel, otherwise in tooltip */
  label: string;
  /** Optional secondary line (tooltip only, or aria when showLabel) */
  detail?: string;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  children?: ReactNode;
  /** Tooltip opens above (default) or below the icon */
  side?: 'top' | 'bottom';
  /** When true, render icon + visible label (no hover tooltip) */
  showLabel?: boolean;
}

/**
 * Compact symbol. Use showLabel for icon+text rows; omit it for icon-only
 * with a hover/focus tooltip.
 */
export default function IconHint({
  icon: Icon,
  label,
  detail,
  className = '',
  iconClassName = 'w-4 h-4',
  labelClassName = 'text-xs font-medium',
  children,
  side = 'top',
  showLabel = false,
}: IconHintProps) {
  const tip = detail ? `${label} — ${detail}` : label;
  const tipPosition =
    side === 'bottom'
      ? 'left-1/2 top-full mt-2 -translate-x-1/2'
      : 'left-1/2 bottom-full mb-2 -translate-x-1/2';

  if (showLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}
        aria-label={tip}
        title={detail || undefined}
      >
        {children ?? <Icon className={`${iconClassName} shrink-0`} aria-hidden={true} />}
        <span className={`min-w-0 ${labelClassName}`}>{label}</span>
      </span>
    );
  }

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
