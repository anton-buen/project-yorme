"""Manila Data Pipeline for weather and geographic data fetching."""

import os
import io
import requests
import numpy as np
from PIL import Image


class ManilaDataPipeline:
    """
    Data pipeline for fetching and processing Manila weather and geographic data.
    
    Provides radar reflectivity, satellite imagery, elevation data, and tide risk
    calculations for the Manila metropolitan area.
    
    Attributes:
        manila_bbox (str): Bounding box coordinates for Manila (lon_min, lat_min, lon_max, lat_max).
        pagasa_url (str): PAGASA ArcGIS REST API endpoint.
        elevation_matrix (np.ndarray): Precomputed 32x32 elevation gradient matrix.
    """
    
    def __init__(self):
        """Initialize the Manila data pipeline with geographic bounds and cache."""
        self.manila_bbox = "120.9,14.5,121.1,14.7"
        self.pagasa_url = (
            "https://portal.georisk.gov.ph/arcgis/rest/services/"
            "PAGASA/PAGASA/MapServer/export"
        )
        self.elevation_matrix = (
            np.linspace(1.0, 0.1, 32, dtype=np.float32).reshape(32, 1) 
            * np.ones((1, 32), dtype=np.float32)
        )
        
        self._cached_radar = None
        self._cached_satellite = None

    def fetch_radar_reflectivity(self) -> np.ndarray:
        """
        Fetch PAGASA Doppler radar reflectivity data for Manila.
        
        Returns cached data if available to prevent API rate limiting.
        Falls back to zero array on network errors.
        
        Returns:
            np.ndarray: 32x32 normalized radar reflectivity values (0.0-1.0).
        """
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
            
        self._cached_radar = np.zeros((32, 32), dtype=np.float32)
        return self._cached_radar

    def fetch_regional_satellite(self) -> np.ndarray:
        """
        Fetch regional satellite imagery.
        
        Currently returns simulated cloud cover data. Can be extended
        to fetch actual satellite imagery from external APIs.
        
        Returns:
            np.ndarray: 32x32 normalized satellite data (0.0-1.0).
        """
        if self._cached_satellite is not None:
            return self._cached_satellite
            
        noise = np.random.uniform(0.1, 0.3, (32, 32)).astype(np.float32)
        self._cached_satellite = noise
        return self._cached_satellite

    def calculate_tide_risk(self, current_hour: float) -> np.ndarray:
        """
        Calculate tidal flood risk based on time of day.
        
        Peak tide risk occurs at 8:00 AM, with risk decreasing exponentially
        as time moves away from the peak.
        
        Args:
            current_hour: Hour of day (0.0-24.0).
            
        Returns:
            np.ndarray: 32x32 uniform tide risk scalar (0.0-1.0).
        """
        tide_peak_hour = 8.0
        risk_scalar = np.exp(-((current_hour - tide_peak_hour) ** 2) / 4.0)
        return np.full((32, 32), risk_scalar, dtype=np.float32)

    def get_observation_tensor(self, current_hour: float) -> np.ndarray:
        """
        Construct multi-channel observation tensor for the RL environment.
        
        Combines radar, satellite, elevation, and tide data into a single
        4-channel spatial tensor for CNN processing.
        
        Args:
            current_hour: Current simulation hour (3.0-12.0).
            
        Returns:
            np.ndarray: Shape (4, 32, 32) stacked tensor with channels:
                - ch0: Radar reflectivity
                - ch1: Satellite imagery
                - ch2: Elevation data
                - ch3: Tide risk
        """
        ch0 = self.fetch_radar_reflectivity().astype(np.float32)
        ch1 = self.fetch_regional_satellite().astype(np.float32)
        ch2 = self.elevation_matrix.astype(np.float32)
        ch3 = self.calculate_tide_risk(current_hour).astype(np.float32)
        
        return np.stack([ch0, ch1, ch2, ch3], axis=0).astype(np.float32)