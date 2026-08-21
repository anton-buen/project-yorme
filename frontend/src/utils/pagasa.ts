/** Shared PAGASA rainfall-warning levels, colors, and badge copy. */

export type PagasaLevel = 'NONE' | 'YELLOW' | 'ORANGE' | 'RED';

export interface PagasaTone {
  /** Solid badge / chip background */
  bg: string;
  /** Foreground text on the badge */
  text: string;
  /** Optional border / ring */
  border: string;
}

/**
 * Saturated, high-contrast tones so header/map badges match severity
 * (and Yellow stays readable — dark ink on amber, not washed white-on-peach).
 */
export const PAGASA_TONES: Record<PagasaLevel, PagasaTone> = {
  NONE: { bg: '#64748b', text: '#f8fafc', border: '#94a3b8' }, // slate
  YELLOW: { bg: '#eab308', text: '#0f172a', border: '#ca8a04' }, // amber + dark ink
  ORANGE: { bg: '#ea580c', text: '#fff7ed', border: '#c2410c' },
  RED: { bg: '#dc2626', text: '#fef2f2', border: '#b91c1c' },
};

/** Single-line status after "PAGASA:" — never duplicates the word "Warning". */
export function pagasaStatusLabel(level: PagasaLevel): string {
  switch (level) {
    case 'NONE':
      return 'No Warning';
    case 'YELLOW':
      return 'Yellow Warning';
    case 'ORANGE':
      return 'Orange Warning';
    case 'RED':
      return 'Red Warning';
    default:
      return 'No Warning';
  }
}

export function getPagasaTone(level: PagasaLevel | string | null | undefined): PagasaTone {
  const key = (level ?? 'NONE').toString().toUpperCase() as PagasaLevel;
  return PAGASA_TONES[key] ?? PAGASA_TONES.NONE;
}

/** Normalize API / timeline values to a known enum. */
export function normalizePagasaLevel(value: unknown): PagasaLevel {
  const raw = String(value ?? 'NONE').toUpperCase().trim();
  if (raw === 'YELLOW' || raw === 'ORANGE' || raw === 'RED' || raw === 'NONE') {
    return raw;
  }
  // Tolerate verbose strings like "Yellow Warning"
  if (raw.includes('RED')) return 'RED';
  if (raw.includes('ORANGE')) return 'ORANGE';
  if (raw.includes('YELLOW')) return 'YELLOW';
  return 'NONE';
}
