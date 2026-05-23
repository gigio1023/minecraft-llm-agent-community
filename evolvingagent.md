Title: EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks

URL Source: https://arxiv.org/html/2502.05907

Markdown Content:
Tongtong Feng, Xin Wang, Zekai Zhou, Ren Wang, Yu-Wei Zhan, Guangyao Li, Qing Li, 

Wenwu Zhu Tongtong Feng, Xin Wang, Ren Wang, Yu-Wei Zhan, Guangyao Li, and Wenwu Zhu are with the Department of Computer Science and Technology, Beijing National Research Center for Information Science and Technology, Tsinghua University, Beijing 100084, China (E-mail: {fengtongtong, xin_wang, rwang2xx, zhanyw, guangyaoli, wwzhu}@tsinghua.edu.cn). Zekai Zhou is with the Department of Computer Science, University of Sydney, Sydney, Australia (E-mail: zhouodywork@gmail.com). Qing Li is with the Department of Electronic Engineering, Tsinghua University, Beijing 100084, China (E-mail: soleilor@tsinghua.edu.cn). Corresponding authors: Xin Wang and Wenwu Zhu.

###### Abstract

Completing Long-Horizon (LH) tasks in open-ended worlds is an important yet difficult problem for embodied agents. Existing approaches suffer from two key challenges: (1) they heavily rely on experiences obtained from human-created data or curricula, failing to autonomously update and select multimodal experiences, and (2) they may encounter catastrophic forgetting issues when faced with new tasks, failing to autonomously update world knowledge. To solve these challenges, this paper presents EvolvingAgent, a curriculum self-evolving agent with a continual World Model (WM), which can autonomously complete various LH tasks across environments through self-planning, self-control, and self-reflection, without human intervention. Specifically, EvolvingAgent contains three modules, i.e., i) the experience-driven task planner, which uses an LLM along with multimodal experiences to convert LH tasks into executable sub-tasks; ii) the WM-guided action controller, which leverages WM to generate low-level actions and incorporates a self-verification mechanism to update multimodal experiences; iii) the Curriculum Learning (CL) -based reflector, which implements a two-stage CL algorithm to select multimodal experiences for task-adaptive WM updates. By building a planner-controller-reflector closed-loop dynamic, the continual WM for EvolvingAgent can autonomously update multimodal experiences and world knowledge. We conducted extensive experiments on Minecraft, compared with existing methods, EvolvingAgent can improve 111.74% average success rate, reduce more than 6x ineffective actions, and generalize to the Atari environment with human-level performance.

## I Introduction

Long-Horizon (LH) tasks [feng2025u2udata, shen2025detach] are complex, multi-step tasks that require sustained planning, sequential decision-making, and extended execution over a prolonged period to achieve a final goal. These tasks are challenging, often exhibiting reward sparsity [hafner2025mastering] and procedural diversity [kwa2025measuring]. Completing LH tasks in open-ended worlds is an important yet difficult problem for embodied agents, such as logistics robots, surgical robots, and rescue robots.

![Image 1: Refer to caption](https://arxiv.org/html/2502.05907v3/x1.png)

Figure 1: The illustration of EvolvingAgent. EvolvingAgent can autonomously complete various long-horizon tasks across environments through self-planning, self-control, and self-reflection, without human intervention. The continual World Model (WM) for EvolvingAgent builds planner-controller-reflector closed-loop dynamic, which can autonomously update multimodal experiences and world knowledge.

On the one hand, existing agents have made remarkable progress by utilizing expert data and domain-specific curricula created by humans, developing policies through Reinforcement Learning (RL) [ren2025surfer], Imitation Learning (IL) [seo2025legato], and Large Language Models (LLMs) [Li_2025_CVPR]. On the other hand, recent studies [kwa2025measuring] demonstrate that humans’ ability to accomplish LH tasks in an open world relies on autonomous multimodal experience accumulation and world knowledge updates. In essence, autonomous world knowledge update serves as a meta-cognitive driver that not only guides action selection under partial observability but also enables context-aware adaptation to environmental dynamics, thereby resolving the local optimality issue inherent in LH task completion.

Completing LH tasks in open-ended worlds requires agents to achieve autonomous multimodal experience accumulation and world knowledge updates, like a baby thrives.

Nevertheless, existing methods are hard to complete various LH tasks across environments from scratch: 1) Failing to autonomously update and select multimodal experiences. Most embodied agents assume that all training data are available from the beginning (such as IL-based or LLMs-based agents), which heavily rely on human-created data or curricula [Li_2025_CVPR]. However, this assumption is unrealistic, as agents may encounter novel tasks or environments after deployment [Zhang2024VLABenchAL]. 2) Failing to autonomously update world knowledge. On the one hand, existing methods use LLMs (such as Voyager [wang2023voyager], Jarvis-1 [Wang2023JARVIS1OM]) to represent world knowledge based on sampling historical experiences or use a graph (such as Optimus-1 [li2024optimus1hybridmultimodalmemory]) to sparsely represent world knowledge, which requires human intervention and is hard to autonomously update. On the other hand, existing methods face catastrophic forgetting, where they lose previously obtained knowledge [nayakLLaMARLongHorizonPlanning2025, hafner2025mastering] for learning new tasks, which are hard to autonomously update and transfer world knowledge for LH tasks across environments.

