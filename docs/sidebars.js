// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  blogDocSidebar: [
    'intro',
    'Documentation-Map',
    'Agent-Search-Index',
    'Terminology',
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
        'Architecture/Soul-Life-Goal-Runtime-Architecture',
        'Architecture/Runtime-Loop-And-Verification',
        'Architecture/Transcript-And-Runtime-Artifacts',
        'Architecture/Actor-Workspace-And-Action-Skill-Memory',
        'Architecture/Social-Actor-Profiles-And-Relationships',
        'Architecture/Action-Skill-Verification',
        'Architecture/Bounded-Action-Skill-Creation',
        'Architecture/Actor-Memory-Observation-And-Action-Space-Plan',
        'Architecture/Actor-Persistent-State-And-PlanBeads',
        'Architecture/PlanBeads-Implementation-Campaign',
        'Architecture/Async-Reviewer-Sidecars',
        'Architecture/Future-Works',
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
      label: 'Current State',
      items: [
        'Architecture/Current-Handoff-And-Next-Work',
        'Architecture/Current-Architecture-And-Implementation-Audit',
        'Architecture/Real-Server-Simulation-Test-Plan',
        'Knowledge/Minecraft-Encyclopedia-Research-Brief',
      ],
    },
  ],
};

export default sidebars;
