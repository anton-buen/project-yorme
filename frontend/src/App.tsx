// @ts-ignore — keep this file type-checkable until @types/react is installed.
import { useState, useRef, useEffect } from "react";
import { ChevronDown, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties  = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties  = { fontFamily: "'JetBrains Mono', monospace" };

const TERRA = {
  text: "#9A4B2F", bg: "#FDF4F0", border: "#E8C2AE", line: "#C2745A",
};
const SAGE = {
  text: "#3A7050", bg: "#EEF5F0", border: "#AECBB7", line: "#6B9E7A",
};

const selectStyle: React.CSSProperties = {
  background: "#EFEDE9",
  border: "1px solid #E2E0DC",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716C' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 28,
  ...SANS,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionCode    = 0 | 1 | 2 | 3 | 4;
type PagasaLevel   = "NONE" | "YELLOW" | "ORANGE" | "RED";
type BiasMode      = "strict" | "balanced" | "protective";
type DashboardMode = "historical" | "live";

const ACTION_NAMES: Record<ActionCode, string> = {
  0: "Status Quo (Normal F2F)",
  1: "Shift to ADM / Online (All Levels)",
  2: "Suspend Basic Education (K-12)",
  3: "Suspend All Levels (Basic Ed + Tertiary)",
  4: "Full LGU Lockdown (School + City Govt Work)",
};

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0 — Status Quo",
  1: "A1 — Shift to ADM",
  2: "A2 — Suspend Basic Ed",
  3: "A3 — Suspend All Levels",
  4: "A4 — Full Lockdown",
};

// ─── Hour steps 03:00 – 12:00 in 30-min intervals ────────────────────────────

interface HourStep { label: string; hour: number; minute: number }

const HOUR_STEPS: HourStep[] = Array.from({ length: 19 }, (_, i) => {
  const total = 3 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    label: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    hour: h, minute: m,
  };
});

// ─── Incidents ────────────────────────────────────────────────────────────────

interface IncidentDef {
  id: string; label: string; modelWeights: string;
  announcementStep: number; actualActionCode: ActionCode;
  aiPolicy:        (s: number) => ActionCode;
  pagasa:          (s: number) => PagasaLevel;
  strandedActual:  (s: number) => number;
  strandedAI:      (s: number) => number;
  probabilities:   (s: number) => number[];
}

function norm(raw: number[]): number[] {
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((p) => +(p / s).toFixed(3));
}

const INCIDENTS: IncidentDef[] = [
  {
    id: "carina_2024", label: "July 23, 2024 — Typhoon Carina",
    modelWeights: "models/carina_ppo_v3/best_model.zip",
    announcementStep: 7, actualActionCode: 3,
    aiPolicy:       (s) => (s < 4 ? 0 : s < 6 ? 1 : s < 8 ? 2 : 3),
    pagasa:         (s) => (s < 4 ? "NONE" : s < 8 ? "YELLOW" : s < 13 ? "ORANGE" : "RED"),
    strandedActual: (s) => (s < 7 ? 0 : Math.min(5200, (s - 7) * 650)),
    strandedAI:     (s) => (s < 6 ? 0 : Math.min(120,  (s - 6) * 15)),
    probabilities: (s) => {
      const t = Math.min(1, s / 14);
      return norm([Math.max(0.01,0.6-t*0.6), Math.max(0.01,0.18-t*0.12),
                   Math.min(0.3,0.05+t*0.25), Math.min(0.6,t*0.62), Math.min(0.08,t*0.07)]);
    },
  },
  {
    id: "habagat_2024", label: "August 28, 2024 — Habagat Surge",
    modelWeights: "models/habagat_ppo_v2/best_model.zip",
    announcementStep: 8, actualActionCode: 2,
    aiPolicy:       (s) => (s < 5 ? 0 : s < 7 ? 2 : 3),
    pagasa:         (s) => (s < 5 ? "NONE" : s < 9 ? "YELLOW" : s < 14 ? "ORANGE" : "RED"),
    strandedActual: (s) => (s < 8 ? 0 : Math.min(3100, (s - 8) * 390)),
    strandedAI:     (s) => (s < 7 ? 0 : Math.min(80,   (s - 7) * 10)),
    probabilities: (s) => {
      const t = Math.min(1, s / 13);
      return norm([Math.max(0.01,0.55-t*0.54), Math.max(0.01,0.15-t*0.1),
                   Math.min(0.45,0.08+t*0.38), Math.min(0.48,t*0.5), Math.min(0.04,t*0.035)]);
    },
  },
];

