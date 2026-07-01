@torch.jit.script
def compute_reward(object_rot: torch.Tensor, goal_rot: torch.Tensor, fingertip_pos: torch.Tensor, object_pos: torch.Tensor) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
    # Compute the quaternion distance between the object's current orientation and the goal orientation
    q_dist = torch.sum((object_rot * goal_rot), dim=-1)
    q_dist = torch.min(q_dist, 1 - q_dist)  # Make sure the q_dist is in the range [0, 1]

    # Normalize the quaternion distance using a temperature parameter
    temp_rot = 0.5
    rot_reward = torch.exp(-temp_rot * q_dist)

    # Compute the distance between the fingertips and the object center
    fingertips_object_dist = torch.norm(fingertip_pos - object_pos[:, None], dim=-1)

    # Apply a threshold for the distance
    distance_threshold = 0.1
    close_enough = (fingertips_object_dist < distance_threshold).to(torch.float32)

    # Normalize the distance between fingertips and object center using an updated temperature parameter
    temp_dist = 10.0
    distance_reward = torch.mean(torch.exp(-temp_dist * fingertips_object_dist * close_enough), dim=-1)

    # Apply a penalty if the agent is not close enough to the object
    distance_penalty = 0.5 * (1 - torch.prod(close_enough, dim=-1))

    # Combine the reward components
    total_reward = rot_reward * distance_reward - distance_penalty

    # Store the reward components in a dictionary
    reward_components = {
        "rot_reward": rot_reward,
        "distance_reward": distance_reward,
        "distance_penalty": distance_penalty,
        "total_reward": total_reward,
    }

    return total_reward, reward_components