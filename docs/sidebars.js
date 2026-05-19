// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    'Agent-Search-Index',
    {
      type: 'category',
      label: 'Architecture & Design',
      items: [
        'Architecture/SPEC',
        'Architecture/Minimal-Probe',
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
