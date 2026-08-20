import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO_STYLE: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

const TERRA = {
  text:   "#9A4B2F",
  textMd: "#B5614A",
  bg:     "#FDF4F0",
  border: "#E8C2AE",
  line:   "#C2745A",
};
const SAGE = {
  text:   "#3A7050",
  textMd: "#5A9470",
  bg:     "#EEF5F0",
  border: "#AECBB7",
  line:   "#6B9E7A",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionCode = 0 | 1 | 2 | 3 | 4;
type PagasaLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";
type BiasMode = "strict" | "balanced" | "protective";
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

// ─── Hour Steps ───────────────────────────────────────────────────────────────

interface HourStep { label: string; hour: number; minute: number; }

const HOUR_STEPS: HourStep[] = Array.from({ length: 19 }, (_, i) => {
  const totalMinutes = 3 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    label: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    hour: h, minute: m,
  };
});

// ─── Incident Definitions ─────────────────────────────────────────────────────

interface IncidentDef {
  id: string; label: string; modelWeights: string; announcementStep: number;
  actualActionCode: ActionCode;
  aiPolicy: (s: number) => ActionCode;
  pagasa: (s: number) => PagasaLevel;
  strandedActual: (s: number) => number;
  strandedAI: (s: number) => number;
  probabilities: (s: number) => number[];
}

function norm(raw: number[]): number[] {
  const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((p) => +(p / s).toFixed(3));
}

const INCIDENTS: IncidentDef[] = [
  {
    id: "carina_2024", label: "July 23, 2024 — Typhoon Carina",
    modelWeights: "models/carina_ppo_v3/best_model.zip", announcementStep: 7, actualActionCode: 3,
    aiPolicy: (s) => (s < 4 ? 0 : s < 6 ? 1 : s < 8 ? 2 : 3),
    pagasa: (s) => (s < 4 ? "NONE" : s < 8 ? "YELLOW" : s < 13 ? "ORANGE" : "RED"),
    strandedActual: (s) => (s < 7 ? 0 : Math.min(5200, (s - 7) * 650)),
    strandedAI: (s) => (s < 6 ? 0 : Math.min(120, (s - 6) * 15)),
    probabilities: (s) => {
      const t = Math.min(1, s / 14);
      return norm([Math.max(0.01,0.6-t*0.6), Math.max(0.01,0.18-t*0.12), Math.min(0.3,0.05+t*0.25), Math.min(0.6,t*0.62), Math.min(0.08,t*0.07)]);
    },
  },
  {
    id: "habagat_2024", label: "August 28, 2024 — Habagat Surge",
    modelWeights: "models/habagat_ppo_v2/best_model.zip", announcementStep: 8, actualActionCode: 2,
    aiPolicy: (s) => (s < 5 ? 0 : s < 7 ? 2 : 3),
    pagasa: (s) => (s < 5 ? "NONE" : s < 9 ? "YELLOW" : s < 14 ? "ORANGE" : "RED"),
    strandedActual: (s) => (s < 8 ? 0 : Math.min(3100, (s - 8) * 390)),
    strandedAI: (s) => (s < 7 ? 0 : Math.min(80, (s - 7) * 10)),
    probabilities: (s) => {
      const t = Math.min(1, s / 13);
      return norm([Math.max(0.01,0.55-t*0.54), Math.max(0.01,0.15-t*0.1), Math.min(0.45,0.08+t*0.38), Math.min(0.48,t*0.5), Math.min(0.04,t*0.035)]);
    },
  },
];

const CCTV_FEEDS = [
  {
    id: "espana", name: "España Blvd cor. Lacson Ave (UST Front)", corridor: "España Corridor",
    criticalInches: 18, floodStep: 8, floodInches: 18, dryInches: 2,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "taft", name: "Taft Ave cor. UN Ave", corridor: "Taft Corridor",
    criticalInches: 14, floodStep: 10, floodInches: 14, dryInches: 1,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "mendiola", name: "Mendiola St cor. C.M. Recto Ave", corridor: "Recto Corridor",
    criticalInches: 22, floodStep: 12, floodInches: 22, dryInches: 3,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=640&h=360&fit=crop&auto=format",
  },
];