To solve these challenges, in this paper, we propose EvolvingAgent (as shown in Fig. [1](https://arxiv.org/html/2502.05907#S1.F1 "Figure 1 ‣ I Introduction ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks")), a curriculum self-evolving agent with a continual World Model (WM), which can autonomously complete various LH tasks across environments through self-planning, self-control, and self-reflection, without human intervention. EvolvingAgent contains three modules: i) The experience-driven task planner, which uses an LLM along with multimodal experiences, to incorporate self-state into the planning phase and convert LH tasks into executable sub-tasks; ii) The WM-guided action controller, which leverages WM to generate low-level actions and incorporates a self-verification mechanism to update multimodal experiences. iii) The Curriculum Learning (CL) -based reflector, which implements a two-stage CL algorithm to select experiences for task-adaptive WM updates. By using a model-based online RL setup and building a planner-controller-reflector closed-loop dynamic, the continual WM for EvolvingAgent can autonomously update multimodal experiences and world knowledge, filtering out invalid explorations and mitigating historical forgetting.

We evaluate EvolvingAgent’s performance in Minecraft [fan2022minedojo], a popular open-world environment. Extensive experiments demonstrate EvolvingAgent’s superiority: compared with existing methods, EvolvingAgent can achieve an average success rate improvement of 111.74% and reduce ineffective actions by more than 6x. We also evaluate the generalization of EvolvingAgent in the Atari environment [bellemare2013arcade]; EvolvingAgent outperforms existing methods and achieves human-level performance in some tasks. The contributions are summarized as follows:

*   •
We propose EvolvingAgent, a curriculum self-evolving agent, which can autonomously complete various LH tasks across environments through self-planning, self-control, and self-reflection, without human intervention.

*   •
We design a novel continual WM for EvolvingAgent, building planner-controller-reflector closed-loop dynamic to autonomously update multimodal experiences and world knowledge.

*   •
We conduct extensive experiments on Minecraft. EvolvingAgent can achieve an average success rate improvement of 111.74%, reduce ineffective actions by more than 6x, and generalize to the Atari environment with human-level performance.

## II Related Works

### II-A Embodied Long-horizon Tasks

Embodied Long-Horizon (LH) tasks [zhou2026gentle, shen2025detach, feng2025u2udata] refer to complex, multi-step tasks that require sustained planning, sequential decision-making, and extended execution over a prolonged period to achieve a final goal. Existing work on embodied agents completing LH tasks can be divided into two categories. One is Model-Based Reinforcement Learning (MBRL) [medany2025model]. Embodied agents leverage MBRL to tackle LH tasks by interacting with environments and learning predictive world dynamics [krinner2025accelerating]. The other is vision-language model-based (VLM) planning [Roger2025RobinAS, hu2025vision]. Embodied agents leverage VLMs to decompose LH tasks into hierarchical sub-goals [Liu2024ReLEPAN], dynamically refine plans via memory-augmented reasoning [lou2025explorevlm], and align semantic intent with executable actions through iterative simulation [yang2025guiding], such as EmbodiedGPT [EmbodiedGPT], which bridges high-level planning with low-level control. However, they assume perfect knowledge of environments, rely on oracle feedback, and assume perfect execution of low-level policies, which makes it hard to adapt various LH tasks across environments in open worlds [Zhang2024VLABenchAL].

### II-B World Models

World Models (WMs) empower embodied AI by building internal representations and making future predictions of the external world[feng2025embodied, ha2018world]. They serve as simulators of real environments that predict the future outcome of certain actions, and policies can be derived from them. Current research focuses on two paradigms: understanding the world through latent state representations [assran2025v, hassan2025gem] and predicting future dynamics for planning and control [zuo2025gaussianworld]. Recurrent State-Space Model (RSSM) [hafner2025mastering] is a classic world model structure. Representative example usages of them in MBRL include action searching[nayakLLaMARLongHorizonPlanning2025], policy optimization within such simulators, or a combination of both[hafner2025mastering]. However, WMs currently struggle to prevent catastrophic forgetting [Mattes2023HierosHI] due to their inability to maintain stable representations of previously learned environmental dynamics while adapting to new tasks, often exacerbated by shared parameter updates prior to knowledge [Sun2024LearningLD].

### II-C Curriculum Learning

Curriculum Learning (CL) not only is a easy-to-hard heuristic, but also is a policy of difficulty modeling, schedule adaptation, and task-dependent deployment. In multimedia settings, this shift is particularly visible. For visual grounding, CLIP-VG[Xiao2024CLIPVG] shows that a self-paced curriculum can stabilize adaptation by gradually exploiting pseudo-language supervision rather than trusting noisy alignments from the beginning. For video understanding, exploring clip order in a self-supervised curriculum provides a structured way to organize temporal learning signals, improving downstream video applications beyond random pretraining order[Xiao2021VideoClipOrder]. In human pose estimation, DMH-CL[Dai2024DMHCL] further suggests that curriculum design can be tied to model hardness, allowing the training process to move according to the learner’s state rather than a fixed schedule. A related idea appears in data-free knowledge distillation, where category-aware curricula are used to control the transfer path from easier categories to harder ones[Li2024CategoryAwareKD]. Recent work has started to systematize the field through multimodal weak supervision[Mai2022WSMCL], unified benchmarking[Zhou2024CurBench], and psychologically grounded difficulty estimation and pacing strategies[Meng2025PUDF]. These studies suggest that modern curriculum learning is becoming less a handcrafted ordering trick and more a trainable mechanism for matching data exposure to model maturity. However, CL is currently not applied to solving embodied long-horizon tasks, nor has it achieved autonomous experience updating.

![Image 2: Refer to caption](https://arxiv.org/html/2502.05907v3/x2.png)

Figure 2: The overview of EvolvingAgent, which includes an experience-driven task planner, a WM-guided action controller and a Curriculum Learning (CL) -based reflector. The continual WM for EvolvingAgent, building planner-controller-reflector closed-loop dynamic, can autonomously update multimodal experiences and world knowledge.

## III Preliminaries

### III-A Online Model-based Reinforcement Learning

Reinforcement Learning (RL) is typically formulated as a Markov Decision Process (MDP) defined by the tuple (\mathcal{S},\mathcal{A},P,R,\gamma), where \mathcal{S} is the state space, \mathcal{A} is the action space, P(s^{\prime}|s,a) is the transition dynamics, R(s,a) is the reward function, and \gamma\in[0,1) is the discount factor. The goal is to learn a policy \pi(a|s) that maximizes the expected cumulative reward:

J(\pi)=\mathbb{E}_{\pi,P}\left[\sum_{t=0}^{\infty}\gamma^{t}R(s_{t},a_{t})\right],(1)

In Model-based Reinforcement Learning (MBRL), the agent explicitly learns a model \mathcal{M}, which includes an approximate dynamics model \hat{P}_{\theta}(s^{\prime}|s,a) and a reward model \hat{R}_{\phi}(s,a), parameterized by \theta and \phi, respectively. These models are trained to minimize empirical prediction errors over observed transitions \mathcal{D}=\{(s_{i},a_{i},s^{\prime}_{i},r_{i})\}:

\mathcal{L}_{\text{model}}(\theta,\phi)=\mathbb{E}_{(s,a,s^{\prime},r)\sim\mathcal{D}}\left[\|s^{\prime}-\hat{P}_{\theta}(s,a)\|^{2}+\|r-\hat{R}_{\phi}(s,a)\|^{2}\right],(2)

Using the learned models, the agent performs planning to optimize its policy. For example, in value iteration, the state-value function V(s) is iteratively updated via the Bellman equation:

V(s)\leftarrow\max_{a}[\hat{R}_{\phi}(s,a)+\gamma\mathbb{E}_{s^{\prime}\sim\hat{P}_{\theta}(\cdot|s,a)}V(s^{\prime})].(3)

In online MBRL, an agent interacts with the environment iteratively for K rounds with the goal of learning a sequence to minimize \mathcal{L}_{\text{model}}(\theta,\phi).

### III-B Recurrent State-Space Model

Recurrent State-Space Model (RSSM) [hafner2025mastering, hafner2019planet] is a classic world model structure, which can predict latent states and rewards from high-dimensional observations. RSSM contains 6 modules. 1) Encoder, maps observation o_{t} to a stochastic latent state s_{t}=(h_{t},z_{t}), where h_{t} is a deterministic RNN state and z_{t} is a stochastic latent variable, q_{\phi}(z_{t}|h_{t},o_{t})=\mathcal{N}\big(z_{t};\mu_{\phi}(h_{t},o_{t}),\sigma_{\phi}(h_{t},o_{t})\big), where \mu_{\phi},\sigma_{\phi} are neural networks. 2) Sequence model: predicts the sequence of these representations given past actions a_{t-1}, h_{t}=f_{\theta}(h_{t-1},z_{t-1},a_{t-1}). 3) Dynamics predictor, predicts the prior latent state transition, p_{\theta}(\hat{z}_{t}|h_{t})=\mathcal{N}\big(\hat{z}_{t};\mu_{\theta}(h_{t}),\sigma_{\theta}(h_{t})\big). 4) Decoder: reconstructs observations from latent states, p_{\theta}(o_{t}|h_{t},z_{t})=\mathcal{N}\big(o_{t};\mu_{\theta}^{\text{obs}}(h_{t},z_{t}),\sigma_{\theta}^{\text{obs}}\big). 5) Reward predictor, predicts rewards, \hat{r}_{t}=r_{\theta}(h_{t},z_{t}). 6) Continual predictor, predicts episode continuation flags, \hat{c}_{t}=\text{sigmoid}\big(c_{\theta}(h_{t},z_{t})\big). Above all, RSSM can be defined as follows:

