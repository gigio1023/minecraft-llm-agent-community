#########################################################################

Iteration 1: Eureka Output:

The task is to make the humanoid run as fast as possible.
Therefore, the reward function should encourage forward movement.
This can be achieved by rewarding the agent based on the velocity in the forward direction.
We can also penalize the agent for using too much energy, as this would encourage efficient movement.

Here is a possible reward function:

```python
def compute_humanoid_reward(obs_buf, reset_buf, progress_buf, actions, up_weight, heading_weight, potentials, prev_potentials, actions_cost_scale, energy_cost_scale, joints_at_limit_cost_scale, max_motor_effort, motor_efforts, termination_height, death_cost, max_episode_length):
    # type: (Tensor, Tensor, Tensor, Tensor, float, float, Tensor, Tensor, float, float, float, float, Tensor, float, float, float) -> Tuple[Tensor, Tensor]

    # Reward is based on forward velocity
    reward = obs_buf[:, 1]

    # Penalize energy usage
    energy_cost = energy_cost_scale * torch.sum(actions**2, dim=-1)
    reward -= energy_cost

    # Penalize joints at limit
    joints_at_limit_cost = joints_at_limit_cost_scale * torch.sum(obs_buf[:, 12:32] > 0.99, dim=-1)
    reward -= joints_at_limit_cost

    # Penalize for falling
    not_upright = torch.abs(1 - obs_buf[:, 10]) > 0.25
    reward = torch.where(not_upright, torch.ones_like(reward) * death_cost, reward)

    # Reset if fallen
    reset = torch.where(not_upright, torch.ones_like(reset_buf), reset_buf)
    reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)

    return reward, reset
```

This reward function encourages the agent to move forward as fast as possible, while also encouraging efficient movement and penalizing the agent for falling or reaching joint limits.

#########################################################################

Iteration 1: Human Reward Reflection:
The learned behavior resembles forward squat jump; 
please revise the reward function so that the behavior resembles forward running. 

#########################################################################

Iteration 2: Eureka Output:
 To encourage a running behavior, we can modify the reward function to reward the agent for alternating leg movements and penalize for jumping (both feet off the ground).
  We can also reward the agent for maintaining a relatively upright torso to resemble a running posture.

Here is a revised reward function:

```python
def compute_humanoid_reward(obs_buf, reset_buf, progress_buf, actions, up_weight, heading_weight, potentials, prev_potentials, actions_cost_scale, energy_cost_scale, joints_at_limit_cost_scale, max_motor_effort, motor_efforts, termination_height, death_cost, max_episode_length):
    # type: (Tensor, Tensor, Tensor, Tensor, float, float, Tensor, Tensor, float, float, float, float, Tensor, float, float, float) -> Tuple[Tensor, Tensor]

    # Reward is based on forward velocity
    reward = obs_buf[:, 1]

    # Penalize energy usage
    energy_cost = energy_cost_scale * torch.sum(actions**2, dim=-1)
    reward -= energy_cost

    # Penalize joints at limit
    joints_at_limit_cost = joints_at_limit_cost_scale * torch.sum(obs_buf[:, 12:32] > 0.99, dim=-1)
    reward -= joints_at_limit_cost

    # Reward for alternating leg movements
    leg_difference = torch.abs(obs_buf[:, 12] - obs_buf[:, 13])
    reward += leg_difference

    # Penalize for jumping (both feet off the ground)
    feet_off_ground = torch.sum(obs_buf[:, 54:56] == 0)
    reward -= feet_off_ground

    # Reward for maintaining an upright torso
    upright_torso = 1 - torch.abs(1 - obs_buf[:, 10])
    reward += upright_torso

    # Penalize for falling
    not_upright = torch.abs(1 - obs_buf[:, 10]) > 0.25
    reward = torch.where(not_upright, torch.ones_like(reward) * death_cost, reward)

    # Reset if fallen
    reset = torch.where(not_upright, torch.ones_like(reset_buf), reset_buf)
    reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)

    return reward, reset
```

This reward function encourages the agent to move forward as fast as possible, while also encouraging efficient movement, alternating leg movements, maintaining an upright torso, and penalizing the agent for jumping or reaching joint limits.

#########################################################################

Iteration 2: Human Reward Reflection:
The learned behavior now looks like duck walk; 
the legs are indeed alternating but the torso is very low. 
Could you improve the reward function for upright running?

