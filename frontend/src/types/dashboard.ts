export type ActionCode = 0 | 1 | 2 | 3 | 4;

export const ACTION_NAMES: Record<ActionCode, string> = {
  0: "Status Quo (Normal F2F)",
  1: "Shift to ADM / Online (All Levels)",
  2: "Suspend Basic Education (K-12)",
  3: "Suspend All Levels (Basic Ed + Tertiary)",
  4: "Full LGU Lockdown (School + City Govt Work)",
};

export interface HourlyTimelineState {
  flood_active: boolean;
  pagasa_warning: "NONE" | "YELLOW" | "ORANGE" | "RED";
  stranded_count: number;
}

export interface IncidentData {
  id: string;
  name: string;
  description: string;
  actual_announcement_time: number;
  actual_action_code: ActionCode;
  hourly_timeline: Record<string, HourlyTimelineState>;
}

export interface CctvFeed {
  id: string;
  location_name: string;
  corridor: string;
  critical_water_level_inches: number;
  stream_snapshot_url: string;
}

export interface PredictionResponse {
  ai_action_code: ActionCode;
  action_probabilities: number[];
  loaded_model_path: string;
  obs_tensor_shapes: {
    spatial: [number, number, number];
    vector: [number, number];
  };
}
