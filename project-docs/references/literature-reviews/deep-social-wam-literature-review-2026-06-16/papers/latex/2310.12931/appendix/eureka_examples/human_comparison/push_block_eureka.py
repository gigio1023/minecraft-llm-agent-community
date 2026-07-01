@torch.jit.script
def compute_reward(object_pos: Tensor,
                   left_hand_pos: Tensor,
                   right_hand_pos: Tensor,
                   left_goal_pos: Tensor,
                   right_goal_pos: Tensor) -> Tuple[Tensor, Dict[str, Tensor]]:

    # Temperature parameters for reward components
    temp_left_proximity: float = 0.5
    temp_right_proximity: float = 0.5
    temp_hand_distance: float = 0.1

    # Proximity reward for pushing the block to the left goal
    left_push_distance = torch.norm(object_pos - left_goal_pos, dim=1)
    left_proximity_reward = torch.exp(-temp_left_proximity * left_push_distance)

    # Proximity reward for pushing the block to the right goal
    right_push_distance = torch.norm(object_pos - right_goal_pos, dim=1)
    right_proximity_reward = torch.exp(-temp_right_proximity * right_push_distance)

    # Proximity rewards for the hands to be close to the block for better control
    left_hand_to_block = torch.norm(object_pos - left_hand_pos, dim=1)
    left_hand_reward = torch.exp(-temp_hand_distance * left_hand_to_block)

    right_hand_to_block = torch.norm(object_pos - right_hand_pos, dim=1)
    right_hand_reward = torch.exp(-temp_hand_distance * right_hand_to_block)

    # Final reward as a weighted sum of individual reward components
    reward = 0.25 * (left_proximity_reward + right_proximity_reward) + 0.25 * (left_hand_reward + right_hand_reward)

    reward_components = {
        "left_proximity_reward": left_proximity_reward,
        "right_proximity_reward": right_proximity_reward,
        "left_hand_reward": left_hand_reward,
        "right_hand_reward": right_hand_reward,
    }

    return reward, reward_components