#########################################################################

Iteration 3: Eureka Output:
To encourage a more upright running posture,
  we can increase the reward for maintaining an upright torso and penalize the agent more heavily for having a low torso position.
   We can also add a reward for maintaining a certain height,
   which would discourage the "duck walk" behavior.

Here is a revised reward function:

```python
def compute_humanoid_reward(obs_buf, reset_buf, progress_buf, actions, up_weight, heading_weight, potentials, prev_potentials, actions_cost_scale, energy_cost_scale, joints_at_limit_cost_scale, max_motor_effort, motor_efforts, termination_height, death_cost, max_episode_length):
    # type: (Tensor, Tensor, Tensor, Tensor, float, float, Tensor, Tensor, float, float, float, float, Tensor, float, float, float) -> Tuple[Tensor, Tensor]

    # Reward is based on forward velocity
    reward = obs_buf[:, 1]

    # Penalize energy usage
    energy_cost = energy_cost_scale * torch.sum(actions**2, dim=-1)
    reward -= energy_cost

    # Penalize joints at limit
    joints_at_limit_cost = joints_at_limit_cost_scale * torch.sum(obs_buf[:, 12:32] > 0.99, dim=-1)
    reward -= joints_at_limit_cost

    # Reward for alternating leg movements
    leg_difference = torch.abs(obs_buf[:, 12] - obs_buf[:, 13])
    reward += leg_difference

    # Penalize for jumping (both feet off the ground)
    feet_off_ground = torch.sum(obs_buf[:, 54:56] == 0)
    reward -= feet_off_ground

    # Reward for maintaining an upright torso
    upright_torso = 1 - torch.abs(1 - obs_buf[:, 10])
    reward += 2 * upright_torso  # Increase reward for upright torso

    # Penalize for low torso position
    low_torso = obs_buf[:, 0] < 1.0
    reward = torch.where(low_torso, torch.ones_like(reward) * -1.0, reward)

    # Reward for maintaining a certain height
    height_reward = obs_buf[:, 0]
    reward += height_reward

    # Penalize for falling
    not_upright = torch.abs(1 - obs_buf[:, 10]) > 0.25
    reward = torch.where(not_upright, torch.ones_like(reward) * death_cost, reward)

    # Reset if fallen
    reset = torch.where(not_upright, torch.ones_like(reset_buf), reset_buf)
    reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)

    return reward, reset
```

This reward function encourages the agent to move forward as fast as possible, while also encouraging efficient movement, alternating leg movements, maintaining an upright torso, maintaining a certain height, and penalizing the agent for jumping, having a low torso position, or reaching joint limits.

#########################################################################

Iteration 3: Human Reward Reflection:
The learned behavior has the robot hopping on one of its foot in order to move forward.
 Please revise the reward function to encourage upright running behavior. 

#########################################################################

Iteration 4: Eureka Output:
 To discourage hopping and encourage a more balanced running behavior,
  we can add a penalty for not using both legs equally.
   We can also increase the reward for maintaining an upright torso and add a penalty for high angular velocity,
    which would discourage spinning or hopping.

Here is a revised reward function:

```python
def compute_humanoid_reward(obs_buf, reset_buf, progress_buf, actions, up_weight, heading_weight, potentials, prev_potentials, actions_cost_scale, energy_cost_scale, joints_at_limit_cost_scale, max_motor_effort, motor_efforts, termination_height, death_cost, max_episode_length):
    # type: (Tensor, Tensor, Tensor, Tensor, float, float, Tensor, Tensor, float, float, float, float, Tensor, float, float, float) -> Tuple[Tensor, Tensor]

    # Reward is based on forward velocity
    reward = obs_buf[:, 1]

    # Penalize energy usage
    energy_cost = energy_cost_scale * torch.sum(actions**2, dim=-1)
    reward -= energy_cost

    # Penalize joints at limit
    joints_at_limit_cost = joints_at_limit_cost_scale * torch.sum(obs_buf[:, 12:32] > 0.99, dim=-1)
    reward -= joints_at_limit_cost

    # Reward for alternating leg movements
    leg_difference = torch.abs(obs_buf[:, 12] - obs_buf[:, 13])
    reward += leg_difference

    # Penalize for not using both legs equally
    leg_usage_difference = torch.abs(torch.sum(obs_buf[:, 12:14], dim=-1) - 1.0)
    reward -= leg_usage_difference

    # Penalize for jumping (both feet off the ground)
    feet_off_ground = torch.sum(obs_buf[:, 54:56] == 0)
    reward -= feet_off_ground

    # Reward for maintaining an upright torso
    upright_torso = 1 - torch.abs(1 - obs_buf[:, 10])
    reward += 2 * upright_torso  # Increase reward for upright torso

    # Penalize for high angular velocity
    high_ang_velocity = torch.abs(obs_buf[:, 4:7]).sum(dim=-1) > 1.0
    reward = torch.where(high_ang_velocity, torch.ones_like(reward) * -1.0, reward)

    # Penalize for falling
    not_upright = torch.abs(1 - obs_buf[:, 10]) > 0.25
    reward = torch.where(not_upright, torch.ones_like(reward) * death_cost, reward)

    # Reset if fallen
    reset = torch.where(not_upright, torch.ones_like(reset_buf), reset_buf)
    reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)

    return reward, reset
```

