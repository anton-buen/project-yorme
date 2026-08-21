import { ShieldAlert, X } from 'lucide-react';
import SourceLink from './SourceLink';
import YormeMark from './YormeMark';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

/** Compact editorial callout for How it Works / documentation views. */
export function EthicalGuardrailsCallout() {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" aria-hidden={true} />
        <h4 className="text-sm font-bold text-slate-900" style={SANS}>
          Ethical &amp; Safety Guardrails
        </h4>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed" style={SANS}>
        <YormeMark className="font-semibold text-slate-800" /> is a non-binding decision-support tool
        for MDRRMO personnel—not automated governance. Final suspension authority rests with the
        Local Chief Executive under{' '}
        <SourceLink source="eo66" className="font-semibold text-slate-800" /> and{' '}
        <SourceLink source="depedOrder37" className="font-semibold text-slate-800" />.
        Official{' '}
        <SourceLink source="pagasa" className="font-semibold text-slate-800" /> warnings always supersede
        AI projections. The platform uses aggregated, anonymized open data (no PII), covers weather
        inputs only, and must not be re-broadcast as official LGU advisories.
      </p>
    </div>
  );
}

interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Full Legal & AI Disclaimer modal (footer entry point). */
export default function LegalDisclaimerModal({ isOpen, onClose }: LegalDisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-2xl shadow-2xl pointer-events-auto max-w-2xl w-full mx-4 ring-1 ring-slate-900/5"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-disclaimer-title"
      >
        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2
                id="legal-disclaimer-title"
                className="text-2xl font-bold font-sans tracking-tight text-slate-900"
                style={SANS}
              >
                Legal &amp; AI Disclaimer
              </h2>
              <p className="text-sm text-slate-500 mt-1" style={SANS}>
                Explicit guardrails for public-safety decision support
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-sm transition-colors shrink-0"
              aria-label="Close legal disclaimer"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6 text-sm text-slate-700 leading-relaxed" style={SANS}>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                1. Statutory Authority (Non-Binding Notice)
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">Sole Decision-Maker:</span>{' '}
                  <YormeMark className="font-semibold text-slate-800" /> is strictly an experimental
                  decision-support instrument. Final authority for class and government work
                  suspensions rests exclusively with the Local Chief Executive (City Mayor) pursuant
                  to{' '}
                  <SourceLink source="eo66" className="font-semibold text-slate-800" /> and{' '}
                  <SourceLink source="depedOrder37" className="font-semibold text-slate-800" />.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">No Official Announcement:</span> AI
                  policy outputs (A0–A4) are predictive simulations and do not constitute legal
                  suspension directives or official public safety announcements.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                2. Algorithmic &amp; Model Boundaries
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">Probabilistic Engine:</span>{' '}
                  Recommendations generated by the PyTorch PPO neural network represent calculated
                  risk probabilities derived from spatial tensor vectors. They are not deterministic
                  forecasts of street-level flood heights or localized severe weather.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Dataset Dependencies:</span> The
                  agent evaluates conditions against its 13 calibrated historical scenarios.
                  Unprecedented atmospheric conditions or sudden microclimate anomalies may produce
                  unexpected policy recommendations.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                3. Data Source Attribution &amp; Primacy
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">Meteorological Superseded Rule:</span>{' '}
                  Observation tensors, dBZ estimates, and rainfall figures are synthesized from
                  official{' '}
                  <SourceLink source="pagasa" className="font-semibold text-slate-800" /> Doppler radar
                  feeds and public satellite telemetry. Official PAGASA heavy rainfall and cyclone
                  warnings strictly supersede any AI projection.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                4. Liability &amp; Operational Status
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">&ldquo;As-Is&rdquo; Provision:</span>{' '}
                  Telemetry feeds, real-time inference APIs, and radar visualizations are provided
                  on an &ldquo;as-is&rdquo; basis without guarantees of continuous uptime,
                  zero-latency rendering, or real-time accuracy.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                5. Data Privacy Compliance (RA 10173)
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">No PII Collection:</span> Spatial
                  tensors, commuter density estimates, and telemetry metrics are derived from
                  aggregated, anonymized open data. <YormeMark className="font-semibold text-slate-800" />{' '}
                  does <span className="font-semibold text-slate-900">not</span> collect Personally
                  Identifiable Information (PII) or track individual user geolocations, consistent
                  with the{' '}
                  <SourceLink source="ra10173" className="font-semibold text-slate-800">
                    Data Privacy Act of 2012 (RA 10173)
                  </SourceLink>
                  .
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                6. Prohibition on Unauthorized Redistribution (RPC Art. 154)
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">Terms of Use — No Re-Broadcast:</span>{' '}
                  Under Philippine law regarding alarming or false news and public order (
                  <SourceLink source="rpc154" className="font-semibold text-slate-800">
                    Revised Penal Code Art. 154
                  </SourceLink>
                  ), circulating unverified disaster warnings may carry penalties. Third parties
                  are prohibited from scraping, re-broadcasting, or framing{' '}
                  <YormeMark className="font-semibold text-slate-800" /> outputs as official LGU
                  advisories on social media or any other channel. Use of this platform constitutes
                  acceptance of this restriction.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                7. Non-Meteorological Scope Limitations
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">Weather Inputs Only:</span> The PPO
                  agent evaluates spatial weather inputs only. It cannot predict or account for
                  non-weather suspension triggers such as nationwide transport strikes, power grid
                  failures, seismic events, or public health emergencies. Officials must apply
                  separate protocols for those scenarios.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                8. Human-in-the-Loop (HITL) Ethical Mandate
              </h3>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-900">Assist, Do Not Automate:</span> The
                  AI is built to assist Manila Disaster Risk Reduction and Management Office
                  (<SourceLink source="mdrrmo" className="font-semibold text-slate-800" />) personnel,
                  not to automate municipal governance or bypass human judgment
                  for hyper-local, flood-prone barangays (e.g., low-lying areas along the Pasig
                  River). Final operational decisions remain with trained human responders and the
                  Local Chief Executive.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
