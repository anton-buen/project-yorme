import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import YormeMark from './YormeMark';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

export const TOUR_STORAGE_KEY = 'yormetrics_tour_completed';

interface TourStep {
  id: string;
  /** Primary DOM id without #; omit for centered welcome */
  targetId?: string;
  /** Used when primary target is not in the DOM (e.g. live vs replay) */
  fallbackTargetId?: string;
  headline: string;
  copy: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    headline: 'Welcome to Yormetrics',
    copy: 'An LGU-grade decision-support instrument for early class suspension modeling in Metro Manila. Let us take a quick 45-second tour of the command center.',
  },
  {
    id: 'scenario',
    targetId: 'step-scenario-select',
    headline: 'Historical Scenarios & Live Mode',
    copy: 'Switch between real-time weather feeds or replay 13 historical typhoons and normal control days to observe how atmospheric conditions evolve.',
  },
  {
    id: 'timeline',
    targetId: 'step-timeline-scrubber',
    headline: 'Time Navigation & The 05:30 AM Threshold',
    copy: 'Scrub from 03:00 AM to 12:00 PM. Pay close attention to 05:30 AM—the statutory deadline for LGU suspension announcements before morning commutes begin.',
  },
  {
    id: 'tensor',
    targetId: 'step-tensor-grid',
    headline: '32×32 Spatial Radar Tensor',
    copy: 'This grid maps PAGASA Doppler reflectivity (dBZ intensity). Dark orange and red clusters indicate severe storm eyewalls and heavy precipitation density over the Manila center dot.',
  },
  {
    id: 'ai',
    targetId: 'step-ai-card',
    headline: 'Policy Tiers (A0–A4) & Risk Utility',
    copy: 'The PPO agent predicts actions from A0 (Status Quo) to A4 (Full Lockdown). The agent uses a high-cost safety reward model. Recommending A4 (Full Emergency Lockdown) occurs when high-density storm vectors coincide with the 05:30 AM decision window to minimize commute risk. The reward matrix heavily penalizes false negatives (unannounced flooding during morning commutes).',
  },
  {
    id: 'telemetry',
    targetId: 'step-telemetry',
    fallbackTargetId: 'step-legal-footer',
    headline: 'Live System Telemetry & Disclaimers',
    copy: 'Yormetrics is a probabilistic simulation tool designed to assist MDRRMO personnel. Official suspension orders rest solely with the Manila Local Chief Executive.',
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

function resolveTarget(step: TourStep): HTMLElement | null {
  if (!step.targetId) return null;
  const primary = document.getElementById(step.targetId);
  if (primary) return primary;
  if (step.fallbackTargetId) {
    return document.getElementById(step.fallbackTargetId);
  }
  return null;
}

export default function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const step = TOUR_STEPS[stepIndex];
  const total = TOUR_STEPS.length;
  const isLast = stepIndex === total - 1;
  const isFirst = stepIndex === 0;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      /* ignore quota / private mode */
    }
    setStepIndex(0);
    setRect(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setRect(null);
      setTooltipPos(null);
    }
  }, [isOpen]);

  const measure = useCallback(() => {
    if (!isOpen) return;
    const current = TOUR_STEPS[stepIndex];
    const el = resolveTarget(current);

    if (!el) {
      setRect(null);
      setTooltipPos(null);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    // Allow layout to settle after scroll
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      const spotlight: SpotlightRect = {
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      };
      setRect(spotlight);

      const cardW = Math.min(448, window.innerWidth - 32);
      const cardH = 220;
      const gap = 16;
      let top = spotlight.top + spotlight.height + gap;
      let left = spotlight.left + spotlight.width / 2 - cardW / 2;

      if (top + cardH > window.innerHeight - 16) {
        top = spotlight.top - cardH - gap;
      }
      if (top < 16) top = 16;
      left = Math.max(16, Math.min(left, window.innerWidth - cardW - 16));

      setTooltipPos({ top, left });
    });
  }, [isOpen, stepIndex]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(measure, 80);
    return () => window.clearTimeout(t);
  }, [isOpen, stepIndex, measure]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [isOpen, measure]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (stepIndex >= total - 1) finish();
        else setStepIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && stepIndex > 0) {
        setStepIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, stepIndex, total, finish]);

  if (!isOpen) return null;

  const centered = !step.targetId || !rect;

  return (
    <div
      className="fixed inset-0 z-[100] transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tour-title"
    >
      {/* Dim backdrop (full when centered; cutout uses box-shadow when spotlighting) */}
      {centered ? (
        <div className="absolute inset-0 bg-black/75 transition-all duration-300" />
      ) : (
        <div
          className="absolute rounded-xl ring-2 ring-emerald-500 transition-all duration-300 pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
          }}
        />
      )}

      {/* Tour card */}
      <div
        className="absolute bg-stone-900 border border-stone-700 text-stone-100 rounded-xl p-6 max-w-md shadow-2xl z-[101] transition-all duration-300"
        style={
          centered
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(28rem, calc(100vw - 2rem))',
              }
            : tooltipPos
              ? {
                  top: tooltipPos.top,
                  left: tooltipPos.left,
                  width: 'min(28rem, calc(100vw - 2rem))',
                }
              : {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'min(28rem, calc(100vw - 2rem))',
                }
        }
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500" style={SANS}>
            Step {stepIndex + 1} of {total}
          </p>
          <button
            type="button"
            onClick={finish}
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors inline-flex items-center gap-1"
            style={SANS}
          >
            Skip Tour
            <X className="w-3.5 h-3.5" aria-hidden={true} />
          </button>
        </div>

        <h2
          id="onboarding-tour-title"
          className="text-lg font-bold tracking-tight text-stone-50 mb-2"
          style={SANS}
        >
          {step.id === 'welcome' ? (
            <>
              Welcome to <YormeMark />
            </>
          ) : (
            step.headline
          )}
        </h2>
        <p className="text-sm text-stone-300 leading-relaxed mb-6" style={SANS}>
          {step.id === 'welcome' ? (
            <>
              An LGU-grade decision-support instrument for early class suspension modeling in Metro
              Manila. Let us take a quick 45-second tour of the command center.
            </>
          ) : step.id === 'telemetry' ? (
            <>
              <YormeMark /> is a probabilistic simulation tool designed to assist MDRRMO personnel.
              Official suspension orders rest solely with the Manila Local Chief Executive.
            </>
          ) : (
            step.copy
          )}
        </p>

        <div className="flex items-center justify-end gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-sm text-sm font-medium text-stone-300 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              style={SANS}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLast) finish();
              else setStepIndex((i) => i + 1);
            }}
            className="px-4 py-2 rounded-sm text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            style={SANS}
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact header control to replay the tour. */
export function TourHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
      style={SANS}
      aria-label="Help / Replay Tour"
      title="Help / Replay Tour"
    >
      <HelpCircle className="w-3.5 h-3.5" aria-hidden={true} />
      <span className="hidden sm:inline">Help / Replay Tour</span>
      <span className="sm:hidden">Help</span>
    </button>
  );
}
