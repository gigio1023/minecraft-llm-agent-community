// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    'Documentation-Map',
    'Agent-Search-Index',
    {
      type: 'category',
      label: 'Specification',
      items: [
        'Specification/Soul-Grounded-Social-Simulation',
        'Specification/Runtime-Evidence-And-Action-Skills',
        'Specification/Engineering-Governance-And-Testing',
        'Specification/Reference-Adaptation-Guide',
      ],
    },
    {
      type: 'category',
      label: 'Architecture & Design',
      items: [
        'Architecture/SPEC',
        'Architecture/Minimal-Probe',
        'Architecture/Runtime-Loop-And-Verification',
        'Architecture/Transcript-And-Runtime-Artifacts',
        'Architecture/Actor-Workspace-And-Action-Skill-Memory',
        'Architecture/Async-Reviewer-Sidecars',
        'Architecture/Implementation-Workstreams',
        'Architecture/Bounded-Action-Skill-Creation',
        'Architecture/Soul-Life-Goal-Runtime-Architecture',
        'Architecture/composer-2.5-Soul-Life-Goal-Runtime-Implementation-Plan',
        'Architecture/LLM-Context-And-Actor-Workspace',
        'Architecture/Social-Actor-Profiles-And-Relationships',
        'Architecture/Social-Simulation-Next-Goal-Handoff',
      ],
    },
    {
      type: 'category',
      label: 'Evaluation & Propagation Tracks',
      items: [
        'Architecture/Autonomous-Objective-Evaluation',
        'Architecture/Direct-Generated-Action-Skills',
        'Architecture/Single-Actor-Long-Term-Diamond-Handoff',
        'Architecture/composer-2.5-Single-Actor-Long-Term-Diamond-Plan',
      ],
    },
    {
      type: 'category',
      label: 'Setup & Installation',
      items: [
        'Setup/Headless-Server',
        'Setup/Provider-Setup',
      ],
    },
    {
      type: 'category',
      label: 'Knowledge',
      items: [
        'Knowledge/Minecraft-Encyclopedia-Research-Brief',
      ],
    },
    {
      type: 'category',
      label: 'Simulation Plans',
      items: [
        'Plans/2026-05-19-live-npc-dialogue',
        'Plans/2026-05-19-mutual-npc-interaction-probe',
      ],
    },
    {
      type: 'category',
      label: 'Research & Audits',
      items: [
        'Research/2026-05-19-local-minecraft-agent-repo-analysis',
        {
          type: 'category',
          label: 'Prior Repository Audits',
          items: [
            'Research/2026-05-19-voyager-local-implementation-insights',
            'Research/2026-05-19-voyager-persona-society-gameplay-research',
            'Research/2026-05-19-mindcraft-ce-local-insights',
            'Research/2026-05-19-mindcraft-ce-persona-society-gameplay-research',
            'Research/2026-05-19-mineflayer-chatgpt-local-insights',
            'Research/2026-05-19-mineflayer-chatgpt-persona-society-gameplay-research',
            'Research/2026-05-19-mc-multimodal-agent-local-insights',
            'Research/2026-05-19-mc-multimodal-persona-society-gameplay-research',
            'Research/2026-05-19-yearn-for-mines-local-insights',
          ],
        },
        {
          type: 'category',
          label: 'Core Agent Subsystems',
          items: [
            'Research/2026-05-19-minecraft-llm-agent-observation-loop-research',
            'Research/2026-05-19-codex-message-memory-research',
            'Research/2026-05-19-opencode-message-memory-research',
            'Research/2026-05-19-headless-probe-implementation-review',
            'Research/2026-05-19-minecraft-gameplay-and-voyager-seed-skills',
          ],
        },
        {
          type: 'category',
          label: 'Failures & Post-Mortems',
          items: [
            'Research/2026-05-19-skill-village-failure-report',
            'Research/2026-05-19-mutual-npc-interaction-probe-review',
            'Research/2026-05-20-npc-spawn-teleportation-troubleshooting',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
