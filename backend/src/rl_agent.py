"""PPO Agent Training and Inference Module."""

import os
from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.callbacks import EvalCallback
from src.env import LguSuspensionEnv
from src.cnn_encoder import LguFeaturesExtractor


def train_agent(total_timesteps: int = 100_000, model_save_path: str = "models/ppo_yorme_agent"):
    """
    Train a PPO agent for LGU class suspension decisions.
    
    Configures and trains a PPO agent with custom CNN feature extractor on the
    LguSuspensionEnv environment. Includes evaluation callbacks and tensorboard logging.
    
    Args:
        total_timesteps: Total training timesteps (default: 100,000).
        model_save_path: Path to save trained model weights (without .zip extension).
        
    Side Effects:
        - Creates 'models/' directory if it doesn't exist
        - Saves model checkpoints to 'models/best_model/'
        - Writes tensorboard logs to 'logs/ppo_yorme_tensorboard/'
        - Writes evaluation results to 'logs/results/'
    """
    os.makedirs("models", exist_ok=True)
    
    env = LguSuspensionEnv()
    
    print("Validating environment mechanics...")
    check_env(env, warn=True)
    
    env = Monitor(env)

    policy_kwargs = dict(
        features_extractor_class=LguFeaturesExtractor,
        features_extractor_kwargs=dict(features_dim=256),
        net_arch=[128, 128]
    )

    print("Initializing PPO MultiInput Policy...")
    model = PPO(
        "MultiInputPolicy", 
        env, 
        policy_kwargs=policy_kwargs,
        learning_rate=0.0003,
        n_steps=2048,
        batch_size=64,
        gamma=0.99,
        verbose=1,
        tensorboard_log="./logs/ppo_yorme_tensorboard/"
    )

    eval_env = Monitor(LguSuspensionEnv())
    eval_callback = EvalCallback(
        eval_env, 
        best_model_save_path='./models/best_model/',
        log_path='./logs/results/', 
        eval_freq=5000,
        deterministic=True, 
        render=False
    )

    print(f"Beginning training for {total_timesteps} timesteps...")
    model.learn(total_timesteps=total_timesteps, callback=eval_callback)

    model.save(model_save_path)
    print(f"Training complete. Weights saved to {model_save_path}.zip")


def run_inference(model_path: str):
    """
    Run inference demonstration with a trained PPO model.
    
    Loads a trained model and runs a single episode, printing decisions
    at each timestep. Useful for testing and debugging model behavior.
    
    Args:
        model_path: Path to trained model file (without .zip extension).
        
    Prints:
        Timestep-by-timestep decisions with time, flood state, action, and reward.
    """
    model = PPO.load(model_path)
    env = LguSuspensionEnv()
    obs, info = env.reset()
    
    print("\n--- INFERENCE TEST ---")
    done = False
    while not done:
        action, _states = model.predict(obs, deterministic=True)
        obs, reward, terminated, truncated, info = env.step(action)
        
        print(f"Time: {info['time']} | Ground Truth Flood: {info['ground_truth_flood']} | AI Action: Level {action} | Reward: {reward}")
        
        done = terminated or truncated


if __name__ == "__main__":
    train_agent(total_timesteps=50_000)
    run_inference("models/ppo_yorme_agent")