Encoder:\displaystyle z_{t}\sim q_{\phi}(z_{t}|h_{t},o_{t})(4)
Sequence model:\displaystyle h_{t}=f_{\theta}(h_{t-1},z_{t-1},a_{t-1})(5)
Dynamics predictor:\displaystyle\hat{z}_{t}\sim p_{\theta}(\hat{z}_{t}|h_{t})(6)
Decoder:\displaystyle\hat{o}_{t}\sim p_{\theta}(\hat{o}_{t}|h_{t},z_{t})(7)
Reward predictor:\displaystyle\hat{r}_{t}\sim r_{\theta}(\hat{r}_{t}|h_{t},z_{t})(8)
Continual predictor:\displaystyle\hat{c}_{t}\sim c_{\theta}(\hat{c}_{t}|h_{t},z_{t})(9)

## IV EvolvingAgent

Let \mathcal{E} denote a dynamic open-world environment with partial observability, \mathcal{T} represent the LH tasks, and \mathcal{S} represents the agent’s current state. We aim to design a curriculum self-evolving agent EvolvingAgent that can complete various LH tasks across environments, without human intervention. As shown in Fig. [2](https://arxiv.org/html/2502.05907#S2.F2 "Figure 2 ‣ II-C Curriculum Learning ‣ II Related Works ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), EvolvingAgent includes an experience-driven task planner \Psi_{\text{plan}}, a WM-guided action controller \Pi_{\text{act}}, a Curriculum Learning (CL) -based reflector \Phi_{\text{reflect}}; The continual world model includes a Multimodal Experience Pool (MEP) \mathcal{D}_{\text{MEP}}, and a world model \mathcal{M}_{w}. EvolvingAgent has an online MBRL setup and can be instantiated as:

\text{\it EvolvingAgent}:\langle\Psi_{\text{plan}},\Pi_{\text{act}},\Phi_{\text{reflect}},\mathcal{D}_{\text{MEP}},\mathcal{M}_{w}\rangle(10)

Continual world model. As shown in Algorithm [1](https://arxiv.org/html/2502.05907#alg1 "Algorithm 1 ‣ IV-C CL-based Reflector ‣ IV EvolvingAgent ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), by building a planner-controller-reflector closed-loop dynamic, the continual world model for EvolvingAgent can autonomously update multimodal experiences and world knowledge. The sketch is as follows:

\begin{matrix}\mathcal{E},\mathcal{T},\mathcal{S},\mathcal{D}_{\text{MEP}},\mathcal{M}_{w}\\
\overbrace{\underbrace{\text{\bf Planner}}_{\begin{subarray}{c}\Psi_{\text{plan}}\triangleright\mathcal{D}_{\text{MEP}}\\
\downarrow\{g_{i}\}\end{subarray}}\rightarrow\underbrace{\text{\bf Controller}}_{\begin{subarray}{c}\Pi_{\text{act}}\circ\mathcal{M}_{w}\\
\downarrow{\{a_{t}\},\mathcal{D}_{\text{MEP}}^{\prime}}\end{subarray}}\rightarrow\underbrace{\text{\bf Reflector}}_{\begin{subarray}{c}\Phi_{\text{reflect}}\triangleright\mathcal{D}_{\text{MEP}}\\
\downarrow\mathcal{M}_{w}^{{}^{\prime}}\end{subarray}}\rightarrow}\end{matrix}(11)

where \{g_{i}\} are subtasks generated by the planner \Psi_{\text{plan}}; \{a_{t}\} are actions generated by the controller \Pi_{\text{act}}; \mathcal{D}_{MEP}^{{}^{\prime}} and \mathcal{M}_{w}^{{}^{\prime}} are the updated states.

Evaluation. According to relevant research [hafner2025mastering, Guo2024CaStLCA], the agents’ performance metrics includes Success Rate (SR) and Exploration Efficiency (EE).

\text{SR}=\frac{\text{ENum}_{g_{i}}^{\text{suc}}}{\text{ENum}^{\text{all}}},\text{EE}=\frac{\text{Step}_{g_{i}}^{\text{suc}}}{\text{Step}_{g_{i}}^{\text{all}}}(12)

where \text{ENum}_{g_{i}}^{\text{suc}} indicates the number of episodes (a lifecycle) in which the subtask g_{i} succeeded; \text{ENum}_{g_{i}}^{\text{all}} indicates the total number of episodes; \text{Step}_{g_{i}}^{\text{suc}} indicates the success step length of subtask g_{i}, and \text{Step}_{g_{i}}^{\text{all}} indicates the total step length of subtask g_{i} exploration.

### IV-A Experience-driven Task Planner

The experience-driven task planner \Psi_{\text{plan}} is formalized as a function that maps the current state \mathcal{S}, LH task \mathcal{T}, and experience \mathcal{D}_{\text{MEP}} to a sequence of subtasks \mathcal{G}.

\Psi_{\text{plan}}:\mathcal{S}\times\mathcal{T}\times\mathcal{D}_{\text{MEP}}\rightarrow\mathcal{G}(13)

\mathcal{S}=\mathcal{O}_{\text{obs}}\times\mathcal{S}_{\text{self}}\times\mathcal{S}_{\text{assets}},s_{t}\in\mathcal{S}(14)

\mathcal{D}_{\text{MEP}}=\{h\},h=\langle(s_{t},a_{t},r_{t},s_{t+1}),\mathbb{P}_{(g_{i})}|g_{i}\rangle(15)

where \mathcal{G}=\{g_{i}\}_{i=1}^{n} is the subtask space, each subtask g_{i} satisfies \bigcup_{i=1}^{n}g_{i}\supseteq\mathcal{T}; \mathcal{O}_{\text{obs}} represents first-person observations, \mathcal{S}_{\text{self}} represents the agent’s self-state, such as health or hunger, and \mathcal{S}_{\text{assets}} represents agent’s asset library, such as tools; s_{t} represents the current state at step t; h represents the experience; r_{t} represents the reward obtained by performing action a_{t} at state s_{t}; \mathbb{P}(g_{i}) indicates the percentage of subtask g_{i} completion.

Subtask planning. As shown in Fig. [2](https://arxiv.org/html/2502.05907#S2.F2 "Figure 2 ‣ II-C Curriculum Learning ‣ II Related Works ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), we adopt the image tokenizer f_{v} to encode the raw images \mathcal{O}_{obs},\mathcal{S}_{\text{self}},\mathcal{S}_{\text{assets}} into token embeddings \mathcal{V}=\{v_{1},v_{2},...,v_{n}\}\in\mathbb{R}^{n\times d}, where n denotes the number of visual tokens and d is the dimensionality of each token. We adopt the textual tokenizer f_{t} to encode \mathcal{T} into token embeddings. We further utilize a lightweight projection module with a trainable projection matrix W. This module maps the visual tokens to the same space with text embeddings \hat{\mathcal{V}}=W\mathcal{V}, yielding \hat{\mathcal{V}}=\{\hat{v}_{1},\hat{v}_{2},...,\hat{v}_{n}\}\in\mathbb{R}^{n\times d}. The output of our planner is the subtask g_{i}.

Self-planning. EvolvingAgent updates the planner for efficient LH task planning without human intervention. The LLM-based planner undergoes lightweight fine-tuning using Low-Rank Adaptation (LoRA)[hu2022lora]. The process of self-planning is as follows: 1) During agent initialization, the fine-tuning process utilizes all accumulated experiences from the multimodal experience pool \mathcal{D}_{\text{MEP}} for task planning. When the multimodal experience pool is empty, the agent initializes task planning based on the capabilities of the original GPT-4o. 2) During the agent’s lifecycle, when the feedback of WM-guided action controller indicates the subtask g_{i} failure, experience trajectories relevant to the subtask g_{i} by label matching are extracted to construct input-output pairs \{(X_{\text{in}}^{(k)},Y_{\text{out}}^{(k)})\} for model fine-tuning, where the input X_{\text{in}}^{(k)} includes all the experience h related the subtask g_{i}, while the output Y_{\text{out}}^{(k)} represents whether the subtask in each experience was successful. We only use input-output pairs for model fine-tuning. This enables the planner to quickly study from the failure patterns while preserving its general planning capabilities, thereby improving robustness and reducing repeated errors in LH tasks. 3) When the agent dies (such as health value is 0), the agent is reinitialized.