const CCTV_FEEDS = [
  {
    id: "espana",   name: "España Blvd cor. Lacson Ave (UST Front)", corridor: "España Corridor",
    criticalInches: 18, floodStep: 8,  floodInches: 18, dryInches: 2,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry:   "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "taft",     name: "Taft Ave cor. UN Ave", corridor: "Taft Corridor",
    criticalInches: 14, floodStep: 10, floodInches: 14, dryInches: 1,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry:   "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "mendiola", name: "Mendiola St cor. C.M. Recto Ave", corridor: "Recto Corridor",
    criticalInches: 22, floodStep: 12, floodInches: 22, dryInches: 3,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry:   "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=640&h=360&fit=crop&auto=format",
  },
];

// ─── Radar Canvas — muted academic palette ────────────────────────────────────

function RadarCanvas({ step, incidentIdx }: { step: number; incidentIdx: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 32;
    const CELL = canvas.width / SIZE;
    const intensity = step / 18;

    ctx.fillStyle = "#F7F5F0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.4;
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }

    for (let idx = 0; idx < SIZE * SIZE; idx++) {
      const x = idx % SIZE;
      const y = Math.floor(idx / SIZE);
      const cx  = 9  + (incidentIdx === 0 ? step * 0.55 : step * 0.3);
      const cy  = 15 + Math.sin(step * 0.38 + incidentIdx * 1.4) * 6;
      const cx2 = 23 - step * 0.18;
      const cy2 = 11 + Math.cos(step * 0.3  + incidentIdx) * 5;
      const core  = Math.max(0, 1 - Math.sqrt((x-cx)**2  + (y-cy)**2)  / (7 + intensity * 7));
      const band  = Math.max(0, 1 - Math.sqrt((x-cx2)**2 + (y-cy2)**2) / (4 + intensity * 4)) * 0.55;
      const noise = ((Math.sin(x*3.7+step*0.5+incidentIdx) + Math.cos(y*2.9+step*0.4)) * 0.5 + 0.5) * 0.14;
      const val   = Math.min(1, core + band + noise) * intensity;
      if (val < 0.04) continue;

      let r = 0, g = 0, b = 0, a = val;
      if (val < 0.3) {
        r = Math.floor(180 - val * 60); g = Math.floor(188 - val * 40); b = Math.floor(200 - val * 20); a = val * 0.7;
      } else if (val < 0.65) {
        const t = (val - 0.3) / 0.35;
        r = Math.floor(120 - t * 40); g = Math.floor(148 - t * 20); b = Math.floor(160 - t * 30); a = 0.55 + t * 0.25;
      } else {
        const t = (val - 0.65) / 0.35;
        r = Math.floor(80 + t * 54); g = Math.floor(128 - t * 60); b = Math.floor(130 - t * 60); a = 0.8 + t * 0.15;
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }

    [0.28, 0.45].forEach((r) => {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100,130,120,0.2)"; ctx.lineWidth = 0.7; ctx.stroke();
    });
    ctx.strokeStyle = "rgba(100,130,120,0.15)"; ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
  }, [step, incidentIdx]);

  return (
    <canvas ref={ref} width={288} height={288}
      className="w-full aspect-square rounded" style={{ imageRendering: "pixelated" }} />
  );
}

// ─── PagasaBadge ─────────────────────────────────────────────────────────────

