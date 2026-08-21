import SourceLink from './SourceLink';
import {
  getPagasaTone,
  normalizePagasaLevel,
  pagasaStatusLabel,
  type PagasaLevel,
} from '../utils/pagasa';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

interface PagasaBadgeProps {
  level: PagasaLevel | string;
  className?: string;
  /** Slightly denser chip for map overlays */
  compact?: boolean;
}

/**
 * Canonical PAGASA status chip — same copy + colors in header and spatial map.
 * Renders: "PAGASA: Yellow Warning" (exactly one "Warning").
 */
export default function PagasaBadge({ level, className = '', compact = false }: PagasaBadgeProps) {
  const normalized = normalizePagasaLevel(level);
  const tone = getPagasaTone(normalized);

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-sm font-semibold whitespace-nowrap ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${className}`}
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        border: `1px solid ${tone.border}`,
        ...SANS,
      }}
      aria-label={`PAGASA ${pagasaStatusLabel(normalized)}`}
    >
      <SourceLink
        source="pagasa"
        className="font-semibold underline decoration-current/30 underline-offset-2 hover:decoration-current/70"
        style={{ color: 'inherit' }}
      >
        PAGASA
      </SourceLink>
      <span>: {pagasaStatusLabel(normalized)}</span>
    </div>
  );
}
