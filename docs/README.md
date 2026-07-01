# Docusaurus Website

This directory contains the Docusaurus documentation site for
`minecraft-llm-agent-community`.

Docusaurus-exposed public docs live under:

```text
docs/public-docs/
```

The route on the generated site can still be `/docs/...`; the repository path is
the important ownership boundary. Do not add internal specs, setup notes,
handoffs, provider-access notes, or implementation plans to the public docs
tree.

Repo-internal project docs live under `project-docs/`. Literature references and
raw source material live under `project-docs/references/`; superseded plans and
historical public docs live under `project-docs/archive/`.

Keep the web docs consistent with the public-facing direction in `README.md`,
while keeping internal authority and operation detail in `SPEC.md`,
`AGENTS.md`, `project-docs/orientation/documentation-map.md`, and
`project-docs/orientation/agent-search-index.md`.

Long-term spec changes still require explicit approval. Future implementation
ideas discovered from live runs belong in internal handoff or future-work docs
under `project-docs/` unless they are promoted through spec governance.

### Installation

```bash
npm install
```

### Local Development

```bash
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