function PagasaBadge({ level }: { level: PagasaLevel }) {
  const cfg = {
    NONE:   { wrap: "bg-stone-100 text-stone-500 border-stone-200",   dot: "bg-stone-400",             label: "PAGASA: No Warning"      },
    YELLOW: { wrap: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500",             label: "PAGASA: Yellow Warning"  },
    ORANGE: { wrap: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500",            label: "PAGASA: Orange Warning"  },
    RED:    { wrap: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500 animate-pulse", label: "PAGASA: Red Warning"     },
  }[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium tracking-wide transition-colors duration-300 ${cfg.wrap}`} style={SANS}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ variant }: { variant: "critical" | "protected" | "nominal" }) {
  const cfg = {
    critical:  { label: "Critical",  bg: TERRA.bg, border: TERRA.border, color: TERRA.text },
    protected: { label: "Protected", bg: SAGE.bg,  border: SAGE.border,  color: SAGE.text  },
    nominal:   { label: "Nominal",   bg: "#F5F5F4", border: "#D6D3D1", color: "#78716C"   },
  }[variant];
  return (
    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold border tracking-wide" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color, ...SANS }}>
      {cfg.label}
    </span>
  );
}

// ─── Technical Appendix — bottom drawer ──────────────────────────────────────

interface AppendixProps {
  open: boolean; onClose: () => void;
  probabilities: number[]; aiAction: ActionCode;
  biasMode: BiasMode; onBiasChange: (b: BiasMode) => void;
  incident: IncidentDef; step: number;
}

function TechnicalAppendix({ open, onClose, probabilities, aiAction, biasMode, onBiasChange, incident, step }: AppendixProps) {
  const hourStep = HOUR_STEPS[step];
  const chartData = probabilities.map((p, i) => ({
    name: `A${i}`, value: +(p * 100).toFixed(1), isWinner: i === aiAction,
  }));

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{
          background:           "rgba(28,25,23,0.14)",
          backdropFilter:       "blur(6px) saturate(150%)",
          WebkitBackdropFilter: "blur(6px) saturate(150%)",
        }}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 will-change-transform transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{
          height: "42vh", minHeight: 320,
          background:           "rgba(255,255,255,0.92)",
          backdropFilter:       "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 -12px 48px rgba(28,25,23,0.10), 0 -1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <div className="flex items-center justify-between px-8 py-4" style={{ borderBottom: "1px solid rgba(231,229,228,0.7)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 rounded-full bg-stone-200" />
            <div>
              <h3 className="text-base font-semibold text-stone-800 tracking-tight" style={SERIF}>Technical Appendix</h3>
              <p className="text-xs text-stone-400 mt-0.5" style={SANS}>Reinforcement Learning Metrics · PPO Policy Weights</p>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors duration-150 px-3 py-1.5 rounded-full hover:bg-stone-100" style={SANS}>
            Close <ChevronDown size={13} className="ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 h-[calc(100%-57px)] overflow-hidden divide-x divide-stone-100">
          <div className="px-7 py-5 overflow-y-auto">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-4" style={SANS}>Mayor Policy Bias</p>
            <div className="space-y-2">
              {(["strict", "balanced", "protective"] as BiasMode[]).map((m) => {
                const meta = { strict: { label: "Strict", sub: "Avoid false alarms" }, balanced: { label: "Balanced", sub: "Default policy" }, protective: { label: "Protective", sub: "Zero stranded priority" } };
                const active = biasMode === m;
                return (
                  <label key={m} className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border ${active ? "border-stone-300 bg-stone-50" : "border-transparent hover:border-stone-200 hover:bg-stone-50/60"}`} onClick={() => onBiasChange(m)}>
                    <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150" style={{ borderColor: active ? SAGE.line : "#D6D3D1", background: active ? SAGE.line : "transparent" }}>
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-700" style={SANS}>{meta[m].label}</p>
                      <p className="text-xs text-stone-400 mt-0.5" style={SANS}>{meta[m].sub}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="px-7 py-5 overflow-y-auto">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-4" style={SANS}>PPO Action Probability</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 12 }}>
                  <XAxis dataKey="name" tick={{ fill: "#A8A29E", fontSize: 10, fontFamily: "Inter, sans-serif" }} axisLine={{ stroke: "#E7E5E4" }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#A8A29E", fontSize: 9, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${v}%`} />
                  <ReTooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} contentStyle={{ background: "#FFF", border: "1px solid #E7E5E4", borderRadius: 8, fontFamily: "Inter, sans-serif", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} labelStyle={{ color: "#78716C" }} formatter={(v: any) => [`${v}%`, "Probability"]} />
                  <Bar dataKey="value" maxBarSize={32} radius={[3, 3, 0, 0]}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.isWinner ? SAGE.line : "#E7E5E4"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs" style={SANS}>
                  <span style={{ color: d.isWinner ? SAGE.text : "#A8A29E", fontWeight: d.isWinner ? 500 : 400 }}>{ACTION_SHORT[i as ActionCode]}</span>
                  <span style={{ color: d.isWinner ? SAGE.text : "#C4BDB9", fontWeight: d.isWinner ? 600 : 400 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-7 py-5 overflow-y-auto">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-3" style={SANS}>Tensor Inspector</p>
            <table className="w-full text-xs mb-5" style={SANS}>
              <tbody className="divide-y divide-stone-100">
                {[
                  ["Spatial Shape",    "[4, 32, 32]"],
                  ["Vector: Hour",     `${hourStep.hour}:${String(hourStep.minute).padStart(2,"0")}`],
                  ["Commute Density",  (0.28 + step * 0.038).toFixed(4)],
                  ["MCDRRMO Risk Max", (step * 0.0531 + 0.0012).toFixed(4)],
                  ["Model Weights",    incident.modelWeights.split("/").pop()!],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-1.5 text-stone-400 pr-4">{k}</td>
                    <td className="py-1.5 text-stone-700 text-right" style={MONO}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-3" style={SANS}>Reward Matrix</p>
            <table className="w-full text-xs" style={SANS}>
              <tbody className="divide-y divide-stone-100">
                {[
                  ["Early Warning (t < 05:30)",  "+100",   SAGE.text],
                  ["Late Suspension (t > 06:00)", "−1000",  TERRA.text],
                  ["False Alarm",                 "−50",    "#92400E"],
                  ["Status Quo Failure",           "−2000",  TERRA.text],
                  ["Legal Override",               "Active", "#78716C"],
                ].map(([k, v, col]) => (
                  <tr key={k}>
                    <td className="py-1.5 text-stone-400 pr-4">{k}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: col, ...MONO }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<DashboardMode>("historical");
  const [incidentIdx, setIncidentIdx] = useState(0);
  const [step, setStep] = useState(6);
  const [appendixOpen, setAppendixOpen] = useState(false);
  const [biasMode, setBiasMode] = useState<BiasMode>("balanced");
  const [cctvIdx, setCctvIdx] = useState(0);

  const [apiPrediction, setApiPrediction] = useState<{
    ai_action_code: ActionCode;
    action_probabilities: number[];
    loaded_model_path: string;
  } | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const current_hour = HOUR_STEPS[step].hour + (HOUR_STEPS[step].minute / 60);
        const isFlooded = step >= CCTV_FEEDS[cctvIdx].floodStep;
        const isRed = INCIDENTS[incidentIdx].pagasa(step) === "RED";

        const response = await fetch("https://yorme-trics.onrender.com/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_hour,
            flood_active: isFlooded,
            pagasa_warning_red: isRed
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setApiPrediction(data);
        }
      } catch (error) {
        console.error("Failed to fetch PyTorch API:", error);
      }
    };

    fetchPrediction();
  }, [step, incidentIdx, cctvIdx]);

  const incident = INCIDENTS[incidentIdx];
  const hourStep = HOUR_STEPS[step];
  const pagasaLevel = incident.pagasa(step);
  const actualAction: ActionCode = step >= incident.announcementStep ? incident.actualActionCode : 0;
  const cctv = CCTV_FEEDS[cctvIdx];
  const flooded = step >= cctv.floodStep;
  const waterLevel = flooded ? cctv.floodInches : cctv.dryInches;

  const aiAction: ActionCode = apiPrediction?.ai_action_code ?? incident.aiPolicy(step);
  const probabilities: number[] = apiPrediction?.action_probabilities ?? incident.probabilities(step);
  const modelWeights: string = apiPrediction?.loaded_model_path ?? incident.modelWeights;

  const strandedActual = incident.strandedActual(step);
  const strandedAI = aiAction >= 2 ? 0 : (aiAction === 1 ? Math.floor(strandedActual * 0.3) : strandedActual);

  const leadTimeHours = ((Math.max(0, incident.announcementStep - step)) * 0.5).toFixed(1);
  const aiConfidence = (probabilities[aiAction] * 100).toFixed(1);

  const activeIncident = { ...incident, modelWeights };

  return (
    <div className="min-h-screen text-stone-800" style={{ background: "#FAF9F6", ...SANS }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(250,249,246,0.72)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.55)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05)",
        }}
      >
        <div className="px-7 py-0">
          <div className="flex items-center justify-between gap-8 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="shrink-0">
              <h1 
                className="text-[17px] font-bold text-stone-800 tracking-[0.15em] leading-none uppercase" 
                style={SERIF}
              >
                YORMETRICS
              </h1>
              <p className="text-xs text-stone-400 tracking-wide mt-0.5" style={SANS}>
                Predictive Early Suspension Advisor — City of Manila LGU
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex rounded-full p-1 text-xs font-medium" style={{ background: "#E8E5E1", border: "1px solid #D6D3D0" }}>
                {(["historical", "live"] as DashboardMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 rounded-full font-medium transition-none ${
                      mode === m
                        ? "bg-stone-800 text-white shadow-sm"
                        : "text-stone-400 hover:text-stone-600 hover:bg-stone-200/50"
                    }`}
                    style={SANS}
                  >
                    {m === "historical" ? "Historical Replay" : "Live Watch"}
                  </button>
                ))}
              </div>

              {mode === "historical" ? (
                <select
                  value={incidentIdx}
                  onChange={(e) => { setIncidentIdx(+e.target.value); setStep(6); }}
                  className="rounded-full px-4 py-2 text-xs text-stone-600 outline-none cursor-pointer transition-all duration-150 hover:border-stone-300"
                  style={selectStyle}
                >
                  {INCIDENTS.map((inc, i) => (
                    <option key={inc.id} value={i}>{inc.label}</option>
                  ))}
                </select>
              ) : (
                <div className="rounded-full px-4 py-2 text-xs text-stone-400" style={{ background: "#EFEDE9", border: "1px solid #E2E0DC" }}>
                  Metro Manila (District 1–6)
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <PagasaBadge level={pagasaLevel} />
              <span className="text-xs text-stone-400 truncate" style={SANS}>
                {incident.label} · Sim {hourStep.label}
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span className="text-sm font-medium text-stone-700 tabular-nums w-20 text-right" style={MONO}>
                {hourStep.label}
              </span>
              <div className="flex flex-col gap-1">
                <input
                  type="range" min={0} max={18} step={1} value={step}
                  onChange={(e) => setStep(+e.target.value)}
                  className="light-scrubber w-40 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 px-0.5" style={SANS}>
                  <span>03:00 AM</span>
                  <span>12:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-7 py-6 space-y-5 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card-lift rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ height: 3, background: TERRA.line }} />
            <div className="px-6 py-5">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase mb-2" style={SANS}>
                    Official LGU Decision
                  </p>
                  <h2 className="text-2xl font-semibold text-stone-800 leading-snug" style={SERIF}>
                    {ACTION_NAMES[actualAction]}
                  </h2>
                  <p className="text-xs text-stone-400 mt-1" style={SANS}>
                    Source: Manila PIO Official Log
                  </p>
                </div>
                <span className="text-[11px] font-semibold tracking-widest px-3 py-1.5 rounded-full shrink-0" style={{ background: TERRA.bg, color: TERRA.text, border: `1px solid ${TERRA.border}` }}>
                  A{actualAction}
                </span>
              </div>

              {step < incident.announcementStep && (
                <div className="mb-4 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", ...SANS }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  Pending — Official announcement at {HOUR_STEPS[incident.announcementStep].label}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl px-4 py-3" style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase mb-1.5" style={SANS}>Estimated Stranded</p>
                  <p className="text-3xl font-semibold tabular-nums leading-none" style={{ color: TERRA.text, ...SERIF }}>{strandedActual.toLocaleString()}</p>
                  <p className="text-[11px] text-stone-400 mt-1" style={SANS}>students</p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase mb-1.5" style={SANS}>Commuter Safety</p>
                  <StatusPill variant={strandedActual > 0 ? "critical" : "nominal"} />
                </div>
              </div>
            </div>
          </div>

          <div className="card-lift rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ height: 3, background: SAGE.line }} />
            <div className="px-6 py-5">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase mb-2" style={SANS}>
                    AI Policy Recommendation
                  </p>
                  <h2 className="text-2xl font-semibold text-stone-800 leading-snug" style={SERIF}>
                    {ACTION_NAMES[aiAction]}
                  </h2>
                  <p className="text-xs text-stone-400 mt-1" style={SANS}>
                    Confidence: <span style={{ color: SAGE.text }}>{aiConfidence}%</span>
                    {parseFloat(leadTimeHours) > 0 && <> · Lead Time: <span style={{ color: SAGE.text }}>{leadTimeHours}h</span></>}
                  </p>
                </div>
                <span className="text-[11px] font-semibold tracking-widest px-3 py-1.5 rounded-full shrink-0" style={{ background: SAGE.bg, color: SAGE.text, border: `1px solid ${SAGE.border}` }}>
                  A{aiAction}
                </span>
              </div>

              <p className="text-[11px] text-stone-400 mb-4" style={SANS}>Weights: {incident.modelWeights}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase mb-1.5" style={SANS}>Estimated Stranded</p>
                  <p className="text-3xl font-semibold tabular-nums leading-none" style={{ color: SAGE.text, ...SERIF }}>{strandedAI.toLocaleString()}</p>
                  <p className="text-[11px] text-stone-400 mt-1" style={SANS}>students</p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase mb-1.5" style={SANS}>Commuter Safety</p>
                  <StatusPill variant="protected" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card-lift rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div className="px-6 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid #F5F4F2" }}>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase mb-0.5" style={SANS}>PAGASA Radar Input Grid</p>
                <p className="text-base font-medium text-stone-700 tracking-tight" style={SERIF}>Local Manila dBZ Reflectivity</p>
                <p className="text-xs text-stone-400 mt-0.5" style={SANS}>32×32 Tensor Input</p>
              </div>
              <PagasaBadge level={pagasaLevel} />
            </div>
            <div className="p-5">
              <div className="relative rounded-lg overflow-hidden mx-auto" style={{ background: "#F7F5F0", maxHeight: 240, maxWidth: 240 }}>
                <RadarCanvas step={step} incidentIdx={incidentIdx} />
                <span className="absolute top-2 left-2 text-[9px] text-stone-400 leading-none" style={SANS}>14.5995°N 120.9842°E</span>
                <span className="absolute bottom-2 right-2 text-[9px] text-stone-400 leading-none" style={SANS}>{hourStep.label}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-stone-400" style={SANS}>Low</span>
                <div className="flex-1 h-1 rounded-full" style={{ background: "linear-gradient(to right, #E2E8F0, #94A3B8, #64748B, #3D7A68, #5C5454)" }} />
                <span className="text-[10px] text-stone-400" style={SANS}>High dBZ</span>
              </div>
            </div>
          </div>

          <div className="card-lift rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid #F5F4F2" }}>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase mb-2.5" style={SANS}>Traffic CCTV Feed</p>
              <select
                value={cctvIdx}
                onChange={(e) => setCctvIdx(+e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-stone-600 outline-none cursor-pointer transition-all duration-150"
                style={{ background: "#FAFAF9", border: "1px solid #E7E5E4", ...selectStyle, backgroundPosition: "right 14px center" }}
              >
                {CCTV_FEEDS.map((f, i) => (
                  <option key={f.id} value={i}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="p-5">
              <div
                className="relative rounded-xl overflow-hidden bg-stone-200 mx-auto"
                style={{
                  backgroundImage: `url('${flooded ? cctv.imgFlood : cctv.imgDry}')`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  filter: "grayscale(25%) saturate(0.8)",
                  maxHeight: 200, aspectRatio: "16/9",
                }}
              >
                <div className="absolute inset-0" style={{ background: "rgba(250,249,246,0.15)" }} />
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5" style={{ background: "rgba(250,249,246,0.82)", backdropFilter: "blur(6px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="text-xs font-medium text-stone-600" style={SANS}>{cctv.corridor}</span>
                  <span className="text-xs text-stone-400" style={MONO}>{hourStep.label}</span>
                </div>
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${flooded ? TERRA.border : SAGE.border}`, color: flooded ? TERRA.text : SAGE.text, backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.10)", ...SANS }}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${flooded ? "animate-pulse" : ""}`} style={{ background: flooded ? TERRA.line : SAGE.line }} />
                    {flooded ? `Water Level: ${waterLevel}" — Non-Passable` : "Status: Road Clear (Dry)"}
                  </div>
                </div>
              </div>
              <p className="mt-2 flex justify-between text-[10px] text-stone-400" style={SANS}>
                <span>Critical threshold: {cctv.criticalInches}" water level</span>
                <span>Manila CCTV Network v2.1</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-lift rounded-2xl px-6 py-5" style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase mb-4" style={SANS}>Simulation Timeline — Click to Scrub</p>
          <div className="flex items-end gap-px">
            {HOUR_STEPS.map((hs, i) => {
              const isActive       = i === step;
              const isAnnouncement = i === incident.announcementStep;
              const past           = i <= step;
              return (
                <button key={i} onClick={() => setStep(i)} title={hs.label} className="flex flex-col items-center gap-0.5 flex-1 group">
                  <div className="w-full h-5 flex items-end justify-center rounded-sm transition-colors duration-100"
                    style={{ background: isActive ? SAGE.bg : past ? "#F5F4F2" : "transparent", borderBottom: `1.5px solid ${isActive ? SAGE.line : past ? "#E7E5E4" : "transparent"}` }}>
                    {isAnnouncement && <div className="w-px h-full" style={{ background: TERRA.line + "CC" }} />}
                  </div>
                  <div className="w-1 h-1 rounded-full transition-colors duration-150" style={{ background: isActive ? SAGE.line : past ? "#D6D3D1" : "#EFEDE9" }} />
                  {i % 4 === 0 && (
                    <span className="text-[9px] whitespace-nowrap transition-colors duration-150" style={{ color: isActive ? SAGE.text : "#A8A29E", ...SANS }}>
                      {hs.label.replace(" AM","").replace(" PM","")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-5 text-xs text-stone-400" style={SANS}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-px inline-block" style={{ background: TERRA.line + "AA" }} /> LGU announcement ({HOUR_STEPS[incident.announcementStep].label})</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: SAGE.line }} /> Current step</span>
          </div>
        </div>

        <div className="h-4" />
        {appendixOpen && <div style={{ height: "42vh" }} />}
      </main>

      <button
        onClick={() => setAppendixOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium select-none"
        style={{
          background:           "rgba(255,255,255,0.78)",
          backdropFilter:       "blur(14px) saturate(180%)",
          WebkitBackdropFilter: "blur(14px) saturate(180%)",
          border:      `1px solid ${appendixOpen ? "rgba(107,158,122,0.4)" : "rgba(255,255,255,0.7)"}`,
          color:       appendixOpen ? SAGE.text : "#44403C",
          boxShadow: appendixOpen
            ? `0 8px 32px rgba(0,0,0,0.14), 0 0 0 3px ${SAGE.bg}, inset 0 1px 0 rgba(255,255,255,0.9)`
            : "0 4px 20px rgba(0,0,0,0.11), 0 1px 4px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
          ...SANS,
        }}
      >
        <BarChart2 size={15} />
        {appendixOpen ? "Close Metrics" : "Metrics"}
      </button>

      <TechnicalAppendix
        open={appendixOpen}
        onClose={() => setAppendixOpen(false)}
        probabilities={probabilities}
        aiAction={aiAction}
        biasMode={biasMode}
        onBiasChange={setBiasMode}
        incident={activeIncident}
        step={step}
      />
    </div>
  );
}