import type { ReactNode } from 'react';
import { SOURCES, type SourceKey } from '../utils/sources';

interface SourceLinkProps {
  source: SourceKey;
  /** Override visible label (defaults to the source's official short name). */
  children?: ReactNode;
  className?: string;
}

/**
 * Minimal inline citation — inherits surrounding text color,
 * with a light underline that strengthens on hover.
 */
export default function SourceLink({ source, children, className = '' }: SourceLinkProps) {
  const { label, href } = SOURCES[source];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline decoration-current/25 underline-offset-2 hover:decoration-current/60 transition-colors ${className}`}
      title={`Open ${label} source`}
    >
      {children ?? label}
    </a>
  );
}
