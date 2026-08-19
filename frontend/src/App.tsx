import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";

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
  0: "A0: Status Quo",
  1: "A1: Shift to ADM",
  2: "A2: Suspend Basic Ed",
  3: "A3: Suspend All Levels",
  4: "A4: Full LGU Lockdown",
};

// ─── Hour Steps ───────────────────────────────────────────────────────────────

interface HourStep {
  label: string;
  hour: number;
  minute: number;
}

const HOUR_STEPS: HourStep[] = Array.from({ length: 19 }, (_, i) => {
  const totalMinutes = 3 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    label: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`,
    hour: h,
    minute: m,
  };
});

// ─── Incident Definitions ─────────────────────────────────────────────────────

interface IncidentDef {
  id: string;
  label: string;
  modelWeights: string;
  announcementStep: number;
  actualActionCode: ActionCode;
  aiPolicy: (step: number) => ActionCode;
  pagasa: (step: number) => PagasaLevel;
  strandedActual: (step: number) => number;
  strandedAI: (step: number) => number;
  probabilities: (step: number) => number[];
}

function normalizeProbabilities(raw: number[]): number[] {
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((p) => +(p / sum).toFixed(3));
}

const INCIDENTS: IncidentDef[] = [
  {
    id: "carina_2024",
    label: "July 23, 2024 — Typhoon Carina",
    modelWeights: "models/carina_ppo_v3/best_model.zip",
    announcementStep: 7,
    actualActionCode: 3,
    aiPolicy: (s) => (s < 4 ? 0 : s < 6 ? 1 : s < 8 ? 2 : 3),
    pagasa: (s) => (s < 4 ? "NONE" : s < 8 ? "YELLOW" : s < 13 ? "ORANGE" : "RED"),
    strandedActual: (s) => (s < 7 ? 0 : Math.min(5200, (s - 7) * 650)),
    strandedAI: (s) => (s < 6 ? 0 : Math.min(120, (s - 6) * 15)),
    probabilities: (s) => {
      const t = Math.min(1, s / 14);
      return normalizeProbabilities([
        Math.max(0.01, 0.6 - t * 0.6),
        Math.max(0.01, 0.18 - t * 0.12),
        Math.min(0.3, 0.05 + t * 0.25),
        Math.min(0.6, t * 0.62),
        Math.min(0.08, t * 0.07),
      ]);
    },
  },
  {
    id: "habagat_2024",
    label: "August 28, 2024 — Habagat Surge",
    modelWeights: "models/habagat_ppo_v2/best_model.zip",
    announcementStep: 8,
    actualActionCode: 2,
    aiPolicy: (s) => (s < 5 ? 0 : s < 7 ? 2 : 3),
    pagasa: (s) => (s < 5 ? "NONE" : s < 9 ? "YELLOW" : s < 14 ? "ORANGE" : "RED"),
    strandedActual: (s) => (s < 8 ? 0 : Math.min(3100, (s - 8) * 390)),
    strandedAI: (s) => (s < 7 ? 0 : Math.min(80, (s - 7) * 10)),
    probabilities: (s) => {
      const t = Math.min(1, s / 13);
      return normalizeProbabilities([
        Math.max(0.01, 0.55 - t * 0.54),
        Math.max(0.01, 0.15 - t * 0.1),
        Math.min(0.45, 0.08 + t * 0.38),
        Math.min(0.48, t * 0.5),
        Math.min(0.04, t * 0.035),
      ]);
    },
  },
];

const CCTV_FEEDS = [
  {
    id: "espana",
    name: "Espana Blvd cor. Lacson Ave (UST Front)",
    corridor: "Espana Corridor",
    criticalInches: 18,
    floodStep: 8,
    floodInches: 18,
    dryInches: 2,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format",
    imgDry: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "taft",
    name: "Taft Ave cor. UN Ave",
    corridor: "Taft Corridor",
    criticalInches: 14,
    floodStep: 10,
    floodInches: 14,
    dryInches: 1,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format&sat=-50",
    imgDry: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "mendiola",
    name: "Mendiola St cor. C.M. Recto Ave",
    corridor: "Recto Corridor",
    criticalInches: 22,
    floodStep: 12,
    floodInches: 22,
    dryInches: 3,
    imgFlood: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=640&h=360&fit=crop&auto=format&hue=200",
    imgDry: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=640&h=360&fit=crop&auto=format",
  },
];

// ─── Radar Canvas ─────────────────────────────────────────────────────────────

function RadarCanvas({ step, incidentIdx }: { step: number; incidentIdx: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 32;
    const CELL = canvas.width / SIZE;
    const intensity = step / 18;

    ctx.fillStyle = "#06060C";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 0.5;
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
      const noise = ((Math.sin(x * 3.7 + step * 0.5 + incidentIdx) + Math.cos(y * 2.9 + step * 0.4)) * 0.5 + 0.5) * 0.18;
      const val = Math.min(1, core + band + noise) * intensity;

      if (val < 0.04) continue;

      let r = 0, g = 0, b = 0, a = val;
      if (val < 0.3) {
        g = Math.floor(160 * (val / 0.3));
        b = Math.floor(210 * (val / 0.3));
        a = val * 0.85;
      } else if (val < 0.6) {
        const t = (val - 0.3) / 0.3;
        r = Math.floor(t * 80);
        g = Math.floor(160 - t * 60);
        b = Math.floor(210 + t * 45);
        a = 0.88;
      } else {
        const t = (val - 0.6) / 0.4;
        r = Math.floor(80 + t * 175);
        g = Math.floor(100 - t * 90);
        b = Math.floor(255 - t * 255);
        a = 0.9 + t * 0.1;
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }

    [0.28, 0.45].forEach((r) => {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(52,211,153,0.14)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });

    ctx.strokeStyle = "rgba(52,211,153,0.16)";
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
  }, [step, incidentIdx]);

  return (
    <canvas
      ref={canvasRef}
      width={288}
      height={288}
      className="w-full aspect-square"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ─── Shared style constants ───────────────────────────────────────────────────

// Reserve JetBrains Mono only for actual data values (numbers, coordinates, code)
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

// ─── PagasaBadge ─────────────────────────────────────────────────────────────

function PagasaBadge({ level }: { level: PagasaLevel }) {
  const cfg = {
    NONE:   {
      wrap: "text-[rgba(240,240,245,0.38)] border-[rgba(255,255,255,0.1)]",
      dot: "bg-[rgba(240,240,245,0.3)]",
      label: "PAGASA: NO WARNING",
    },
    YELLOW: {
      wrap: "text-amber-400 border-amber-500/30 bg-amber-950/20",
      dot: "bg-amber-400",
      label: "PAGASA: YELLOW WARNING",
    },
    ORANGE: {
      wrap: "text-orange-400 border-orange-500/30 bg-orange-950/20",
      dot: "bg-orange-400",
      label: "PAGASA: ORANGE WARNING",
    },
    RED: {
      wrap: "text-red-400 border-red-500/30 bg-red-950/20",
      dot: "bg-red-400 animate-pulse",
      label: "PAGASA: RED WARNING",
    },
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-[10px] font-medium tracking-widest transition-colors duration-300 ${cfg.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── ActionBadge ─────────────────────────────────────────────────────────────

function ActionBadge({ code, variant }: { code: ActionCode; variant: "red" | "green" }) {
  const s =
    variant === "red"
      ? "text-[#F87171] border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.07)]"
      : "text-[#34D399] border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.07)]";
  const dot =
    variant === "red"
      ? "bg-[#F87171]"
      : "bg-[#34D399] animate-pulse";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-sm text-[10px] font-semibold tracking-widest ${s}`}
      style={MONO}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      A{code}
    </span>
  );
}