// ─── Radar Canvas (academic/muted palette) ────────────────────────────────────

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

    // Warm off-white background
    ctx.fillStyle = "#F7F5F0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.4;
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }

    for (let idx = 0; idx < SIZE * SIZE; idx++) {
      const x = idx % SIZE;
      const y = Math.floor(idx / SIZE);
      const cx = 9 + (incidentIdx === 0 ? step * 0.55 : step * 0.3);
      const cy = 15 + Math.sin(step * 0.38 + incidentIdx * 1.4) * 6;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const core = Math.max(0, 1 - dist / (7 + intensity * 7));
      const cx2 = 23 - step * 0.18;
      const cy2 = 11 + Math.cos(step * 0.3 + incidentIdx) * 5;
      const dist2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2);
      const band = Math.max(0, 1 - dist2 / (4 + intensity * 4)) * 0.55;
      const noise = ((Math.sin(x * 3.7 + step * 0.5 + incidentIdx) + Math.cos(y * 2.9 + step * 0.4)) * 0.5 + 0.5) * 0.14;
      const val = Math.min(1, core + band + noise) * intensity;

      if (val < 0.04) continue;

      // Academic palette: slate-gray → muted teal → warm slate
      let r = 0, g = 0, b = 0, a = val;
      if (val < 0.3) {
        // Light slate-blue
        r = Math.floor(180 - val * 60);
        g = Math.floor(188 - val * 40);
        b = Math.floor(200 - val * 20);
        a = val * 0.7;
      } else if (val < 0.65) {
        const t = (val - 0.3) / 0.35;
        // Muted teal-slate
        r = Math.floor(120 - t * 40);
        g = Math.floor(148 - t * 20);
        b = Math.floor(160 - t * 30);
        a = 0.55 + t * 0.25;
      } else {
        const t = (val - 0.65) / 0.35;
        // Deep slate with slight warmth (no neon)
        r = Math.floor(80 + t * 54);
        g = Math.floor(128 - t * 60);
        b = Math.floor(130 - t * 60);
        a = 0.8 + t * 0.15;
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }

    // Subtle range rings — muted teal
    [0.28, 0.45].forEach((r) => {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100,130,120,0.2)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });

    // Crosshair — very faint
    ctx.strokeStyle = "rgba(100,130,120,0.15)";
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
  }, [step, incidentIdx]);

  return (
    <canvas
      ref={ref}
      width={288}
      height={288}
      className="w-full aspect-square rounded"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ─── PagasaBadge (light) ──────────────────────────────────────────────────────

function PagasaBadge({ level }: { level: PagasaLevel }) {
  const cfg = {
    NONE:   { wrap: "bg-stone-100 text-stone-500 border-stone-200",     dot: "bg-stone-400",     label: "PAGASA: No Warning" },
    YELLOW: { wrap: "bg-amber-50 text-amber-700 border-amber-200",      dot: "bg-amber-500",     label: "PAGASA: Yellow Warning" },
    ORANGE: { wrap: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500",    label: "PAGASA: Orange Warning" },
    RED:    { wrap: "bg-red-50 text-red-700 border-red-200",            dot: "bg-red-500 animate-pulse", label: "PAGASA: Red Warning" },
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide transition-colors duration-300 ${cfg.wrap}`}
      style={SANS}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ variant }: { variant: "critical" | "protected" | "nominal" | "pending" }) {
  const cfg = {
    critical:  { label: "Critical",  bg: TERRA.bg, border: TERRA.border, color: TERRA.text },
    protected: { label: "Protected", bg: SAGE.bg,  border: SAGE.border,  color: SAGE.text },
    nominal:   { label: "Nominal",   bg: "#F5F5F4", border: "#D6D3D1", color: "#78716C" },
    pending:   { label: "Pending",   bg: "#FEFCE8", border: "#FDE68A", color: "#92400E" },
  }[variant];

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border tracking-wide"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color, ...SANS }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Technical Appendix — Bottom Drawer ──────────────────────────────────────

interface AppendixProps {
  open: boolean;
  onClose: () => void;
  probabilities: number[];
  aiAction: ActionCode;
  biasMode: BiasMode;
  onBiasChange: (b: BiasMode) => void;
  incident: IncidentDef;
  step: number;
}

function TechnicalAppendix({
  open, onClose, probabilities, aiAction, biasMode, onBiasChange, incident, step,
}: AppendixProps) {
  const hourStep = HOUR_STEPS[step];
  const chartData = probabilities.map((p, i) => ({
    name: `A${i}`,
    value: +(p * 100).toFixed(1),
    isWinner: i === aiAction,
  }));

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(28,25,23,0.18)", backdropFilter: "blur(2px)" }}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50
          transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{
          height: "42vh",
          minHeight: 320,
          background: "#FFFFFF",
          boxShadow: "0 -8px 40px rgba(28,25,23,0.10), 0 -1px 0 rgba(28,25,23,0.06)",
        }}
      >
        {/* Handle + header */}
        <div
          className="flex items-start justify-between px-8 py-5"
          style={{ borderBottom: "1px solid #E7E5E4" }}
        >
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <div className="w-8 h-1 rounded-full bg-stone-300 mt-1" />
            <div>
              <h3 className="text-[17px] font-semibold text-stone-800 tracking-tight" style={SERIF}>
                Technical Appendix
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5" style={SANS}>
                Reinforcement Learning Metrics · PPO Policy Weights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600 transition-colors duration-150 mt-0.5 px-2 py-1 rounded hover:bg-stone-50"
            style={SANS}
          >
            Close <ChevronDown size={13} />
          </button>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-3 h-[calc(100%-73px)] overflow-hidden divide-x divide-stone-100">

          {/* Column 1 — Mayor Policy Bias */}
          <div className="px-7 py-5 overflow-y-auto">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-4" style={SANS}>
              Mayor Policy Bias Tuning
            </div>
            <div className="space-y-2.5">
              {(["strict", "balanced", "protective"] as BiasMode[]).map((m) => {
                const meta = {
                  strict:     { label: "Strict", sub: "Avoid false alarms" },
                  balanced:   { label: "Balanced", sub: "Default policy" },
                  protective: { label: "Protective", sub: "Zero stranded priority" },
                };
                const active = biasMode === m;
                return (
                  <label
                    key={m}
                    className={`flex items-start gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
                      active
                        ? "border-stone-300 bg-stone-50"
                        : "border-transparent hover:border-stone-200 hover:bg-stone-50/60"
                    }`}
                    onClick={() => onBiasChange(m)}
                  >
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150"
                      style={{
                        borderColor: active ? SAGE.line : "#D6D3D1",
                        background: active ? SAGE.line : "transparent",
                      }}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-stone-700" style={SANS}>{meta[m].label}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5" style={SANS}>{meta[m].sub}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Column 2 — Action Probability */}
          <div className="px-7 py-5 overflow-y-auto">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-4" style={SANS}>
              PPO Action Probability
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 12 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#A8A29E", fontSize: 9, fontFamily: "Inter, sans-serif" }}
                    axisLine={{ stroke: "#E7E5E4" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#A8A29E", fontSize: 8, fontFamily: "Inter, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <ReTooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #E7E5E4",
                      borderRadius: 8,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{ color: "#78716C" }}
                    formatter={(v: number) => [`${v}%`, "Probability"]}
                  />
                  <Bar dataKey="value" maxBarSize={32} radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.isWinner ? SAGE.line : "#E7E5E4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]" style={SANS}>
                  <span style={{ color: d.isWinner ? SAGE.text : "#A8A29E", fontWeight: d.isWinner ? 500 : 400 }}>
                    {ACTION_SHORT[i as ActionCode]}
                  </span>
                  <span style={{ color: d.isWinner ? SAGE.text : "#C4BDB9", fontWeight: d.isWinner ? 600 : 400 }}>
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3 — Tensor Inspector + Reward Matrix */}
          <div className="px-7 py-5 overflow-y-auto">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-3" style={SANS}>
              Tensor Inspector
            </div>
            <table className="w-full text-[11px] mb-5" style={SANS}>
              <tbody className="divide-y divide-stone-100">
                {[
                  ["Spatial Shape", "[4, 32, 32]"],
                  ["Vector: Hour", `${hourStep.hour}:${String(hourStep.minute).padStart(2,"0")}`],
                  ["Commute Density", (0.28 + step * 0.038).toFixed(4)],
                  ["MCDRRMO Risk Max", (step * 0.0531 + 0.0012).toFixed(4)],
                  ["Model Weights", incident.modelWeights.split("/").pop()!],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-1.5 text-stone-400 pr-4">{k}</td>
                    <td className="py-1.5 text-stone-700 text-right" style={MONO_STYLE}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-[10px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-3" style={SANS}>
              Reward Matrix
            </div>
            <table className="w-full text-[11px]" style={SANS}>
              <tbody className="divide-y divide-stone-100">
                {[
                  ["Early Warning (t < 05:30)", "+100",   SAGE.text],
                  ["Late Suspension (t > 06:00)", "−1000", TERRA.text],
                  ["False Alarm",               "−50",   "#92400E"],
                  ["Status Quo Failure",          "−2000", TERRA.text],
                  ["Legal Override",             "Active", "#78716C"],
                ].map(([k, v, col]) => (
                  <tr key={k}>
                    <td className="py-1.5 text-stone-400 pr-4">{k}</td>
                    <td className="py-1.5 text-right font-semibold" style={{ color: col, ...MONO_STYLE }}>{v}</td>
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

  // --- ADD API PREDICTION STATE ---
  const [apiPrediction, setApiPrediction] = useState<{
    ai_action_code: ActionCode;
    action_probabilities: number[];
    loaded_model_path: string;
  } | null>(null);

  // --- FETCH FROM FASTAPI BACKEND ON STATE CHANGE ---
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        // Calculate actual decimal time (e.g. 5:30 -> 5.5)
        const current_hour = HOUR_STEPS[step].hour + (HOUR_STEPS[step].minute / 60);
        const isFlooded = step >= CCTV_FEEDS[cctvIdx].floodStep;
        const isRed = INCIDENTS[incidentIdx].pagasa(step) === "RED";

        const response = await fetch("http://localhost:8000/api/predict", {
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

  // --- DERIVE ACTIVE STATE ---
  const incident = INCIDENTS[incidentIdx];
  const hourStep = HOUR_STEPS[step];
  const pagasaLevel = incident.pagasa(step);
  const actualAction: ActionCode = step >= incident.announcementStep ? incident.actualActionCode : 0;
  const cctv = CCTV_FEEDS[cctvIdx];
  const flooded = step >= cctv.floodStep;
  const waterLevel = flooded ? cctv.floodInches : cctv.dryInches;

  // --- OVERRIDE WITH LIVE PYTORCH DATA ---
  // If the API hasn't loaded yet, it falls back to the dummy incident config
  const aiAction: ActionCode = apiPrediction?.ai_action_code ?? incident.aiPolicy(step);
  const probabilities: number[] = apiPrediction?.action_probabilities ?? incident.probabilities(step);
  const modelWeights: string = apiPrediction?.loaded_model_path ?? incident.modelWeights;

  // Dynamically calculate AI saved students based on real model action
  const strandedActual = incident.strandedActual(step);
  const strandedAI = aiAction >= 2 ? 0 : (aiAction === 1 ? Math.floor(strandedActual * 0.3) : strandedActual);

  const leadTimeHours = ((Math.max(0, incident.announcementStep - step)) * 0.5).toFixed(1);
  const aiConfidence = (probabilities[aiAction] * 100).toFixed(1);

  // We clone the incident object so the Technical Drawer can display the real PyTorch weights path
  const activeIncident = { ...incident, modelWeights };

  return (
    <div
      className="min-h-screen text-stone-800"
      style={{ background: "#FAF9F6", ...SANS }}
    >
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: "rgba(250,249,246,0.85)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div className="px-7 py-3.5">
          <div className="flex items-center justify-between gap-6 flex-wrap">

            {/* Wordmark */}
            <div>
              <h1
                className="text-[15px] font-semibold text-stone-800 tracking-tight leading-none"
                style={SERIF}
              >
                Walang Pasok AI
              </h1>
              <p className="text-[10px] text-stone-400 tracking-wide mt-0.5" style={SANS}>
                Predictive Early Suspension Advisor — City of Manila LGU Decision Support
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">

              {/* Mode pill toggle */}
              <div
                className="flex rounded-full p-0.5 text-[10px] font-medium"
                style={{ background: "#EFEDE9", border: "1px solid #E2E0DC" }}
              >
                {(["historical", "live"] as DashboardMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                      mode === m
                        ? "bg-white text-stone-700 shadow-sm"
                        : "text-stone-400 hover:text-stone-600"
                    }`}
                    style={SANS}
                  >
                    {m === "historical" ? "Historical Replay" : "Live Watch"}
                  </button>
                ))}
              </div>

              {/* Incident / Region */}
              {mode === "historical" ? (
                <select
                  value={incidentIdx}
                  onChange={(e) => { setIncidentIdx(+e.target.value); setStep(6); }}
                  className="rounded-full px-3.5 py-1.5 text-[10px] text-stone-600 outline-none cursor-pointer
                    transition-all duration-150 hover:border-stone-300"
                  style={{
                    background: "#EFEDE9",
                    border: "1px solid #E2E0DC",
                    appearance: "none",
                    WebkitAppearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716C' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: 28,
                    ...SANS,
                  }}
                >
                  {INCIDENTS.map((inc, i) => (
                    <option key={inc.id} value={i}>{inc.label}</option>
                  ))}
                </select>
              ) : (
                <div
                  className="rounded-full px-3.5 py-1.5 text-[10px] text-stone-400"
                  style={{ background: "#EFEDE9", border: "1px solid #E2E0DC" }}
                >
                  Metro Manila (District 1–6)
                </div>
              )}

              {/* Hour slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-stone-700 tabular-nums min-w-[72px]" style={MONO_STYLE}>
                  {hourStep.label}
                </span>
                <div className="flex flex-col gap-0.5">
                  <input
                    type="range" min={0} max={18} step={1} value={step}
                    onChange={(e) => setStep(+e.target.value)}
                    className="light-scrubber w-32 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-stone-400" style={SANS}>
                    <span>03:00 AM</span><span>12:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Appendix trigger */}
              <button
                onClick={() => setAppendixOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-700
                  transition-colors duration-150 px-2 py-1 rounded-md hover:bg-stone-100"
                style={SANS}
              >
                View Technical Appendix
                {appendixOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            </div>
          </div>

          {/* Status strip */}
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <PagasaBadge level={pagasaLevel} />
            <span className="text-[9px] text-stone-400 tracking-widest" style={SANS}>
              {hourStep.label} · {incident.label.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="px-7 py-7 space-y-5 max-w-[1400px] mx-auto">

        {/* ── Hero Comparison ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Actual LGU Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E7E5E4",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06), 0 0 0 0 transparent",
            }}
          >
            <div style={{ height: 3, background: TERRA.line }} />
            <div className="px-7 py-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <div
                    className="text-[9px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2"
                    style={SANS}
                  >
                    Official LGU Decision
                  </div>
                  <h2
                    className="text-[22px] font-semibold text-stone-800 leading-snug"
                    style={SERIF}
                  >
                    {ACTION_NAMES[actualAction]}
                  </h2>
                  <div className="text-[10px] text-stone-400 mt-1" style={SANS}>
                    Source: Manila PIO Official Log
                  </div>
                </div>
                <div
                  className="text-[10px] font-semibold tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: TERRA.bg, color: TERRA.text, border: `1px solid ${TERRA.border}`, ...SANS }}
                >
                  A{actualAction}
                </div>
              </div>

              {step < incident.announcementStep && (
                <div
                  className="mb-4 px-4 py-2.5 rounded-xl text-[11px] flex items-center gap-2"
                  style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", ...SANS }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  Pending — Official announcement at {HOUR_STEPS[incident.announcementStep].label}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-5">
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}
                >
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-1.5" style={SANS}>
                    Estimated Stranded
                  </div>
                  <div
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ color: TERRA.text, ...SERIF }}
                  >
                    {strandedActual.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-stone-400 mt-1" style={SANS}>students</div>
                </div>
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}
                >
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-1.5" style={SANS}>
                    Commuter Safety
                  </div>
                  <StatusPill variant={strandedActual > 0 ? "critical" : "nominal"} />
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E7E5E4",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ height: 3, background: SAGE.line }} />
            <div className="px-7 py-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <div
                    className="text-[9px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2"
                    style={SANS}
                  >
                    AI Policy Recommendation
                  </div>
                  <h2
                    className="text-[22px] font-semibold text-stone-800 leading-snug"
                    style={SERIF}
                  >
                    {ACTION_NAMES[aiAction]}
                  </h2>
                  <div className="text-[10px] text-stone-400 mt-1" style={SANS}>
                    Confidence:{" "}
                    <span style={{ color: SAGE.text }}>{aiConfidence}%</span>
                    {parseFloat(leadTimeHours) > 0 && (
                      <> · Lead Time: <span style={{ color: SAGE.text }}>{leadTimeHours}h</span></>
                    )}
                  </div>
                </div>
                <div
                  className="text-[10px] font-semibold tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: SAGE.bg, color: SAGE.text, border: `1px solid ${SAGE.border}`, ...SANS }}
                >
                  A{aiAction}
                </div>
              </div>

              <div className="text-[9px] text-stone-400 mb-5" style={SANS}>
                Weights: {incident.modelWeights}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-1">
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}
                >
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-1.5" style={SANS}>
                    Estimated Stranded
                  </div>
                  <div
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ color: SAGE.text, ...SERIF }}
                  >
                    {strandedAI.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-stone-400 mt-1" style={SANS}>students</div>
                </div>
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ background: "#FAFAF9", border: "1px solid #E7E5E4" }}
                >
                  <div className="text-[9px] font-semibold tracking-[0.14em] text-stone-400 uppercase mb-1.5" style={SANS}>
                    Commuter Safety
                  </div>
                  <StatusPill variant="protected" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Visual Ground Truth ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Radar Heatmap */}
          <div
            className="rounded-2xl"
            style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
          >
            <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F4F2" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[9px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-0.5" style={SANS}>
                    PAGASA Radar Input Grid
                  </div>
                  <div className="text-[15px] font-medium text-stone-700 tracking-tight" style={SERIF}>
                    Local Manila dBZ Reflectivity
                  </div>
                  <div className="text-[9px] text-stone-400 mt-0.5" style={SANS}>32×32 Tensor Input</div>
                </div>
                <PagasaBadge level={pagasaLevel} />
              </div>
            </div>
            <div className="p-5">
              <div className="relative rounded-lg overflow-hidden" style={{ background: "#F7F5F0" }}>
                <RadarCanvas step={step} incidentIdx={incidentIdx} />
                <div className="absolute top-2 left-2 text-[8px] text-stone-400" style={SANS}>
                  14.5995°N 120.9842°E
                </div>
                <div className="absolute bottom-2 right-2 text-[8px] text-stone-400" style={SANS}>
                  {hourStep.label}
                </div>
              </div>
              {/* Legend */}
              <div className="mt-3.5 flex items-center gap-2">
                <span className="text-[9px] text-stone-400" style={SANS}>Low</span>
                <div
                  className="flex-1 h-1 rounded-full"
                  style={{ background: "linear-gradient(to right, #E2E8F0, #94A3B8, #64748B, #3D7A68, #5C5454)" }}
                />
                <span className="text-[9px] text-stone-400" style={SANS}>High dBZ</span>
              </div>
            </div>
          </div>

          {/* CCTV Feed */}
          <div
            className="rounded-2xl"
            style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
          >
            <div className="px-7 py-5" style={{ borderBottom: "1px solid #F5F4F2" }}>
              <div className="text-[9px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-2" style={SANS}>
                Traffic CCTV Feed
              </div>
              <select
                value={cctvIdx}
                onChange={(e) => setCctvIdx(+e.target.value)}
                className="w-full rounded-xl px-4 py-2 text-[11px] text-stone-600 outline-none cursor-pointer transition-all duration-150"
                style={{
                  background: "#FAFAF9",
                  border: "1px solid #E7E5E4",
                  appearance: "none",
                  WebkitAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716C' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 32,
                  ...SANS,
                }}
              >
                {CCTV_FEEDS.map((f, i) => (
                  <option key={f.id} value={i}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="p-5">
              <div
                className="relative aspect-video rounded-xl overflow-hidden bg-stone-200"
                style={{
                  backgroundImage: `url('${flooded ? cctv.imgFlood : cctv.imgDry}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "grayscale(25%) saturate(0.8)",
                }}
              >
                {/* Light desaturating veil */}
                <div
                  className="absolute inset-0"
                  style={{ background: "rgba(250,249,246,0.15)" }}
                />
                {/* Top label */}
                <div
                  className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2"
                  style={{ background: "rgba(250,249,246,0.75)", backdropFilter: "blur(6px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <span className="text-[9px] font-medium text-stone-600" style={SANS}>{cctv.corridor}</span>
                  <span className="text-[9px] text-stone-400" style={MONO_STYLE}>{hourStep.label}</span>
                </div>
                {/* Status pill */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                    style={{
                      background: flooded ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.92)",
                      border: `1px solid ${flooded ? TERRA.border : SAGE.border}`,
                      color: flooded ? TERRA.text : SAGE.text,
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      ...SANS,
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${flooded ? "animate-pulse" : ""}`}
                      style={{ background: flooded ? TERRA.line : SAGE.line }}
                    />
                    {flooded
                      ? `Water Level: ${waterLevel}" — Non-Passable`
                      : `Status: Road Clear (Dry)`}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-stone-400" style={SANS}>
                <span>Critical threshold: {cctv.criticalInches}" water level</span>
                <span>Manila CCTV Network v2.1</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Incident Timeline Strip ──────────────────────────────────────── */}
        <div
          className="rounded-2xl px-7 py-5"
          style={{ background: "#FFFFFF", border: "1px solid #E7E5E4", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
        >
          <div className="text-[9px] font-semibold tracking-[0.18em] text-stone-400 uppercase mb-4" style={SANS}>
            Simulation Timeline — Click to Scrub
          </div>
          <div className="flex items-end gap-px">
            {HOUR_STEPS.map((hs, i) => {
              const isActive = i === step;
              const isAnnouncement = i === incident.announcementStep;
              const pastOrCurrent = i <= step;
              return (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  title={hs.label}
                  className="flex flex-col items-center gap-0.5 flex-1 group"
                >
                  <div
                    className="w-full h-5 flex items-end justify-center rounded-sm transition-colors duration-100"
                    style={{
                      background: isActive ? SAGE.bg : pastOrCurrent ? "#F5F4F2" : "transparent",
                      borderBottom: `1.5px solid ${isActive ? SAGE.line : pastOrCurrent ? "#E7E5E4" : "transparent"}`,
                    }}
                  >
                    {isAnnouncement && (
                      <div className="w-px h-full" style={{ background: TERRA.line + "CC" }} />
                    )}
                  </div>
                  <div
                    className="w-1 h-1 rounded-full transition-colors duration-150"
                    style={{
                      background: isActive ? SAGE.line : pastOrCurrent ? "#D6D3D1" : "#EFEDE9",
                    }}
                  />
                  {i % 4 === 0 && (
                    <div
                      className="text-[7px] whitespace-nowrap transition-colors duration-150"
                      style={{ color: isActive ? SAGE.text : "#A8A29E", ...SANS }}
                    >
                      {hs.label.replace(" AM","").replace(" PM","")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-5 text-[9px] text-stone-400" style={SANS}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-px inline-block" style={{ background: TERRA.line + "AA" }} />
              LGU announcement ({HOUR_STEPS[incident.announcementStep].label})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: SAGE.line }} />
              Current step
            </span>
          </div>
        </div>

        {/* Bottom padding so content isn't hidden behind drawer */}
        {appendixOpen && <div style={{ height: "42vh" }} />}
      </main>

      <TechnicalAppendix
        open={appendixOpen}
        onClose={() => setAppendixOpen(false)}
        probabilities={probabilities}
        aiAction={aiAction}
        biasMode={biasMode}
        onBiasChange={setBiasMode}
        incident={activeIncident} // <-- UPDATE THIS LINE
        step={step}
      />
    </div>
  );
}