### IV-B WM-Guided Action Controller

The WM-guided action controller \Pi_{\text{act}} is formalized as a function that maps the current state \mathcal{S}, subtask \mathcal{G}, and the world model \mathcal{M}_{w} to an action sequence a_{t:t+H}=\{a_{t},a_{t+1},\dots,a_{t+H}\} for horizon H.

\Pi_{\text{act}}:\mathcal{S}\times\mathcal{G}\times\mathcal{M}_{w}\rightarrow\mathcal{A}(16)

Action selection. The controller utilizes \mathcal{M}_{w} to predict future states and optimize actions:

a_{t:t+H}=\underset{a_{t:t+H}\in\mathcal{A}^{H}}{\arg\max}\mathbb{E}_{\mathcal{M}_{w}}\left[\sum_{\tau=t}^{t+H}\gamma^{\tau-t}R(s_{\tau},a_{\tau},g_{i})\right](17)

where R(s_{\tau},a_{\tau},g_{i}) is the goal-aligned reward function, and \gamma\in[0,1] is the discount factor. R(s_{\tau},a_{\tau},g_{i}) considers not only the deterministic latent state and stochastic latent variable based on the current observation states s_{\tau} and actions a_{\tau} but also a goal embedding derived from the current subtask g_{i}, which is an extension of the DreamerV3[hafner2025mastering] reward. At each time step t, we sample a population of N action sequences \{a_{t:t+H}^{(k)}\}_{k=1}^{N} from the action space \mathcal{A}^{H}. The world model \mathcal{M}_{w} is used to predict the future states and compute the expected cumulative reward \mathbb{E}_{\mathcal{M}_{w}}\left[\sum_{\tau=t}^{t+H}\gamma^{\tau-t}R(s_{\tau},a_{\tau},g_{i})\right] for each sequence. The sequence a_{t:t+H}^{*} with the highest rewards is selected, and the first action a_{t}^{*} of this sequence is executed in the environment.

