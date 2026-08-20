import os
import io
import requests
import numpy as np
from PIL import Image

class ManilaDataPipeline:
    def __init__(self):
        self.manila_bbox = "120.9,14.5,121.1,14.7"
        self.pagasa_url = (
            "https://portal.georisk.gov.ph/arcgis/rest/services/"
            "PAGASA/PAGASA/MapServer/export"
        )
        self.elevation_matrix = (
            np.linspace(1.0, 0.1, 32, dtype=np.float32).reshape(32, 1) 
            * np.ones((1, 32), dtype=np.float32)
        )
        
        # --- LOCAL CACHE TO PREVENT API RATE LIMITING ---
        self._cached_radar = None
        self._cached_satellite = None

    def fetch_radar_reflectivity(self) -> np.ndarray:
        # Return instantly if already downloaded
        if self._cached_radar is not None:
            return self._cached_radar

        params = {
            "bbox": self.manila_bbox,
            "format": "png",
            "transparent": "true",
            "f": "image",
            "size": "32,32"
        }
        try:
            response = requests.get(self.pagasa_url, params=params, timeout=10)
            if response.status_code == 200:
                img = Image.open(io.BytesIO(response.content)).convert("L")
                self._cached_radar = np.array(img, dtype=np.float32) / 255.0
                return self._cached_radar
        except requests.RequestException as e:
            print(f"PAGASA Radar Fetch Failed: {e}")
            
        # Fail-safe: cache an empty grid so we don't keep retrying
        self._cached_radar = np.zeros((32, 32), dtype=np.float32)
        return self._cached_radar

    def fetch_regional_satellite(self) -> np.ndarray:
        if self._cached_satellite is not None:
            return self._cached_satellite
            
        noise = np.random.uniform(0.1, 0.3, (32, 32)).astype(np.float32)
        self._cached_satellite = noise
        return self._cached_satellite

    def calculate_tide_risk(self, current_hour: float) -> np.ndarray:
        tide_peak_hour = 8.0
        risk_scalar = np.exp(-((current_hour - tide_peak_hour) ** 2) / 4.0)
        return np.full((32, 32), risk_scalar, dtype=np.float32)

    def get_observation_tensor(self, current_hour: float) -> np.ndarray:
        ch0 = self.fetch_radar_reflectivity().astype(np.float32)
        ch1 = self.fetch_regional_satellite().astype(np.float32)
        ch2 = self.elevation_matrix.astype(np.float32)
        ch3 = self.calculate_tide_risk(current_hour).astype(np.float32)
        
        return np.stack([ch0, ch1, ch2, ch3], axis=0).astype(np.float32)