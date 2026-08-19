import torch
import torch.nn as nn
from gymnasium import spaces
from stable_baselines3.common.torch_layers import BaseFeaturesExtractor

class LguFeaturesExtractor(BaseFeaturesExtractor):
    """
    Custom Feature Extractor that handles both the 4-channel spatial 
    weather tensors and the temporal vector inputs.
    """
    def __init__(self, observation_space: spaces.Dict, features_dim: int = 256):
        super(LguFeaturesExtractor, self).__init__(observation_space, features_dim)

        # 1. Spatial CNN Branch
        # expected: (4, 32, 32)
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

        #one forward pass with dummy tensor
        with torch.no_grad():
            dummy_tensor = torch.zeros((1, *spatial_shape))
            n_flatten = self.cnn(dummy_tensor).shape[1]

        # 2. Vector Branch
        vector_shape = observation_space.spaces["vector"].shape[0]
        self.vector_net = nn.Sequential(
            nn.Linear(vector_shape, 16),
            nn.ReLU()
        )

        # 3. Fusion 
        self.fusion_net = nn.Sequential(
            nn.Linear(n_flatten + 16, features_dim),
            nn.ReLU()
        )

    def forward(self, observations: torch.Tensor) -> torch.Tensor:
        # observations is a Dict isnce we use MultiInputPolicy
        spatial_features = self.cnn(observations["spatial"])
        vector_features = self.vector_net(observations["vector"])

        #Concat along the feature dimension
        combined = torch.cat((spatial_features, vector_features), dim=1)
        
        return self.fusion_net(combined)