Self-control. EvolvingAgent uses a self-verification mechanism to reduce inefficient exploration and achieve efficient task execution without human intervention. After executing a_{t}, EvolvingAgent interacts with the environment \mathcal{E} to collect environment feedback. Then EvolvingAgent uses a self-verification mechanism to determine whether the subtask g_{i} can be terminated. The self-verification mechanism is as follows:

\phi(s_{t},g_{i},t)=\begin{cases}\text{1}&\text{if }\cos(\text{Emb}_{s_{t}},\text{Emb}_{g_{i}})\geq\sigma\lor t\geq T_{\text{max}}\\
\text{0}&\text{otherwise}\end{cases}(18)

where \phi(s_{t},g_{i},t)=1 indicates that the subtask g_{i} can be terminated; \text{Emb}_{s_{t}} is the WM-encoded latent representation of the current state s_{t}, \text{Emb}_{g_{i}} is the task embedding derived from the subtask g_{i} description. Similar to MINEDOJO [fan2022minedojo], we trained a contrastive video-language model pre-trained on the multimodal experience pool. It computes the cosine similarity \cos(\cdot) between an open-vocabulary language goal embedding \text{Emb}_{g_{i}} and an 8-frame video snippet embedding \text{Emb}_{s_{t}}, which is used to measure goal attainment with threshold \sigma set empirically. T_{\text{max}} is the maximum allowed steps of each episode. When a subtask g_{i} is completed or the subtask g_{i} completion cycle exceeds the maximum step length T_{\text{max}}, the subtask g_{i} is terminated and the experience-driven task planner is performed again.

If the subtask g_{i} is terminated, whether it is successful or exceeds the step threshold, \left\{\langle s_{t},a_{t},r_{t},s_{t+1},\mathbb{P}_{(g_{i})}|g_{i}\rangle\right\}_{t} is added to the multimodal experience pool \mathcal{D}_{\text{MEP}}.

\mathcal{D}_{\text{MEP}^{{}^{\prime}}}\leftarrow\mathcal{D}_{\text{MEP}}\cup\left\{\langle s_{t},a_{t},r_{t},s_{t+1},\mathbb{P}_{(g_{i})}|g_{i}\rangle\right\}_{t}(19)

### IV-C CL-based Reflector

The CL-based reflector \Phi_{\text{reflect}} is formalized as a function that maps the current state \mathcal{S}, subtask \mathcal{G}, and the multimodal experience \mathcal{D}_{\text{MEP}} to update the world model from \mathcal{M}_{w} to \mathcal{M}^{\prime}_{w}.

\Phi_{\text{reflect}}:\mathcal{S}\times\mathcal{G}\times\mathcal{D}_{\text{MEP}}\times\mathcal{M}_{w}\rightarrow\mathcal{M}^{\prime}_{w}(20)

\Phi_{\text{reflect}} employs a two-stage CL algorithm to optimize experience selection, which can enable agents to efficiently update the world model without human intervention as the agent interacts dynamically with the environment.

Stage 1: curriculum subtask selection. For candidate subtasks g_{i}\in\mathcal{G}, we use four indicators for curriculum subtask selection: (1) the relevance of the subtask g_{i} to the current target task \mathcal{T}_{goal}; (2) the exploration efficiency of the subtask g_{i} (the ratio of successful step length \text{Step}_{g_{i}}^{\text{suc}} to total step length \text{Step}_{g_{i}}^{\text{all}}); (3) the importance of the subtask g_{i} (comparing its impact on the current world model \mathcal{M}_{w,g_{i}}^{\text{new}} and past world model \mathcal{M}_{w,g_{i}}^{\text{old}}); (4) the average completion ratio \overline{\mathbb{P}}_{(g_{i})} of the subtask g_{i}.

Therefore, the priority score \tau(g_{i}) of the subtask g_{i} can be defined as follows:

\displaystyle\tau(g_{i})=\displaystyle\underbrace{\lambda_{1}\cdot\cos(\text{Emb}_{g_{i}},\text{Emb}_{\mathcal{T}_{goal}})}_{\text{Relevance}}+\underbrace{\lambda_{2}\cdot\frac{\text{Step}_{g_{i}}^{\text{suc}}}{\text{Step}_{g_{i}}^{\text{all}}}}_{\text{Efficiency}}(21)
\displaystyle+\underbrace{\lambda_{3}\cdot\text{KL}\left(\mathcal{M}_{w,g_{i}}^{\text{old}}\|\mathcal{M}_{w,g_{i}}^{\text{new}}\right)}_{\text{Importance}}+\underbrace{\lambda_{4}\cdot\overline{\mathbb{P}}_{g_{i}}}_{\text{Completion Ratio}}

where \cos(\text{Emb}_{g_{i}},\text{Emb}_{\mathcal{T}_{goal}}) represents the cosine similarity of task embedding. \lambda_{1}+\lambda_{2}+\lambda_{3}+\lambda_{4}=1 are balancing coefficients. Finally, in round k, |\mathcal{D}_{k}^{\text{subtask}}| subtasks are selected.

\mathcal{D}_{k}^{\text{subtask}}=\{g_{i}|\tau(g_{i})\geq\rho_{k}\},\quad\rho_{k}=\rho_{0}\cdot e^{-c_{s}k}(22)

where c_{s} controls the curriculum subtask progression rate.

Stage 2: curriculum experience selection. For candidate experience h\in\mathcal{D}_{MEP} in selected subtasks \mathcal{D}_{k}^{\text{subtask}}, we use three indicators for curriculum experience selection: (1) the Temporal Difference Error (TD-Error) \delta_{\text{TD}}(h_{j}), prioritizes experience with high TD-Error, indicating prediction mismatch between current and target world models; (2) the Gradient Norm \|\nabla_{\mathcal{M}_{w}}\mathcal{L}_{\text{pred}}(h_{j})\|, favors experiences that maximally influence the world model’s parameter updates; (3) the Information Gain, measures how much the experience h_{j} changes the world model’s belief distribution, calculated via KL divergence between current \mathcal{M}_{w}^{\text{new}}(s_{j+1}|h_{j}) and previous \mathcal{M}_{w}^{\text{old}}(s_{j+1}|h_{j}) world model predictions.

