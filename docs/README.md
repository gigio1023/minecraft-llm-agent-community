# Docusaurus Website

This directory contains the Docusaurus documentation site for
`minecraft-llm-agent-community`.

Docusaurus-exposed docs live under:

```text
docs/blog-doc/
```

The route on the generated site can still be `/docs/...`; the repository path is
the important ownership boundary. Do not add new public docs under `docs/docs/`.

Repo-internal docs live at the project root. Historical research, stale public
plans, and raw paper dumps live under `docs/research-archive/`.

Keep the web docs in sync with `SPEC.md`, `README.md`,
`CURRENT_IMPLEMENTATION_ARCHITECTURE_REVIEW.md`,
`docs/blog-doc/Documentation-Map.md`, and
`docs/blog-doc/Agent-Search-Index.md`.

Long-term spec changes still require explicit approval. Future implementation
ideas discovered from live runs belong in
`docs/blog-doc/Architecture/Future-Works.md` unless they are promoted through spec
governance.

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
