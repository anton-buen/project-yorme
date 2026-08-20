"""
LGU Suspension Environment

Custom Gymnasium environment for training RL agents to make class suspension decisions.
Implements a realistic multi-action space with legal constraints and temporal dynamics.
"""

from src.data_fetcher import ManilaDataPipeline
import gymnasium as gym
from gymnasium import spaces
import numpy as np


class LguSuspensionEnv(gym.Env):
    """
    Gymnasium environment for LGU class/work suspension decision-making.
    
    Action Space (Discrete 5):
        0: Status Quo (Normal F2F)
        1: Shift to ADM/Online (All Levels)
        2: Suspend Basic Ed (DepEd automatic trigger/Localized)
        3: Suspend All Levels (Basic Ed + Tertiary)
        4: Full LGU Lockdown (All Levels + Non-Essential Govt)
    
    Observation Space (Dict):
        spatial: 4x32x32 tensor (radar, flood maps, population density, infrastructure)
        vector: 2D array [current_hour, commute_density]
    
    Attributes:
        current_hour (float): Simulation time from 3.0 to 12.0
        current_escalation (int): Prevents de-escalation of announcements
        _will_flood (bool): Ground truth flooding state for episode
        _has_pagasa_red_warning (bool): PAGASA Red Warning state
    """
    
    metadata = {"render_modes": ["human"], "render_fps": 1}

    def __init__(self):
        super(LguSuspensionEnv, self).__init__()

        self.data_pipeline = ManilaDataPipeline()

        self.action_space = spaces.Discrete(5)

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

        self.current_hour = 3.0
        self.max_hour = 12.0
        self.current_escalation = 0
        
        self._will_flood = False
        self._has_pagasa_red_warning = False

    def reset(self, seed=None, options=None):
        """
        Reset environment to initial state.
        
        Args:
            seed: Random seed for reproducibility
            options: Optional reset configuration
            
        Returns:
            tuple: (observation, info)
        """
        super().reset(seed=seed)
        
        self.current_hour = 3.0
        self.current_escalation = 0
        
        self._will_flood = self.np_random.choice([True, False], p=[0.6, 0.4])
        self._has_pagasa_red_warning = self.np_random.choice([True, False], p=[0.2, 0.8])
        
        obs = self._get_obs()
        info = self._get_info()
        return obs, info

    def _get_obs(self):
        """
        Construct observation dictionary.
        
        Returns:
            dict: Contains 'spatial' (4x32x32 tensor) and 'vector' (2D array)
        """
        spatial_tensor = self.data_pipeline.get_observation_tensor(self.current_hour).astype(np.float32)
        
        commute_density = 1.0 if 5.0 <= self.current_hour <= 7.0 else 0.2
        vector_tensor = np.array([self.current_hour, commute_density], dtype=np.float32)

        return {
            "spatial": spatial_tensor,
            "vector": vector_tensor
        }

    def _get_info(self):
        """Get episode metadata for debugging."""
        return {
            "time": f"{int(self.current_hour):02d}:00",
            "active_level": self.current_escalation,
            "pagasa_red_warning": self._has_pagasa_red_warning,
            "ground_truth_flood": self._will_flood
        }

    def step(self, action):
        """
        Execute one timestep of the environment.
        
        Args:
            action (int): Action code from 0-4
            
        Returns:
            tuple: (observation, reward, terminated, truncated, info)
            
        Reward Structure:
            - Early proactive suspensions before floods: +100
            - Late suspensions during commute peak: -500 to -1000
            - No action during actual flood: -2000
            - False alarms (unnecessary suspensions): -10 to -50
            - Correct status quo on clear days: +20
        """
        reward = 0
        terminated = False
        truncated = False

        action = max(action, self.current_escalation)
        
        if self._has_pagasa_red_warning and action < 2:
            action = 2
            
        self.current_escalation = action

        is_commute_peak = 5.0 <= self.current_hour <= 7.0
        is_late = self.current_hour > 6.0

        if self._will_flood:
            if action >= 3:
                if self.current_hour <= 5.5:
                    reward += 100
                elif is_late:
                    reward -= 1000 
            elif action == 1 or action == 2:
                if is_commute_peak:
                    reward -= 500
            elif action == 0:
                reward -= 2000
        else:
            if action >= 2: 
                reward -= 50
            elif action == 1:
                reward -= 10
            elif action == 0:
                reward += 20

        self.current_hour += 1.0

        if self.current_hour >= self.max_hour or self.current_escalation == 4:
            terminated = True

        info = self._get_info()
        obs = self._get_obs()

        return obs, reward, terminated, truncated, info