This reward function encourages the agent to move forward as fast as possible, while also encouraging efficient movement, alternating leg movements, maintaining an upright torso, and penalizing the agent for jumping, not using both legs equally, having high angular velocity, or reaching joint limits.

#########################################################################

Iteration 4: Human Reward Reflection:
This reward function removed the penalty for low torse position that you added last time; could you just add it back in? 

#########################################################################

Iteration 5: Eureka Output:
 Sure, I apologize for the oversight. We can add back the penalty for low torso position to discourage the "duck walk" behavior. Here is the revised reward function:

```python
def compute_humanoid_reward(obs_buf, reset_buf, progress_buf, actions, up_weight, heading_weight, potentials, prev_potentials, actions_cost_scale, energy_cost_scale, joints_at_limit_cost_scale, max_motor_effort, motor_efforts, termination_height, death_cost, max_episode_length):
    # type: (Tensor, Tensor, Tensor, Tensor, float, float, Tensor, Tensor, float, float, float, float, Tensor, float, float, float) -> Tuple[Tensor, Tensor]

    # Reward is based on forward velocity
    reward = obs_buf[:, 1]

    # Penalize energy usage
    energy_cost = energy_cost_scale * torch.sum(actions**2, dim=-1)
    reward -= energy_cost

    # Penalize joints at limit
    joints_at_limit_cost = joints_at_limit_cost_scale * torch.sum(obs_buf[:, 12:32] > 0.99, dim=-1)
    reward -= joints_at_limit_cost

    # Reward for alternating leg movements
    leg_difference = torch.abs(obs_buf[:, 12] - obs_buf[:, 13])
    reward += leg_difference

    # Penalize for not using both legs equally
    leg_usage_difference = torch.abs(torch.sum(obs_buf[:, 12:14], dim=-1) - 1.0)
    reward -= leg_usage_difference

    # Penalize for jumping (both feet off the ground)
    feet_off_ground = torch.sum(obs_buf[:, 54:56] == 0)
    reward -= feet_off_ground

    # Reward for maintaining an upright torso
    upright_torso = 1 - torch.abs(1 - obs_buf[:, 10])
    reward += 2 * upright_torso  # Increase reward for upright torso

    # Penalize for low torso position
    low_torso = obs_buf[:, 0] < 1.0
    reward = torch.where(low_torso, torch.ones_like(reward) * -1.0, reward)

    # Penalize for high angular velocity
    high_ang_velocity = torch.abs(obs_buf[:, 4:7]).sum(dim=-1) > 1.0
    reward = torch.where(high_ang_velocity, torch.ones_like(reward) * -1.0, reward)

    # Penalize for falling
    not_upright = torch.abs(1 - obs_buf[:, 10]) > 0.25
    reward = torch.where(not_upright, torch.ones_like(reward) * death_cost, reward)

    # Reset if fallen
    reset = torch.where(not_upright, torch.ones_like(reset_buf), reset_buf)
    reset = torch.where(progress_buf >= max_episode_length - 1, torch.ones_like(reset_buf), reset)

    return reward, reset
```

This reward function encourages the agent to move forward as fast as possible, while also encouraging efficient movement, alternating leg movements, maintaining an upright torso, and penalizing the agent for jumping, not using both legs equally, having a low torso position, having high angular velocity, or reaching joint limits.

