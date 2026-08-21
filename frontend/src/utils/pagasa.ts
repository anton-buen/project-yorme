/**
 * PAGASA Rainfall Warning Utilities.
 * 
 * Provides type definitions, color schemes, and helper functions for PAGASA
 * (Philippine Atmospheric, Geophysical and Astronomical Services Administration)
 * rainfall warning system levels.
 * 
 * Warning Levels:
 * - NONE: No warning (normal conditions)
 * - YELLOW: Light to moderate rains (be alert)
 * - ORANGE: Heavy rains (be prepared)
 * - RED: Intense rains (take action)
 * 
 * @module utils/pagasa
 */

/** PAGASA rainfall warning level */
export type PagasaLevel = 'NONE' | 'YELLOW' | 'ORANGE' | 'RED';

/**
 * Visual styling for a PAGASA warning level.
 */
export interface PagasaTone {
  /** Background color (hex) */
  bg: string;
  /** Foreground text color (hex) */
  text: string;
  /** Border color (hex) */
  border: string;
}

/**
 * High-contrast color scheme for PAGASA warning levels.
 * Optimized for accessibility and visibility in emergency contexts.
 */
export const PAGASA_TONES: Record<PagasaLevel, PagasaTone> = {
  NONE: { bg: '#64748b', text: '#f8fafc', border: '#94a3b8' },
  YELLOW: { bg: '#eab308', text: '#0f172a', border: '#ca8a04' },
  ORANGE: { bg: '#ea580c', text: '#fff7ed', border: '#c2410c' },
  RED: { bg: '#dc2626', text: '#fef2f2', border: '#b91c1c' },
};

/**
 * Get user-friendly status label for a PAGASA warning level.
 * 
 * @param level - PAGASA warning level
 * @returns Human-readable status text (e.g., "Yellow Warning")
 */
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

/**
 * Get visual styling for a PAGASA warning level.
 * 
 * @param level - PAGASA warning level (string, null, or undefined)
 * @returns Color scheme object with bg, text, and border colors
 */
export function getPagasaTone(level: PagasaLevel | string | null | undefined): PagasaTone {
  const key = (level ?? 'NONE').toString().toUpperCase() as PagasaLevel;
  return PAGASA_TONES[key] ?? PAGASA_TONES.NONE;
}

/**
 * Normalize various warning level formats to standard enum.
 * 
 * Handles verbose strings ("Yellow Warning"), mixed case, and null/undefined values.
 * 
 * @param value - Raw warning level value from API or timeline data
 * @returns Normalized PAGASA warning level enum value
 * 
 * @example
 * normalizePagasaLevel("Yellow Warning") // returns "YELLOW"
 * normalizePagasaLevel("orange") // returns "ORANGE"
 * normalizePagasaLevel(null) // returns "NONE"
 */
export function normalizePagasaLevel(value: unknown): PagasaLevel {
  const raw = String(value ?? 'NONE').toUpperCase().trim();
  if (raw === 'YELLOW' || raw === 'ORANGE' || raw === 'RED' || raw === 'NONE') {
    return raw;
  }
  if (raw.includes('RED')) return 'RED';
  if (raw.includes('ORANGE')) return 'ORANGE';
  if (raw.includes('YELLOW')) return 'YELLOW';
  return 'NONE';
}