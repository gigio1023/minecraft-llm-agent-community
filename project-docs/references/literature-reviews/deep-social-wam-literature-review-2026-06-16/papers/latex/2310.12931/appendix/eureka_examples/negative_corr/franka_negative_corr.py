@torch.jit.script
def compute_reward(franka_grasp_pos: torch.Tensor, drawer_grasp_pos: torch.Tensor, cabinet_dof_pos: torch.Tensor, 
                   franka_lfinger_pos: torch.Tensor, franka_rfinger_pos: torch.Tensor) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
    
    # Calculate the distance between the Franka grasping position and the cabinet grasping position
    grasp_distance = torch.norm(franka_grasp_pos - drawer_grasp_pos, dim=-1)

    # Calculate the distances between franke_lfinger_pos, franka_rfinger_pos and drawer_grasp_pos
    lfinger_distance = torch.norm(franka_lfinger_pos - drawer_grasp_pos, dim=-1)
    rfinger_distance = torch.norm(franka_rfinger_pos - drawer_grasp_pos, dim=-1)

    # Calculate the drawer opening distance
    drawer_opening = cabinet_dof_pos[:, 3]

    # Define temperature parameters for transforming the reward components
    grasp_distance_scaling = torch.tensor(20.0)
    handle_grasping_temperature = torch.tensor(20.0)
    drawer_opening_temperature = torch.tensor(20.0)

    # Transform the reward components
    grasp_distance_reward = 1.0 / (1.0 + grasp_distance_scaling * grasp_distance)
    handle_grasping_reward = torch.exp(-handle_grasping_temperature * (lfinger_distance + rfinger_distance))
    drawer_opening_reward = torch.exp(drawer_opening_temperature * drawer_opening)

    # Compute the total reward
    reward = grasp_distance_reward + handle_grasping_reward + drawer_opening_reward

    # Create a dictionary of individual reward components
    reward_components = {
        "grasp_distance_reward": grasp_distance_reward,
        "handle_grasping_reward": handle_grasping_reward,
        "drawer_opening_reward": drawer_opening_reward
    }

    return reward, reward_components