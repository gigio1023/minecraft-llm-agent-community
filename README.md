# ⛏️ minecraft-llm-agent-community

- [🤖 Documentation Blog](https://naem1023.github.io/minecraft-llm-agent-community/)
  - [Architecture](https://naem1023.github.io/minecraft-llm-agent-community/docs/Documents/Architecture-of-Project)
  - [Installation Guide](https://naem1023.github.io/minecraft-llm-agent-community/docs/Documents/Installation)
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
architecture. The next useful proof is a tiny local server plus two mineflayer
bots that observe, move, talk, wait, and write a transcript without requiring a
manual Minecraft client.

This project aims to observe how agents in the Minecraft world autonomously form groups and create villages. It is still in its early stages, and if valuable insights can be derived, it will be used as a research topic.

This project seeks to expand the research to include how multi-agents form groups, in addition to autonomously learning skills and exploring items, based on [Voyager](https://github.com/MineDojo/Voyager).


<p align="center">
  <img src="assets/cover-image.jpeg" width="512">
</p>

The purpose of this project can be changed, and welcome diverse opinions and feedback. Currently, I'm focusing on observing how issues of cooperation, coexistence, and survival are resolved. Additionally, most of my resources are currently invested in setting up the Minecraft environment, which has slowed the progress of core functionality development.

## TODO 
- [x] Basic Environment Setup using Voyager baseline
- [x] Make single agent using Voyager baseline
- [x] Analysis Voyager baseline and make a detail architecture image and pseudo code
- [x] Fix bugs, deprecated methods and modules for Voyager replication
- [ ] Setup an architecture for multi-agent based on Voyager
  - [x] Mineflayer bridge server can accept multiple bots
  - [x] Modify not to run and manage the Express server
  - [x] Establish complete js development environment, not only for the module as python
  - [ ] Make a simple multi agent
- [ ] Integrate ollama for running local llm
- [ ] Improve voyager baseline to make it more stable and robust
- [ ] Setup monitoring system for multi-agent

## Architecture
It's a sample architecture of executing a bot. It's not a final architecture.
![](docs/docs/Documents/img/sample-architecture.png)
## Installation Guides
Check the [Installation Document](https://naem1023.github.io/minecraft-llm-agent-community/docs/Documents/Installation)

# Run
```sh
python start_agent.py
```

## Check the bots are running
If you want to check the bots, install minecraft and conenct to the local minecraft server.
The default address is `localhost:25565`.

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
