const YORME_URL = 'https://www.facebook.com/iskomorenodomagoso';

interface YormeMarkProps {
  className?: string;
  /** Text to render only the "Yorme" link (no "trics") */
  withSuffix?: boolean;
}

/**
 * Brand wordmark with a quiet Easter egg: "Yorme" opens the Mayor's page.
 * Intentionally unstyled — same color as surrounding text, no underline.
 */
export default function YormeMark({ className = '', withSuffix = true }: YormeMarkProps) {
  return (
    <span className={className}>
      <a
        href={YORME_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-inherit no-underline hover:text-inherit focus:outline-none focus-visible:ring-1 focus-visible:ring-current/30 rounded-sm"
        style={{ textDecoration: 'none', color: 'inherit' }}
        aria-label="Yorme"
      >
        Yorme
      </a>
      {withSuffix ? 'trics' : null}
    </span>
  );
}
