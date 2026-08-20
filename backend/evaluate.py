import numpy as np
from stable_baselines3 import PPO
from src.env import LguSuspensionEnv

def evaluate_model(episodes=100):
    print("Loading WALANG PASOK AI for Evaluation...")
    model = PPO.load("models/ppo_yorme_agent.zip")
    env = LguSuspensionEnv()
    
    total_rewards, lead_times = [], []
    false_alarms, protected_students = 0, 0

    for ep in range(episodes):
        obs, _ = env.reset()
        done = False
        ep_reward = 0
        
        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, done, truncated, info = env.step(action)
            ep_reward += reward
            
            if done:
                total_rewards.append(ep_reward)
                if info.get("false_alarm"): false_alarms += 1
                if info.get("early_call"): lead_times.append(11.5 - env.current_hour)
                protected_students += max(0, 5000 - info.get("stranded_count", 0))

    print(f"\n--- AI POLICY REPORT CARD ({episodes} Storms) ---")
    print(f"Average Reward:       {np.mean(total_rewards):.2f}")
    print(f"False Alarm Rate:     {(false_alarms/episodes)*100:.1f}%")
    print(f"Avg Early Lead Time:  {np.mean(lead_times) if lead_times else 0:.1f} Hours")
    print(f"Total Protected:      {protected_students:,} Students")

if __name__ == "__main__":
    evaluate_model()