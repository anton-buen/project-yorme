Role & Task:
Build a single-page, dark-mode React (Next.js App Router) component using Tailwind CSS and Lucide icons for an AI-powered emergency management dashboard called "WALANG PASOK AI: Predictive Early Suspension Advisor". The interface is a decision-support dashboard for the Mayor of Manila, comparing actual historical class suspension decisions against an AI Reinforcement Learning policy.

Strict Copy Rules:
- DO NOT use emojis anywhere in text, labels, badges, or buttons.
- Use clean, minimal typography, crisp borders, and status badges with colored dot indicators.

Layout Architecture & Visual Hierarchy:

1. TOP HEADER (Sticky, Dark Glassmorphism):
- Title: "WALANG PASOK AI: Predictive Early Suspension Advisor" (Bold, font-sans, white)
- Subtitle: "City of Manila LGU Decision Support System | Reinforcement Learning Model" (Muted gray, small font)
- Top Right Controls Container:
  - Mode Switcher: Segmented Control / Radio Toggle with options ["Historical Replay", "Live Watch"].
  - Incident Dropdown (visible in Historical Replay): Options ["July 23, 2024 Monsoon / Typhoon Carina", "August 28, 2024 Habagat Surge"].
  - Active Region Field (visible in Live Watch): Text field displaying "Metro Manila (District 1-6)" disabled.
  - Simulation Hour Slider: Scrubbable range slider from 03:00 AM to 12:00 PM in 30-minute steps. Displays formatted time prominently (e.g., "04:30 AM").
  - Technical Vault Trigger Button: "Technical Vault & Dev Logs" button with a Sliders/Terminal icon that triggers a right-side Slide-Over Sheet.

2. MAIN HERO COMPARISON SECTION (2-Column Equal Grid):
- Left Card ("ACTUAL OFFICIAL LGU DECISION"):
  - Border: 1px solid zinc-800 with a 4px left-border accent of bright red (hex #EF4444).
  - Header: "ACTUAL OFFICIAL LGU DECISION" in muted uppercase tracking-wider.
  - Primary Status Title: Display active action string (e.g., "Status Quo (Normal F2F)" or "Suspend All Levels (Basic Ed + Tertiary)").
  - Source Subtitle: "Source: Manila PIO Official Log".
  - Metrics Grid (2 columns):
    - Metric 1: "Estimated Stranded Students" (Large bold number, e.g., "5,200").
    - Metric 2: "Commuter Safety Index" (Badge with red text e.g., "CRITICAL (Commuters Stranded)").

- Right Card ("WALANGPASOK AI POLICY RECOMMENDATION"):
  - Border: 1px solid zinc-800 with a 4px left-border accent of vibrant emerald green (hex #10B981).
  - Header: "WALANGPASOK AI POLICY RECOMMENDATION" in muted uppercase tracking-wider.
  - Primary Status Title: Display predicted action string (e.g., "Suspend All Levels (Basic Ed + Tertiary)").
  - Model Subtitle: "Model Confidence: 92.4% | Lead Time: 6.5 Hours" / "Loaded Weights: models/best_model/best_model.zip".
  - Metrics Grid (2 columns):
    - Metric 1: "Estimated Stranded Students" (Large bold green number, e.g., "0").
    - Metric 2: "Commuter Safety Index" (Badge with green text e.g., "PROTECTED (Early Call)").

3. VISUAL GROUND TRUTH SECTION (2-Column Grid):
- Left Card: "PAGASA Radar Input Grid (Channel 0: dBZ Reflectivity)":
  - Title & Subtitle: "Local Manila dBZ Reflectivity Grid (32x32 Tensor Input)".
  - Visualization: A square 32x32 heatmap grid or canvas displaying multi-shade blue/teal intensity tiles representing storm vectors, with a color legend bar (0.0 to 1.0 intensity).
- Right Card: "Live / Historical Traffic CCTV Feed":
  - Selector Header: Dropdown with options ["Espana Blvd cor. Lacson Ave (UST Front)", "Taft Ave cor. UN Ave", "Mendiola St cor. C.M. Recto Ave"].
  - CCTV Stream Box: Dark container displaying a placeholder video/snapshot overlay, location tag, timestamp, and a high-contrast status badge: "STATUS: WATER LEVEL 18 INCHES (NON-PASSABLE)" in red or "STATUS: ROAD CLEAR (DRY)" in green.

4. SLIDE-OVER DRAWER ("TECHNICAL VAULT"):
- Triggers via the Header Button. Slides in from the right edge.
- Title: "TECHNICAL VAULT & DEVELOPER LOGS".
- Subtitle: "PPO Policy Weights, Tensor Shapes, and System Metrics".
- Section 1: "Mayor Policy Bias Tuning":
  - Segmented slider with options ["Strict (Avoid False Alarms)", "Balanced", "Protective (Zero Stranded)"].
- Section 2: "PPO Action Probability Distribution":
  - Vertical Bar Chart showing probability percentages across 5 Action Codes:
    - A0: Status Quo
    - A1: Shift to ADM / Online
    - A2: Suspend Basic Ed (K-12)
    - A3: Suspend All Levels
    - A4: Full LGU Lockdown
  - Highlight winning predicted action bar in green.
- Section 3: "Active Observation Tensor Inspector":
  - Key-value metadata displaying Spatial Tensor Shape (4, 32, 32), Vector Tensor [Hour, Commute Density], and MCDRRMO Risk Channel Max.
- Section 4: "Reward Matrix Weights":
  - Syntax-highlighted code block displaying penalty weights:
    Early Warning (t < 05:30): +100
    Late Suspension (t > 06:00): -1000
    False Alarm Penalty: -50
    Status Quo Failure: -2000
    Legal Constraint Override: ACTIVE
- Section 5: "System Environment Specs":
  - Environment metadata (PyTorch Version, CUDA Status, Active Device).