// ─── Technical Vault Drawer ───────────────────────────────────────────────────

interface VaultProps {
  open: boolean;
  onClose: () => void;
  probabilities: number[];
  aiAction: ActionCode;
  biasMode: BiasMode;
  onBiasChange: (b: BiasMode) => void;
  incident: IncidentDef;
  step: number;
}

function TechnicalVault({
  open,
  onClose,
  probabilities,
  aiAction,
  biasMode,
  onBiasChange,
  incident,
  step,
}: VaultProps) {
  const hourStep = HOUR_STEPS[step];
  const chartData = probabilities.map((p, i) => ({
    name: `A${i}`,
    value: +(p * 100).toFixed(1),
    isWinner: i === aiAction,
  }));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/55 backdrop-blur-[6px] z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] z-50 overflow-y-auto
          border-l border-[rgba(255,255,255,0.065)]
          transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "#0C0E17",
          boxShadow: open ? "-24px 0 64px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* Drawer header */}
        <div
          className="px-6 py-5 flex items-start justify-between sticky top-0 z-10"
          style={{
            background: "#0C0E17",
            borderBottom: "1px solid rgba(255,255,255,0.065)",
          }}
        >
          <div>
            <div
              className="text-[10px] font-medium tracking-[0.18em] mb-1.5"
              style={{ color: "#34D399" }}
            >
              RESTRICTED ACCESS — SYSTEM INTERNALS
            </div>
            <h2 className="text-[15px] font-semibold text-[#F0F0F5] leading-tight tracking-tight">
              Technical Vault
            </h2>
            <p className="text-[11px] text-[rgba(240,240,245,0.35)] mt-0.5">
              & Developer Logs
            </p>
            <p
              className="text-[10px] text-[rgba(240,240,245,0.22)] mt-1"
              style={MONO}
            >
              PPO Policy Weights · Tensor Shapes · System Metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[rgba(240,240,245,0.35)] hover:text-[#F0F0F5] p-1.5 rounded-md
              hover:bg-white/[0.06] transition-all duration-150 active:scale-95 mt-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1.293 1.293a1 1 0 011.414 0L7 5.586l4.293-4.293a1 1 0 111.414 1.414L8.414 7l4.293 4.293a1 1 0 01-1.414 1.414L7 8.414l-4.293 4.293a1 1 0 01-1.414-1.414L5.586 7 1.293 2.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* § 1 — Bias Tuning */}
          <section>
            <div className="text-[10px] font-medium tracking-[0.14em] text-[rgba(240,240,245,0.32)] mb-3">
              § 1 — MAYOR POLICY BIAS TUNING
            </div>
            <div className="space-y-1">
              {(["strict", "balanced", "protective"] as BiasMode[]).map((m) => {
                const labels: Record<BiasMode, string> = {
                  strict: "Strict — Avoid False Alarms",
                  balanced: "Balanced",
                  protective: "Protective — Zero Stranded",
                };
                const active = biasMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => onBiasChange(m)}
                    className={`w-full text-left px-3.5 py-2.5 text-[12px] rounded-[5px] border
                      transition-all duration-150 active:scale-[0.98] ${
                      active
                        ? "bg-[rgba(52,211,153,0.09)] border-[rgba(52,211,153,0.3)] text-[#34D399]"
                        : "border-[rgba(255,255,255,0.07)] text-[rgba(240,240,245,0.45)] hover:border-[rgba(255,255,255,0.14)] hover:text-[rgba(240,240,245,0.7)] hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className={`mr-2 font-semibold ${active ? "text-[#34D399]" : "text-transparent"}`}>
                      ›
                    </span>
                    {labels[m]}
                  </button>
                );
              })}
            </div>
          </section>

          {/* § 2 — PPO Probabilities */}
          <section>
            <div className="text-[10px] font-medium tracking-[0.14em] text-[rgba(240,240,245,0.32)] mb-3">
              § 2 — PPO ACTION PROBABILITY DISTRIBUTION
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 2, right: 2, left: -22, bottom: 16 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(240,240,245,0.28)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "rgba(240,240,245,0.28)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <ReTooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{
                      background: "#0C0E17",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 6,
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10,
                      color: "#F0F0F5",
                    }}
                    labelStyle={{ color: "rgba(240,240,245,0.45)" }}
                    formatter={(v: number) => [`${v}%`, "Probability"]}
                  />
                  <Bar dataKey="value" maxBarSize={38} radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.isWinner ? "#34D399" : "rgba(255,255,255,0.09)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-1">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span
                    className={`transition-colors duration-200 ${
                      d.isWinner
                        ? "text-[#34D399] font-medium"
                        : "text-[rgba(240,240,245,0.3)]"
                    }`}
                    style={MONO}
                  >
                    {d.isWinner ? "› " : "  "}
                    {ACTION_SHORT[i as ActionCode]}
                  </span>
                  <span
                    className={`transition-colors duration-200 ${
                      d.isWinner
                        ? "text-[#34D399] font-semibold"
                        : "text-[rgba(240,240,245,0.2)]"
                    }`}
                    style={MONO}
                  >
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* § 3 — Tensor Inspector */}
          <section>
            <div className="text-[10px] font-medium tracking-[0.14em] text-[rgba(240,240,245,0.32)] mb-3">
              § 3 — ACTIVE OBSERVATION TENSOR INSPECTOR
            </div>
            <div
              className="rounded-[5px] overflow-hidden divide-y"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.065)",
                borderColor: "rgba(255,255,255,0.065)",
                divideColor: "rgba(255,255,255,0.04)",
              }}
            >
              {[
                ["Spatial Tensor Shape", "[4, 32, 32]"],
                ["Vector: Hour", `[${hourStep.hour}.${String(hourStep.minute).padStart(2, "0")}]`],
                ["Vector: Commute Density", `[${(0.28 + step * 0.038).toFixed(4)}]`],
                ["MCDRRMO Risk Ch. Max", `${(step * 0.0531 + 0.0012).toFixed(4)}`],
                ["Loaded Weights", incident.modelWeights.split("/").pop()!],
                ["Obs Normalization", "MinMaxScaler(0,1)"],
              ].map(([k, v], ri) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-3.5 py-2.5 gap-4"
                  style={{ borderTop: ri === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="text-[11px] text-[rgba(240,240,245,0.38)]">{k}</span>
                  <span
                    className="text-[11px] text-[#34D399] shrink-0"
                    style={MONO}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* § 4 — Reward Matrix */}
          <section>
            <div className="text-[10px] font-medium tracking-[0.14em] text-[rgba(240,240,245,0.32)] mb-3">
              § 4 — REWARD MATRIX WEIGHTS
            </div>
            <pre
              className="rounded-[5px] px-4 py-3.5 text-[11px] leading-[1.9] overflow-x-auto whitespace-pre"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.065)",
                ...MONO,
              }}
            >
<span style={{ color: "rgba(240,240,245,0.25)" }}># PPO Reward Signal Configuration</span>
<span style={{ color: "rgba(240,240,245,0.12)" }}>{"─".repeat(36)}</span>
<span style={{ color: "#34D399" }}>Early Warning</span>{"   "}<span style={{ color: "rgba(240,240,245,0.3)" }}>(t &lt; 05:30)  </span> <span style={{ color: "#34D399" }}>+100</span>
<span style={{ color: "#F87171" }}>Late Suspension</span>{"  "}<span style={{ color: "rgba(240,240,245,0.3)" }}>(t &gt; 06:00)  </span> <span style={{ color: "#F87171" }}>-1000</span>
<span style={{ color: "#FB923C" }}>False Alarm</span>{"      "}<span style={{ color: "rgba(240,240,245,0.3)" }}>              </span> <span style={{ color: "#FB923C" }}>-50</span>
<span style={{ color: "#F87171" }}>Status Quo Fail</span>{"  "}<span style={{ color: "rgba(240,240,245,0.3)" }}>              </span> <span style={{ color: "#F87171" }}>-2000</span>
<span style={{ color: "rgba(240,240,245,0.12)" }}>{"─".repeat(36)}</span>
<span style={{ color: "rgba(240,240,245,0.3)" }}>Legal Override   </span>               <span style={{ color: "#FCD34D" }}>ACTIVE</span></pre>
          </section>

          {/* § 5 — System Specs */}
          <section>
            <div className="text-[10px] font-medium tracking-[0.14em] text-[rgba(240,240,245,0.32)] mb-3">
              § 5 — SYSTEM ENVIRONMENT SPECS
            </div>
            <div
              className="rounded-[5px] overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.065)",
              }}
            >
              {[
                ["PyTorch Version", "2.3.1+cu121"],
                ["CUDA Status", "AVAILABLE"],
                ["Active Device", "cuda:0 (NVIDIA T4)"],
                ["PPO Rollout Buffer", "2048 steps"],
                ["Policy Network", "MlpPolicy + SpatialCNN"],
                ["Training Timesteps", "500,000"],
              ].map(([k, v], ri) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-3.5 py-2.5 gap-4"
                  style={{ borderTop: ri === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span className="text-[11px] text-[rgba(240,240,245,0.38)]">{k}</span>
                  <span
                    className="text-[11px] shrink-0"
                    style={{
                      color: v === "AVAILABLE" ? "#34D399" : "rgba(240,240,245,0.65)",
                      ...MONO,
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<DashboardMode>("historical");
  const [incidentIdx, setIncidentIdx] = useState(0);
  const [step, setStep] = useState(6);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [biasMode, setBiasMode] = useState<BiasMode>("balanced");
  const [cctvIdx, setCctvIdx] = useState(0);

  const incident = INCIDENTS[incidentIdx];
  const hourStep = HOUR_STEPS[step];
  const pagasaLevel = incident.pagasa(step);
  const actualAction: ActionCode = step >= incident.announcementStep ? incident.actualActionCode : 0;
  const aiAction = incident.aiPolicy(step);
  const strandedActual = incident.strandedActual(step);
  const strandedAI = incident.strandedAI(step);
  const probabilities = incident.probabilities(step);
  const cctv = CCTV_FEEDS[cctvIdx];
  const flooded = step >= cctv.floodStep;
  const waterLevel = flooded ? cctv.floodInches : cctv.dryInches;
  const leadTimeHours = ((Math.max(0, incident.announcementStep - step)) * 0.5).toFixed(1);
  const aiConfidence = (probabilities[aiAction] * 100).toFixed(1);

  return (
    <div className="min-h-screen text-[#F0F0F5]" style={{ background: "#09090E" }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: "rgba(9,9,14,0.88)",
          borderBottom: "1px solid rgba(255,255,255,0.065)",
        }}
      >
        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">

            {/* Wordmark */}
            <div>
              <div className="text-[13px] font-semibold text-[#F0F0F5] tracking-tight leading-none">
                WALANG PASOK AI
              </div>
              <div
                className="text-[10px] text-[rgba(240,240,245,0.3)] tracking-widest mt-0.5"
                style={MONO}
              >
                City of Manila LGU · Reinforcement Learning Decision Support
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 flex-wrap">

              {/* Mode toggle */}
              <div
                className="flex rounded-[5px] overflow-hidden text-[10px] font-medium"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {(["historical", "live"] as DashboardMode[]).map((m, mi) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 uppercase tracking-widest transition-all duration-150 active:scale-[0.97] ${
                      mode === m
                        ? "bg-[rgba(52,211,153,0.1)] text-[#34D399]"
                        : "text-[rgba(240,240,245,0.38)] hover:text-[rgba(240,240,245,0.7)] hover:bg-white/[0.04]"
                    } ${mi === 0 ? "" : ""}`}
                    style={{
                      borderRight: mi === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                    }}
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
                  className="rounded-[5px] px-3 py-1.5 text-[10px] text-[rgba(240,240,245,0.75)]
                    transition-all duration-150 cursor-pointer outline-none
                    hover:border-[rgba(255,255,255,0.16)] hover:text-[rgba(240,240,245,0.9)]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    ...MONO,
                    fontSize: 10,
                  }}
                >
                  {INCIDENTS.map((inc, i) => (
                    <option key={inc.id} value={i}>{inc.label}</option>
                  ))}
                </select>
              ) : (
                <div
                  className="rounded-[5px] px-3 py-1.5 text-[10px] cursor-not-allowed"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: "rgba(240,240,245,0.2)",
                    ...MONO,
                    fontSize: 10,
                  }}
                >
                  Metro Manila (District 1–6)
                </div>
              )}

              {/* Hour slider */}
              <div className="flex items-center gap-2.5">
                <div
                  className="font-semibold text-sm tabular-nums min-w-[78px]"
                  style={{ color: "#34D399", ...MONO }}
                >
                  {hourStep.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  <input
                    type="range" min={0} max={18} step={1} value={step}
                    onChange={(e) => setStep(+e.target.value)}
                    className="w-32 cursor-pointer"
                  />
                  <div
                    className="flex justify-between text-[8px]"
                    style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                  >
                    <span>03:00</span><span>12:00</span>
                  </div>
                </div>
              </div>

              {/* Vault button */}
              <button
                onClick={() => setVaultOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-[10px] font-medium
                  text-[rgba(240,240,245,0.45)] hover:text-[rgba(240,240,245,0.85)]
                  hover:bg-white/[0.05]
                  transition-all duration-150 active:scale-[0.97]"
                style={{ border: "1px solid rgba(255,255,255,0.09)" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  <path d="M7 7h.01M12 7h5M7 11h.01M12 11h5" />
                </svg>
                Technical Vault & Dev Logs
              </button>
            </div>
          </div>

          {/* Status strip */}
          <div className="mt-2.5 flex items-center gap-3 flex-wrap">
            <PagasaBadge level={pagasaLevel} />
            <span
              className="text-[9px] tracking-widest"
              style={{ color: "rgba(240,240,245,0.28)", ...MONO }}
            >
              SIM {hourStep.label} · {incident.label.toUpperCase()}
            </span>
            <span
              className="text-[9px]"
              style={{ color: "rgba(240,240,245,0.14)", ...MONO }}
            >
              {incident.modelWeights}
            </span>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 space-y-4 max-w-[1400px] mx-auto">

        {/* ── Hero Comparison ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Actual LGU Card */}
          <div
            className="rounded-[7px] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.025)]"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderLeft: "2.5px solid #F87171",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium tracking-[0.16em] mb-1.5 text-[rgba(240,240,245,0.32)]">
                    ACTUAL OFFICIAL LGU DECISION
                  </div>
                  <h2 className="text-[17px] font-semibold text-[#F0F0F5] leading-snug tracking-tight">
                    {ACTION_NAMES[actualAction]}
                  </h2>
                  <div
                    className="text-[10px] mt-1"
                    style={{ color: "rgba(240,240,245,0.35)", ...MONO }}
                  >
                    Source: Manila PIO Official Log
                  </div>
                </div>
                <ActionBadge code={actualAction} variant="red" />
              </div>

              {step < incident.announcementStep && (
                <div
                  className="mb-3 px-3 py-2 rounded-[5px] text-[10px] flex items-center gap-2"
                  style={{
                    background: "rgba(251,191,36,0.06)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    color: "rgba(251,191,36,0.8)",
                    ...MONO,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse shrink-0" />
                  DECISION PENDING — Official announcement at {HOUR_STEPS[incident.announcementStep].label}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div
                  className="px-4 py-3 rounded-[5px]"
                  style={{
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(255,255,255,0.055)",
                  }}
                >
                  <div className="text-[10px] font-medium tracking-wider mb-1 text-[rgba(240,240,245,0.32)]">
                    Estimated Stranded
                  </div>
                  <div
                    className="text-[22px] font-semibold tabular-nums"
                    style={{ color: "#F87171", ...MONO }}
                  >
                    {strandedActual.toLocaleString()}
                  </div>
                  <div
                    className="text-[9px] mt-0.5"
                    style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                  >
                    students
                  </div>
                </div>
                <div
                  className="px-4 py-3 rounded-[5px]"
                  style={{
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(255,255,255,0.055)",
                  }}
                >
                  <div className="text-[10px] font-medium tracking-wider mb-1 text-[rgba(240,240,245,0.32)]">
                    Commuter Safety
                  </div>
                  <div
                    className="text-[10px] font-medium mt-1.5 flex items-center gap-1.5 transition-colors duration-300"
                    style={{
                      color: strandedActual > 0 ? "#F87171" : "rgba(240,240,245,0.35)",
                      ...MONO,
                    }}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${strandedActual > 0 ? "animate-pulse" : ""}`}
                      style={{ background: strandedActual > 0 ? "#F87171" : "rgba(240,240,245,0.2)" }}
                    />
                    {strandedActual > 0 ? "CRITICAL — Commuters Stranded" : "NOMINAL — No Active Alert"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div
            className="rounded-[7px] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.025)]"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderLeft: "2.5px solid #34D399",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            <div className="px-5 pt-4 pb-5">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium tracking-[0.16em] mb-1.5 text-[rgba(240,240,245,0.32)]">
                    WALANGPASOK AI POLICY RECOMMENDATION
                  </div>
                  <h2 className="text-[17px] font-semibold text-[#F0F0F5] leading-snug tracking-tight">
                    {ACTION_NAMES[aiAction]}
                  </h2>
                  <div
                    className="text-[10px] mt-1"
                    style={{ color: "rgba(240,240,245,0.35)", ...MONO }}
                  >
                    Model Confidence:{" "}
                    <span style={{ color: "#34D399" }}>{aiConfidence}%</span>
                    {parseFloat(leadTimeHours) > 0 && (
                      <> · Lead Time:{" "}
                        <span style={{ color: "#34D399" }}>{leadTimeHours}h</span>
                      </>
                    )}
                  </div>
                </div>
                <ActionBadge code={aiAction} variant="green" />
              </div>

              <div
                className="mb-3 text-[9px]"
                style={{ color: "rgba(240,240,245,0.2)", ...MONO }}
              >
                Loaded Weights: {incident.modelWeights}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div
                  className="px-4 py-3 rounded-[5px]"
                  style={{
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(255,255,255,0.055)",
                  }}
                >
                  <div className="text-[10px] font-medium tracking-wider mb-1 text-[rgba(240,240,245,0.32)]">
                    Estimated Stranded
                  </div>
                  <div
                    className="text-[22px] font-semibold tabular-nums"
                    style={{ color: "#34D399", ...MONO }}
                  >
                    {strandedAI.toLocaleString()}
                  </div>
                  <div
                    className="text-[9px] mt-0.5"
                    style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                  >
                    students
                  </div>
                </div>
                <div
                  className="px-4 py-3 rounded-[5px]"
                  style={{
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(255,255,255,0.055)",
                  }}
                >
                  <div className="text-[10px] font-medium tracking-wider mb-1 text-[rgba(240,240,245,0.32)]">
                    Commuter Safety
                  </div>
                  <div
                    className="text-[10px] font-medium mt-1.5 flex items-center gap-1.5"
                    style={{ color: "#34D399", ...MONO }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0" />
                    PROTECTED — Early Call
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Visual Ground Truth ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Radar Heatmap */}
          <div
            className="rounded-[7px]"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.065)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="px-5 py-3 flex items-start justify-between gap-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}
            >
              <div>
                <div className="text-[10px] font-medium tracking-[0.16em] mb-0.5 text-[rgba(240,240,245,0.32)]">
                  PAGASA RADAR INPUT GRID
                </div>
                <div className="text-[14px] font-semibold text-[#F0F0F5] tracking-tight">
                  Channel 0: dBZ Reflectivity
                </div>
                <div
                  className="text-[9px] mt-0.5"
                  style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                >
                  Local Manila Grid — 32×32 Tensor Input
                </div>
              </div>
              <PagasaBadge level={pagasaLevel} />
            </div>
            <div className="p-4">
              <div className="relative">
                <RadarCanvas step={step} incidentIdx={incidentIdx} />
                <div
                  className="absolute top-2 left-2 text-[8px]"
                  style={{ color: "rgba(52,211,153,0.45)", ...MONO }}
                >
                  14.5995°N 120.9842°E
                </div>
                <div
                  className="absolute bottom-2 right-2 text-[8px]"
                  style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                >
                  {hourStep.label}
                </div>
                <div
                  className="absolute top-2 right-2 text-[8px]"
                  style={{ color: "rgba(240,240,245,0.18)", ...MONO }}
                >
                  PAGASA Manila WSR-88D
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="text-[8px] shrink-0"
                  style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                >
                  0.0
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, #06060C, #00a0b4, #3060ff, #8040e0, #e04000, #ff0000)",
                  }}
                />
                <span
                  className="text-[8px] shrink-0"
                  style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
                >
                  1.0 dBZ
                </span>
              </div>
            </div>
          </div>

          {/* CCTV Feed */}
          <div
            className="rounded-[7px]"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.065)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="px-5 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}
            >
              <div className="text-[10px] font-medium tracking-[0.16em] mb-2 text-[rgba(240,240,245,0.32)]">
                LIVE / HISTORICAL TRAFFIC CCTV FEED
              </div>
              <select
                value={cctvIdx}
                onChange={(e) => setCctvIdx(+e.target.value)}
                className="w-full rounded-[5px] px-3 py-1.5 text-[10px]
                  text-[rgba(240,240,245,0.75)] transition-all duration-150 cursor-pointer outline-none
                  hover:border-[rgba(255,255,255,0.14)]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  ...MONO,
                  fontSize: 10,
                }}
              >
                {CCTV_FEEDS.map((f, i) => (
                  <option key={f.id} value={i}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="p-4">
              <div
                className="relative aspect-video bg-zinc-900 overflow-hidden rounded-[4px]"
                style={{
                  backgroundImage: `url('${flooded ? cctv.imgFlood : cctv.imgDry}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/78" />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)",
                  }}
                />
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2.5 py-2 bg-black/50">
                  <span
                    className="text-[8px] text-white/60"
                    style={MONO}
                  >
                    {cctv.corridor.toUpperCase()} · CAM-0{cctvIdx + 1}
                  </span>
                  <span
                    className="text-[8px] text-white/40"
                    style={MONO}
                  >
                    {hourStep.label} · {incident.label.split("—")[0].trim().toUpperCase()}
                  </span>
                </div>
                <div
                  className="absolute top-8 left-2.5 text-[8px] text-white/30 max-w-[55%] leading-snug"
                  style={MONO}
                >
                  {cctv.name}
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <div
                    className="px-3 py-2 text-[10px] font-semibold tracking-wide flex items-center gap-2 rounded-[4px] transition-colors duration-300"
                    style={{
                      background: flooded ? "rgba(127,29,29,0.88)" : "rgba(6,78,59,0.88)",
                      border: `1px solid ${flooded ? "rgba(248,113,113,0.35)" : "rgba(52,211,153,0.3)"}`,
                      color: flooded ? "#F87171" : "#34D399",
                      backdropFilter: "blur(4px)",
                      ...MONO,
                      fontSize: 10,
                    }}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${flooded ? "animate-pulse" : ""}`}
                      style={{ background: flooded ? "#F87171" : "#34D399" }}
                    />
                    {flooded
                      ? `STATUS: WATER LEVEL ${waterLevel} INCHES (NON-PASSABLE)`
                      : `STATUS: ROAD CLEAR (DRY) — ${waterLevel}" WATER`}
                  </div>
                </div>
              </div>
              <div
                className="mt-2 flex items-center justify-between text-[9px]"
                style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
              >
                <span>Critical threshold: {cctv.criticalInches}" water level</span>
                <span>Manila CCTV Network v2.1</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Incident Timeline Strip ──────────────────────────────────────── */}
        <div
          className="rounded-[7px] px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.065)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          <div className="text-[10px] font-medium tracking-[0.16em] mb-3 text-[rgba(240,240,245,0.32)]">
            SIMULATION TIMELINE — SCRUB TO REPLAY
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
                    className="w-full h-5 flex items-end justify-center transition-colors duration-100"
                    style={{
                      background: isActive
                        ? "rgba(52,211,153,0.08)"
                        : pastOrCurrent
                        ? "rgba(255,255,255,0.02)"
                        : "transparent",
                      borderBottom: `1px solid ${
                        isActive
                          ? "rgba(52,211,153,0.45)"
                          : pastOrCurrent
                          ? "rgba(255,255,255,0.055)"
                          : "transparent"
                      }`,
                    }}
                  >
                    {isAnnouncement && (
                      <div
                        className="w-px h-full"
                        style={{ background: "rgba(248,113,113,0.75)" }}
                      />
                    )}
                  </div>
                  <div
                    className="w-1 h-1 rounded-full transition-colors duration-150"
                    style={{
                      background: isActive
                        ? "#34D399"
                        : pastOrCurrent
                        ? "rgba(240,240,245,0.2)"
                        : "rgba(240,240,245,0.08)",
                    }}
                  />
                  {i % 4 === 0 && (
                    <div
                      className="text-[7px] whitespace-nowrap transition-colors duration-150"
                      style={{
                        color: isActive ? "#34D399" : "rgba(240,240,245,0.2)",
                        ...MONO,
                      }}
                    >
                      {hs.label.replace(" AM", "").replace(" PM", "")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div
            className="mt-2.5 flex items-center gap-5 text-[8px]"
            style={{ color: "rgba(240,240,245,0.22)", ...MONO }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-px inline-block" style={{ background: "rgba(248,113,113,0.7)" }} />
              LGU announcement ({HOUR_STEPS[incident.announcementStep].label})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#34D399" }} />
              current simulation step
            </span>
          </div>
        </div>

      </main>

      <TechnicalVault
        open={vaultOpen}
        onClose={() => setVaultOpen(false)}
        probabilities={probabilities}
        aiAction={aiAction}
        biasMode={biasMode}
        onBiasChange={setBiasMode}
        incident={incident}
        step={step}
      />
    </div>
  );
}
