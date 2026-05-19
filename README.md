# ⛏️ minecraft-llm-agent-community

- [🤖 Documentation Blog](https://naem1023.github.io/minecraft-llm-agent-community/)
  - [Legacy Architecture](https://naem1023.github.io/minecraft-llm-agent-community/docs/Archived/Documents/Architecture-of-Project)
  - [Legacy Installation Guide](https://naem1023.github.io/minecraft-llm-agent-community/docs/Archived/Documents/Installation)
- [📚 Analysis of Prior Projects](https://naem1023.github.io/minecraft-llm-agent-community/docs/Analysis-of-Prior-Projects)
  - [Simple Analysis of Voyager](https://naem1023.github.io/minecraft-llm-agent-community/docs/Analysis-of-Prior-Projects/voyager)

## Current Migration Direction

This repo is now a migration staging area for a zero-based headless mineflayer
agent-loop probe. Read these first:

- [Agent Search Index](docs/docs/Agent-Search-Index.md)
- [Agent Loop Migration](docs/docs/Migration/agent-loop-migration.md)
- [Headless Mineflayer Setup](docs/docs/Migration/headless-mineflayer-setup.md)
- [OpenAI Codex Provider](docs/docs/Migration/openai-codex-provider.md)
- [Minimal Probe Goal](docs/docs/Migration/minimal-probe-goal.md)
- [Handoff For GPT 5.4 Copilot](docs/docs/Migration/handoff-gpt54-copilot.md)

The old Voyager baseline remains useful background, but it is not the active
architecture. The active path is a tiny headless probe: a local vanilla server,
two mineflayer bots, a bounded observe/move/say/wait/remember loop, and a
small transcript artifact for evidence.

Longer-term social simulation ideas remain background motivation, but the first
slice is intentionally smaller: prove the constrained NPC tool loop works
without a manual Minecraft client or the old Voyager-style eval runtime.


<p align="center">
  <img src="assets/cover-image.jpeg" width="512">
</p>

## Legacy background

Voyager-era notes and backlog remain useful background, but they are not the
current execution path. The main README now tracks only the headless probe
workflow; older Fabric/Python/manual-client setup material should be read as
historical context, not as the default way to run this repository.

## Architecture
It's a sample architecture of executing a bot. It's not a final architecture.
![](docs/docs/Documents/img/sample-architecture.png)

## Legacy installation guides

The published [Installation Document](https://naem1023.github.io/minecraft-llm-agent-community/docs/Archived/Documents/Installation)
still describes the older Voyager/Fabric/manual-server path. It is useful as
background only and does not describe the active headless probe setup below.

## Headless Mineflayer Probe

The active direction is a tiny headless probe, not the old Voyager eval loop.

Prerequisites: Bun and Docker with Compose available locally.

```sh
bun install --cwd probe
bun run --cwd probe typecheck
./scripts/run-agent-loop-probe.sh
```

The proof command starts a local vanilla Docker server, waits for Minecraft
ping readiness, connects `npc_a` and `npc_b` with offline auth, runs the
deterministic `observe` / `move` / `say` / `wait` / `remember` loop, and writes
a transcript JSON artifact under `data/evidence/`.

No manual Minecraft client, Fabric, Forge, or live OpenAI provider is required
for this first proof.

# Contribution
## Check lint
```sh
make lint
```

# Citation
```bibtex
@article{wang2023voyager,
  title   = {Voyager: An Open-Ended Embodied Agent with Large Language Models},
  author  = {Guanzhi Wang and Yuqi Xie and Yunfan Jiang and Ajay Mandlekar and Chaowei Xiao and Yuke Zhu and Linxi Fan and Anima Anandkumar},
  year    = {2023},
  journal = {arXiv preprint arXiv: Arxiv-2305.16291}
}
```
