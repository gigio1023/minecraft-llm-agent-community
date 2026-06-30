def voyager(
    environment,  # environment that uses code as action space
    curriculum_agent,  # curriculum agent for proposing the next task
    action_agent,  # action agent for code generation
    critic_agent,  # critic agent for self-verification
    skill_manager,  # skill manager for adding new skills and skill retrieval
):
    agent_state = environment.reset()
    while True:
        exploration_progress = (
            curriculum_agent.get_exploration_progress(
                curriculum_agent.get_completed_tasks(),
                curriculum_agent.get_failed_tasks(),
            )
        )
        task = curriculum_agent.propose_next_task(
            agent_state, exploration_progress
        )
        code = None
        environment_feedback = None
        execution_errors = None
        critique = None
        success = False
        # try at most 4 rounds before moving on to the next task
        for i in range(4):
            skills = skill_manager.retrieve_skills(
                task, environment_feedback
            )
            code = action_agent.generate_code(
                task,
                code,
                environment_feedback,
                execution_errors,
                critique,
                skills,
            )
            (
                agent_state,
                environment_feedback,
                execution_errors,
            ) = environment.step(code)
            success, critique = critic_agent.check_task_success(
                task, agent_state
            )
            if success:
                break
        if success:
            skill_manager.add_skill(code)
            curriculum_agent.add_completed_task(task)
        else:
            curriculum_agent.add_failed_task(task)
