import gymnasium as gym
from gymnasium import spaces
import numpy as np

class LguSuspensionEnv(gym.Env):
    """
    Custom Environment for simulating LGU Class/Work Suspension decisions.
    Follows the Gymnasium API standard.
    """
    metadata = {"render_modes": ["human"], "render_fps": 1}

    def __init__(self):
        super(LguSuspensionEnv, self).__init__()

        # --- ACTION SPACE ---

        # 0:Status Quo (Normal F2F)
        # 1:Shift to ADM/Online (All Levels)
        # 2:Suspend Basic Ed (DepEd automatic trigger /Localized)
        # 3: Suspend All Levels (Basic Ed + Tertiary)
        # 4:Full LGU Lockdown (All Levels + Non-Essential Govt)
        self.action_space = spaces.Discrete(5)

        # --- OBSERVATION SPACE ---

        # Using a Dict space to pass both the CNN spatial maps and temporal scalars
        # pytorch expects channelsfirst tensors (C, H, W)
        self.observation_space = spaces.Dict({
            "spatial": spaces.Box(
                low=0.0, high=1.0, 
                shape=(4, 32, 32), 
                dtype=np.float32
            ),
            "vector": spaces.Box(
                low=0.0, high=24.0, 
                shape=(2,), 
                dtype=np.float32
            )
        })

        # --- INTERNAL STATE ---
        self.current_hour = 3.0
        self.max_hour = 12.0
        self.current_escalation = 0  # To prevent backtracking actions
        
        # Synthetic hidden state for the episode (Mocked ground truth)
        self._will_flood = False
        self._has_pagasa_red_warning = False

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        # Reset temporal state
        self.current_hour = 3.0
        self.current_escalation = 0
        
        # Randomize synthetic episode conditions for training variety
        self._will_flood = self.np_random.choice([True, False], p=[0.6, 0.4])
        self._has_pagasa_red_warning = self.np_random.choice([True, False], p=[0.2, 0.8])
        
        obs = self._get_obs()
        info = self._get_info()
        return obs, info

    def _get_obs(self):
        """Generates the mocked state tensor for the current step."""
        # 1. Spatial Tensor (4, 32, 32)
        # in final build, this will be populated by actual PAGASA radar scrapers
        spatial_tensor = np.zeros((4, 32, 32), dtype=np.float32)
        
        # Channel 0: Radar Reflectivity (Mocked based on flood probability)
        if self._will_flood:
            spatial_tensor[0, :, :] = self.np_random.uniform(0.5, 1.0, (32, 32))
            
        # Channel 1: Regional Trajectory
        spatial_tensor[1, :, :] = self.np_random.uniform(0.0, 0.5, (32, 32))
        
        # Channel 2: Static Barangay Vulnerability (Elevation)
        spatial_tensor[2, :, :] = self.np_random.uniform(0.0, 1.0, (32, 32))
        
        # Channel 3: MCDRRMO Risk Index (Tide + Drainage)
        spatial_tensor[3, :, :] = 0.8 if self._will_flood else 0.2

        # 2. Vector Input [current_hour, commute_density]
        # density spikes between 5:00 AM so (5.0) and 7:00 AM(7.0)
        commute_density = 1.0 if 5.0 <= self.current_hour <= 7.0 else 0.2
        vector_tensor = np.array([self.current_hour, commute_density], dtype=np.float32)

        return {
            "spatial": spatial_tensor,
            "vector": vector_tensor
        }

    def _get_info(self):
        return {
            "time": f"{int(self.current_hour):02d}:00",
            "active_level": self.current_escalation,
            "pagasa_red_warning": self._has_pagasa_red_warning,
            "ground_truth_flood": self._will_flood
        }

    def step(self, action):
        reward = 0
        terminated = False
        truncated = False

        # --- 1. JURISDICTIONAL CONSTRAINTS ---
        # The Mayor cannot de-escalate an announcement (e.g., cancel classes then un-cancel them)
        action = max(action, self.current_escalation)
        
        # --- 2. LEGAL OVERRIDES ---
        # if there is a Red Warning, the law mandates at least Basic Ed is suspended (Level 2)
        if self._has_pagasa_red_warning and action < 2:
            action = 2
            
        self.current_escalation = action

        # --- 3. REWARD CALCULATION ---
        is_commute_peak = 5.0 <= self.current_hour <= 7.0
        is_late = self.current_hour > 6.0

        if self._will_flood:
            if action >= 3:  # College suspended
                if self.current_hour <= 5.5:
                    reward += 100  # Proactive guard (Early warning)
                elif is_late:
                    # Penalty multiplier for time spent stranded
                    reward -= 1000 
            elif action == 1 or action == 2:
                # Basic ed safe or ADM enacted, but college students still stranded
                if is_commute_peak:
                    reward -= 500
            elif action == 0:
                reward -= 2000  # complete utter failure 
        else:
            # False Alarm Scenarios;
            if action >= 2: 
                reward -= 50  # penalty / unnecessary tuition loss
            elif action == 1:
                reward -= 10  # ADM is a safe middle ground with low penalty
            elif action == 0:
                reward += 20  # perfect call (Status quo on a sunny day)

        # --- 4. TIME ADVANCEMENT & TERMINATION ---
        self.current_hour += 1.0

        if self.current_hour >= self.max_hour or self.current_escalation == 4:
            terminated = True

        info = self._get_info()
        obs = self._get_obs()

        return obs, reward, terminated, truncated, info