\displaystyle\epsilon(h_{j})=\displaystyle\eta_{1}\cdot\underbrace{|\delta_{\text{TD}}(h_{j})|}_{\text{TD-Error}}+\eta_{2}\cdot\underbrace{\|\nabla_{\mathcal{M}_{w}}\mathcal{L}_{\text{pred}}(h_{j})\|_{2}}_{\text{Gradient Norm}}(23)
\displaystyle+\underbrace{\eta_{3}\cdot\text{KL}\left(\mathcal{M}_{w}^{\text{new}}(s_{j+1}|h_{j})\|\mathcal{M}_{w}^{\text{old}}(s_{j+1}|h_{j})\right)}_{\text{Information Gain}}

where \eta_{1}+\eta_{2}+\eta_{3}=1 are balancing coefficients. Finally, in round k, |\mathcal{D}_{k}^{\text{exp}}| experiences are selected.

\mathcal{D}_{k}^{\text{exp}}=\{h_{j}|\epsilon(h_{j})\geq\rho_{k}\},\quad\rho_{k}=\rho_{0}\cdot e^{-c_{h}k}(24)

where c_{h} controls curriculum experience progression rate.

Algorithm 1 Continual World Model

0: Environment

\mathcal{E}
, LH task

\mathcal{T}
, current state

\mathcal{S}
, MEP

\mathcal{D}_{\text{MEP}}
, world model

\mathcal{M}_{w}
, horizon

H
, max steps

T_{\text{max}}

0: Updated

\mathcal{D}_{\text{MEP}}^{{}^{\prime}}
,

\mathcal{M}_{w}^{{}^{\prime}}

1:for LH Task

\mathcal{T}=\mathcal{T}_{0}
to

\mathcal{T}_{n}
do

2:Experience-driven task planner via Eq. (13-15)

3:

\{g_{i}\}\leftarrow\Psi_{\text{plan}}(\mathcal{S},\mathcal{T},\mathcal{D}_{\text{MEP}})

4:for each subtask

{g_{i}}\in\{g_{i}\}
do

5:for episode

t=1
to

T_{\text{max}}
do

6:WM-guided action controller via Eq. (16-19)

7:

\{a_{t:t+H}\}\leftarrow\Pi_{\text{act}}(s_{t},g_{i},\mathcal{M}_{w})

8:if

\phi(s_{t},g_{i},t)
is Terminal then

9:

\mathcal{D}_{\text{MEP}}^{{}^{\prime}}\leftarrow\mathcal{D}_{\text{MEP}}\cup\{\langle s_{t},a_{t},r_{t},s_{t+1},\mathbb{P}_{(g_{i})}|g_{i}\rangle\}

10: BREAK

11:end if

12:end for

13:CL-based reflector via Eq. (20-26)

14:

\mathcal{D}_{k}^{\text{subtask}}\leftarrow\text{Curriculum\_Subtask\_Select}(\mathcal{G}_{t},\mathcal{T},\mathcal{D}_{\text{MEP}})

15:

\mathcal{D}_{k}^{\text{exp}}\leftarrow\text{Curriculum\_Experience\_Select}(\mathcal{D}_{k}^{\text{subtask}})

16:

\mathcal{M}_{w}^{{}^{\prime}}\leftarrow\Phi_{\text{reflect}}(\mathcal{D}_{k}^{\text{exp}},\mathcal{M}_{w})

17:end for

18:end for

Self-reflection. Update the world model \mathcal{M}_{w} using experiences \mathcal{D}_{k}^{\text{exp}} with importance-aware weight w_{j}:

\mathcal{M}_{w}^{{}^{\prime}}\leftarrow\mathcal{M}_{w}-\nabla\Big[\underbrace{\textstyle{\sum}_{h_{j}}w_{j}\mathcal{L}_{\text{pred}}(h_{j})}_{\text{Curriculum Loss}}+\underbrace{\mu\cdot\Omega(\theta,\theta^{\text{old}})}_{\text{Regularization}}\Big](25)

w_{j}=\frac{\epsilon(h_{j})}{\max_{k}\epsilon(h_{k})},\Omega=\sum_{i}\mathcal{F}_{i}(\theta_{i}-\theta_{i}^{\text{old}})^{2}(26)

where w_{j} to emphasize critical experiences, and \Omega to penalize shifts in parameters critical for past tasks. \mathcal{F}_{i} is the Fisher information matrix diagonal.

## V Experiments

In this section, we conduct experiments on Minecraft to verify the performance of EvolvingAgent. We also include detailed ablation studies to analyze the effectiveness of each component, sensitivity analysis to evaluate the contribution of each indicator, and generalization analysis to test the generalization ability.

### V-A Experimental Setting

Simulators. We use Minecraft [fan2022minedojo] to evaluate EvolvingAgent. Minecraft features a procedurally generated 3D world of different biomes, which consists of 1-meter-sized blocks that the player can break and place. There are about 30 different creatures that the player can interact with or fight. We employ MineRL 0.4.4 with Minecraft as our simulation environment. The agent operates at a fixed speed of 20 frames per second and only interacts with the environment via low-level control signals. Optimus-1[li2024optimus1hybridmultimodalmemory] constructs a benchmark of 67 tasks to evaluate the Agent’s ability for LH tasks. We use the same task group partitioning as the Optimus-1 to evaluate EvolvingAgent. We also evaluate the cross-environment generalization of our method on Atari100k. Atari100k [bellemare2013arcade] is a standard reinforcement learning benchmark based on the Arcade Learning Environment, covering a diverse set of Atari 2600 games under a limited interaction steps.

