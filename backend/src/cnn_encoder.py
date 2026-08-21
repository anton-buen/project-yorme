"""CNN Feature Extractor for Multi-Input Policy."""

import torch
import torch.nn as nn
from gymnasium import spaces
from stable_baselines3.common.torch_layers import BaseFeaturesExtractor


class LguFeaturesExtractor(BaseFeaturesExtractor):
    """
    Custom CNN feature extractor for spatial weather data and temporal vectors.
    
    Processes 4-channel spatial tensors (radar, satellite, elevation, tide) through
    a CNN branch and combines them with temporal features through a fusion network.
    
    Architecture:
        - CNN Branch: 3 Conv2D layers with ReLU activation
        - Vector Branch: Single linear layer with ReLU
        - Fusion Network: Concatenation + linear layer
        
    Args:
        observation_space: Gymnasium Dict space with 'spatial' and 'vector' keys.
        features_dim: Output feature dimension (default: 256).
    """
    
    def __init__(self, observation_space: spaces.Dict, features_dim: int = 256):
        """
        Initialize the features extractor.
        
        Args:
            observation_space: Expected to contain:
                - 'spatial': Box(shape=(4, 32, 32))
                - 'vector': Box(shape=(2,))
            features_dim: Dimension of output features.
        """
        super(LguFeaturesExtractor, self).__init__(observation_space, features_dim)

        spatial_shape = observation_space.spaces["spatial"].shape
        n_input_channels = spatial_shape[0]

        self.cnn = nn.Sequential(
            nn.Conv2d(n_input_channels, 32, kernel_size=4, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=4, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(64, 128, kernel_size=4, stride=2, padding=1),
            nn.ReLU(),
            nn.Flatten()
        )

        with torch.no_grad():
            dummy_tensor = torch.zeros((1, *spatial_shape))
            n_flatten = self.cnn(dummy_tensor).shape[1]

        vector_shape = observation_space.spaces["vector"].shape[0]
        self.vector_net = nn.Sequential(
            nn.Linear(vector_shape, 16),
            nn.ReLU()
        )

        self.fusion_net = nn.Sequential(
            nn.Linear(n_flatten + 16, features_dim),
            nn.ReLU()
        )

    def forward(self, observations: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the feature extractor.
        
        Args:
            observations: Dict containing 'spatial' and 'vector' tensors.
            
        Returns:
            torch.Tensor: Extracted features of shape (batch_size, features_dim).
        """
        spatial_features = self.cnn(observations["spatial"])
        vector_features = self.vector_net(observations["vector"])

        combined = torch.cat((spatial_features, vector_features), dim=1)
        
        return self.fusion_net(combined)