TABLE I: The results of all the methods on the Minecraft. The evaluation metrics are the average success rate (SR) and the average exploration efficiency (EE) (as shown in Eq. [12](https://arxiv.org/html/2502.05907#S4.E12 "In IV EvolvingAgent ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks")). Upper EE metrics mean that the agent is more efficient at completing the task with fewer invalid exploration steps, while 0.00 indicates that the agent is unable to complete the task. The Overall represents the average result on the three groups of Iron ![Image 3: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x6.png), Gold ![Image 4: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x7.png), and Diamond ![Image 5: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x8.png). The Improving represents the average performance improvement of EvoAgent compared to the algorithms Jarvis-1, dreamerV3, LS-Imagine, and Optimus-1. The best results are in bold.

Group Metric PPO GPT-4V Jarvis-1 DreamerV3 LS-Imagine Optimus-1\columncolor[HTML]ECF4FF EvoAgent\columncolor[HTML]ECF4FF Improving (%)
![Image 6: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x9.png) Wood SR\uparrow 28.16 35.24 89.73 91.07 95.87 96.39\columncolor[HTML]ECF4FF 97.47\columncolor[HTML]ECF4FF4.51 \uparrow
EE\uparrow 53.82 69.45 87.36 93.22 97.41 97.82\columncolor[HTML]ECF4FF 98.43\columncolor[HTML]ECF4FF4.77 \uparrow
![Image 7: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x10.png) Stone SR\uparrow 13.42 14.39 81.91 86.82 91.50 88.79\columncolor[HTML]ECF4FF 94.53\columncolor[HTML]ECF4FF8.34 \uparrow
EE\uparrow 27.56 30.64 84.72 88.39 92.36 89.25\columncolor[HTML]ECF4FF 96.48\columncolor[HTML]ECF4FF8.80 \uparrow
![Image 8: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x11.png) Iron SR\uparrow 0.00 0.00 42.38 33.79 35.82 45.48\columncolor[HTML]ECF4FF 51.82\columncolor[HTML]ECF4FF3.16 \uparrow
EE\uparrow 0.00 0.00 47.52 35.68 38.27 46.16\columncolor[HTML]ECF4FF 58.54\columncolor[HTML]ECF4FF39.67 \uparrow
![Image 9: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x12.png) Gold SR\uparrow 0.00 0.00 8.84 6.57 6.61 10.62\columncolor[HTML]ECF4FF 21.69\columncolor[HTML]ECF4FF 165.81 \uparrow
EE\uparrow 0.00 0.00 9.76 8.05 10.69 8.03\columncolor[HTML]ECF4FF 30.48\columncolor[HTML]ECF4FF233.75 \uparrow
![Image 10: [Uncaptioned image]](https://arxiv.org/html/2502.05907v3/x13.png) Diamond SR\uparrow 0.00 0.00 7.69 4.73 4.36 9.30\columncolor[HTML]ECF4FF 17.36\columncolor[HTML]ECF4FF166.26 \uparrow
EE\uparrow 0.00 0.00 0.07 3.69 4.19 7.31\columncolor[HTML]ECF4FF 26.83\columncolor[HTML]ECF4FF 603.28 \uparrow
\rowcolor[HTML]ECF4FF Overall SR\uparrow 0.00 0.00 19.64 15.03 15.60 21.80\columncolor[HTML]ECF4FF 30.29\columncolor[HTML]ECF4FF 111.74 \uparrow

TABLE II: The sensitivity analysis of the hyperparameter \sigma.

Hyperparameters. EvolvingAgent is designed based on the codebase of dreamerV3 [hafner2025mastering]. The planner of EvolvingAgent uses the VQ-GAN [esser2021taming] and GPT-4o for task planning. The controller of EvolvingAgent is based on the RSSM-based WM structure[hafner2025mastering] for action selection. For detailed hyperparameters, please refer to the Appendix EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks. Among them, about the self-verification threshold \sigma, we perform a sensitivity analysis by running our agent in Minecraft with 10^{7} environment steps for the task ”Iron”. as shown in Table [II](https://arxiv.org/html/2502.05907#S5.T2 "TABLE II ‣ V-A Experimental Setting ‣ V Experiments ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), experimental results show that the task success rate remains stable when \sigma\in[0.875,0.925], with sharp declines outside this range due to over/under-termination. When \sigma\textless 0.875, sub-tasks may not be completed but are misjudged, causing subsequent tasks to fail. When \sigma\textgreater 0.925, due to strict self-verification, sub-tasks may be completed but still require re-planning, reducing the task completion rate.

Training. EvolvingAgent runs on a single A100 GPU. Taking 10^{7} steps as an example, compared to dreamerV3 running for 7 days, EvolvingAgent only needs to run for 2.7 days.

LLM API Call. LLM API calls occur in two processes: subtask planning and planner fine-tuning. As the agent self-evolves, the number of subtask failures decreases, which greatly reduces the overhead of planner fine-tuning. Throughout the experiment, with an average of 750 planning calls over 10^{7} environment steps.

Baselines. We compare EvolvingAgent with existing outperforming agents, including model-free Agent (PPO [schulman2017proximalpolicyoptimizationalgorithms]), WM-based agents (dreamerV3 [hafner2025mastering], LS-Imagine [li2025open]) and LLM-based agents (GPT-4V, Jarvis-1 [Wang2023JARVIS1OM], Optimus-1 [li2024optimus1hybridmultimodalmemory]) on the challenging LH tasks cross-environments. We do not consider agents that are completely based on human data and curricula support (such as Voyager [wang2023voyager], DEPS [wang2023describe], and Steve-Eye [zheng2023steve]).

### V-B Quantitative Results and Analysis

As shown in Table [I](https://arxiv.org/html/2502.05907#S5.T1 "TABLE I ‣ V-A Experimental Setting ‣ V Experiments ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), EvolvingAgent achieves state-of-the-art success rates (SR) and exploration efficiency (EE) across all resource tiers. Compared with existing methods, EvolvingAgent can achieve an average success rate improvement of 111.74% and reduce ineffective actions by more than 6x.

For basic tasks (Wood/Stone), EvolvingAgent marginally outperforms Optimus-1 (97.47% vs. 96.39% SR on Wood) but exhibits significantly greater advantages in advanced tasks like Gold (21.69% vs. 10.62% SR) and Diamond (17.36% vs. 9.30% SR). This hierarchy-aligned improvement suggests EvolvingAgent’s planner-controller-reflector closed-loop dynamic effectively addresses LH dependencies, where traditional model-based methods (DreamerV3 and LS-Imagine) and LLM-driven agents (Jarvis-1) struggle to maintain coherent multi-stage strategies. Notably, the EE reveals EvolvingAgent’s exploration superiority: its 30.48% EE on Gold tasks is 3.8× higher than Optimus-1, indicating reduced invalid actions.

Model-free methods (PPO) and pure vision-language models (GPT-4V) fail completely (0% SR/EE) on tasks requiring tool hierarchies (Iron+), highlighting their inability to model latent state transitions. While Jarvis-1 and DreamerV3 achieve partial success on intermediate tasks (42.38% SR on Iron), their performance collapses on Gold/Diamond tiers due to compounding errors in action sequences. LS-Imagine, through a hybrid approach of short-term and long-term imagination, significantly outperforms DreamerV3 in SR and EE metrics on the basic Wood/Stone task. However, its performance growth is slow on complex tasks because accumulated errors can mislead the optimization direction. EvolvingAgent with 26.83% EE on Diamond tasks, 7.3× higher than Optimus-1, underscores how CL-based experience selection mitigates exploration bottlenecks in sparse-reward scenarios.

TABLE III: Ablation study results. We report the average success rate (SR) on each task group. P.-, P., C., R.1, R.2, R., and CWM represent Planner without LoRA, Planner with LoRA, Controllor, Reflector only with stage 1, Reflector only with stage 2, Reflector with both stages, and Continual World Model, respectively. The PPO algorithm is used by default for model decision-making. Numbers after the\pm signs represent standard deviations. The best results are in bold.

### V-C Ablation Studies

The ablation study reveals critical insights into the contributions of each components (Planner without LoRA, Planner with LoRA, Controller, Reflector only with stage 1, Reflector only with stage 2, Reflector with both stages) and Continual WM for LH tasks. We selected 10 random seeds for testing. Table [III](https://arxiv.org/html/2502.05907#S5.T3 "TABLE III ‣ V-B Quantitative Results and Analysis ‣ V Experiments ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks") shows the mean and variance of the average success rate (SR) for each ablation study. When only PPO is used without any modules (first row), the agent fails to progress beyond basic tasks (28.16% SR for Wood, 0% for Iron+). Introducing the Planner module nearly doubles performance on Wood (45.69%) and marginally improves Stone (18.37%), but still fails to unlock advanced tasks (Iron+ at 0%), suggesting that planner alone cannot resolve the exploration bottleneck in LH tasks. A pivotal leap occurs when Controller is added (P+C), with Wood and Stone success rates surging to 92.42% and 85.31%, respectively, and modest progress in Iron (31.59%). This underscores the necessity of structured exploration to navigate intermediate dependencies. However, the sharp decline in Gold (5.47%) and Diamond (3.52%) indicates persistent challenges in sparse reward scenarios. Integrating the Reflector module (P+C+R) achieves near-perfect Wood/Stone success (96.69%/93.82%) and significantly boosts Iron (42.61%), Gold (17.53%), and Diamond (10.09%), demonstrating its role in distilling exploration experiences to refine world models.

![Image 11: Refer to caption](https://arxiv.org/html/2502.05907v3/x14.png)

Figure 3:  Illustration of the role of CL-based reflector. Take the subtask ”Craft a stone axe” as an example.

This experiment compares the results of Planner with LoRA and Planner without LoRA, demonstrating that planner fine-tuning can significantly improve model convergence speed, reduce the number of invalid subtasks, and achieve autonomous task decomposition. We compare the effects of Reflector with stage 1 only, Reflector with stage 2 only, and Reflector with both stages. The experimental results show that combining curriculum subtask selection with curriculum experience selection can significantly improve the model’s average performance. EvolvingAgent is an improvement over DreamerV3. As shown in Fig. [3](https://arxiv.org/html/2502.05907#S5.F3 "Figure 3 ‣ V-C Ablation Studies ‣ V Experiments ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), EvolvingAgent is significantly better than DreamerV3 in path selection, which can complete subtasks in the fewest steps. This is because CL-based reflectors can efficiently update the world model through subtask selection and experience selection, reducing the impact of redundant experience on the world model update. EvolvingAgent with the CL-based reflector can greatly reduce invalid exploration and accelerate task completion.

TABLE IV: The sensitivity analysis about indicators in the curriculum subtask selection (Eq. 21): Relevance (R.), Efficiency (E.), Importance (I.), and Completion Rate (C.R.); indicators in the curriculum experience selection (Eq. 23): TD-Error (TD-R.), Gradient Norm (G.N.), and Information Gain (I.G.); indicators in the self-reflection (Eq. 25): Curriculum Loss (C.L.) and Regularization (R.). We report the average success rate on the task ”Iron” group.

### V-D Sensitivity Analysis

We further examine the effect of different indicators in curriculum subtask selection, curriculum experience selection, and self-reflection on the Iron task group. As shown in Table [IV](https://arxiv.org/html/2502.05907#S5.T4 "TABLE IV ‣ V-C Ablation Studies ‣ V Experiments ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), adding more indicators consistently improves the success rate in all three parts. For curriculum subtask selection, introducing relevance, efficiency, importance, and completion ratio gradually raises the success rate from 40.16% to 49.37%, showing that effective subtask prioritization requires not only task similarity but also execution feedback and world-model variation. For curriculum experience selection, combining TD-Error, gradient norm, and information gain improves the success rate from 42.47% to 50.43%, indicating that informative experiences should be selected from prediction discrepancy, update influence, and knowledge increment simultaneously. For self-reflection, adding regularization to curriculum loss further improves the success rate from 48.61% to 50.92%, suggesting that stable world-model updating is important for reliable long-horizon task completion.

### V-E Generalization Analysis

We further evaluate the cross-environment generalization of EvolvingAgent on Atari100k after training in Minecraft. As shown in Table [V](https://arxiv.org/html/2502.05907#S5.T5 "TABLE V ‣ V-E Generalization Analysis ‣ V Experiments ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks"), EvolvingAgent consistently outperforms DreamerV3 under the same 400K interaction steps on most Atari tasks, including Alien, Assault, Asterix, Battle Zone, Ms Pacman, and Road Runner. It also reaches or exceeds human-level performance on several games such as Boxing, Krull, and Kung Fu Master. These results indicate that the continual world model learned by EvolvingAgent captures transferable dynamics and control priors rather than environment-specific patterns only. This cross-domain advantage supports the robustness and scalability of EvolvingAgent under substantial environment shifts.

TABLE V: The generalization analysis in Atari100k.

## VI Conclusion

This paper presents EvolvingAgent, an embodied agent that improves long-horizon task execution through curriculum self-evolution. EvolvingAgent integrates an experience-driven task planner, a WM-guided action controller, and a CL-based reflector to continuously refine subtask scheduling, experience selection, and world model updating during interaction. This design enables more reliable planning and execution in open-ended environments. In the future, we hope that our method can be truly applied to real robot scenarios.

## References

All hyperparameters of EvolvingAgent are shown in the Table [VI](https://arxiv.org/html/2502.05907#A0.T6 "TABLE VI ‣ EvolvingAgent: Curriculum Self-evolving Agent with Continual World Model for Long-Horizon Tasks").

TABLE VI: EvoAgent hyperparameters.

