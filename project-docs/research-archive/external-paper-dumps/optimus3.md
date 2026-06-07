Title: Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts

URL Source: https://arxiv.org/html/2506.10357

Published Time: Fri, 13 Jun 2025 00:23:06 GMT

Markdown Content:
\pdfcolInitStack

tcb@breakable

Zaijing Li 1 2, Yuquan Xie 1, Rui Shao 1 1 1 footnotemark: 1, Gongwei Chen 1

Weili Guan 1, Dongmei Jiang 2, Liqiang Nie 1 1 1 footnotemark: 1

1 Harbin Institute of Technology, Shenzhen 2 Peng Cheng Laboratory 

{lzj14011,xieyuquan20016}@gmail.com, {shaorui,nieliqiang}@hit.edu.cn

[https://cybertronagent.github.io/Optimus-3.github.io/](https://cybertronagent.github.io/Optimus-3.github.io/)

###### Abstract

Recently, agents based on multimodal large language models (MLLMs) have achieved remarkable progress across various domains. However, building a generalist agent with capabilities such as perception, planning, action, grounding, and reflection in open-world environments like Minecraft remains challenges: insufficient domain-specific data, interference among heterogeneous tasks, and visual diversity in open-world settings. In this paper, we address these challenges through three key contributions. 1) We propose a knowledge-enhanced data generation pipeline to provide scalable and high-quality training data for agent development. 2) To mitigate interference among heterogeneous tasks, we introduce a Mixture-of-Experts (MoE) architecture with task-level routing. 3) We develop a Multimodal Reasoning-Augmented Reinforcement Learning approach to enhance the agent’s reasoning ability for visual diversity in Minecraft. Built upon these innovations, we present Optimus-3, a general-purpose agent for Minecraft. Extensive experimental results demonstrate that Optimus-3 surpasses both generalist multimodal large language models and existing state-of-the-art agents across a wide range of tasks in the Minecraft environment.

![Image 1: Refer to caption](https://arxiv.org/html/2506.10357v1/x1.png)

Figure 1: Demonstration of Optimus-3’s capabilities as a generalist agent in Minecraft. It can perform long-horizon task planning, captioning, embodied QA, grounding, low-level action generation, and reflection in an interactive manner. All of these capabilities are seamlessly integrated into a unified end-to-end architecture, enabling robust and coherent performance across diverse task scenarios.

1 Introduction
--------------

Building an agent with human-level capabilities in perception, planning, action, and reflection within an open-world represents a significant milestone toward generalist agents. Recently, empowered by the perception and reasoning capabilities of multimodal large language models (MLLMs), agents have made remarkable progress in a range of domains, including video understanding [[14](https://arxiv.org/html/2506.10357v1#bib.bib14), [49](https://arxiv.org/html/2506.10357v1#bib.bib49)], mobile navigation [[48](https://arxiv.org/html/2506.10357v1#bib.bib48), [54](https://arxiv.org/html/2506.10357v1#bib.bib54)], embodied manipulation [[19](https://arxiv.org/html/2506.10357v1#bib.bib19), [23](https://arxiv.org/html/2506.10357v1#bib.bib23)], and vision-language navigation [[55](https://arxiv.org/html/2506.10357v1#bib.bib55), [57](https://arxiv.org/html/2506.10357v1#bib.bib57)]. However, in environments such as Minecraft [[51](https://arxiv.org/html/2506.10357v1#bib.bib51), [40](https://arxiv.org/html/2506.10357v1#bib.bib40), [26](https://arxiv.org/html/2506.10357v1#bib.bib26)], existing agents typically possess only one or a subset of the core capabilities in Perception, Planning, Action, and Reflection. The development of an interactive generalist agent that seamlessly integrates all these faculties remains challenges.

Challenge I: Insufficient Training Data for Domain-Specific Tasks. Although previous works have introduced datasets for action [[3](https://arxiv.org/html/2506.10357v1#bib.bib3), [28](https://arxiv.org/html/2506.10357v1#bib.bib28), [26](https://arxiv.org/html/2506.10357v1#bib.bib26)] and visual question answering [[40](https://arxiv.org/html/2506.10357v1#bib.bib40), [24](https://arxiv.org/html/2506.10357v1#bib.bib24)], there are still no publicly available datasets specifically targeting planning, reflection, and grounding. Challenge II: Interference Among Heterogeneous Tasks. In Minecraft, different tasks exhibit distinct input-output patterns. For example, Action requires the generation of low-level control signals, Captioning involves producing textual descriptions of visual content, and Grounding necessitates outputting spatial coordinates of target objects. As a result, heterogeneous task conflict poses a significant challenge faced by dense-architecture MLLMs during multi-task learning. Challenge III: Diversity of Observations and Environments in Open-World Settings. In open-world environment of Minecraft, agents are exposed to highly diverse environments and observations, ranging from forests, mountains, and caves to oceans and villages. This variability introduces significant challenges for the agent in performing vision-related tasks, such as captioning, embodied QA, and grounding.

In this paper, we propose Optimus-3, a generalist agent in open-world of Minecraft, which endowed with comprehensive capabilities in perception, planning, action, and reflection (depicted in Figure [1](https://arxiv.org/html/2506.10357v1#S0.F1 "Figure 1 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")). To address the aforementioned challenges, we propose targeted improvements across three key dimensions: data generation, model architecture, and training methodology.

Knowledge-Enhanced Pipeline for Automated Data Generation. To address the scarcity of domain-specific data in Minecraft, we propose an automated data generation pipeline. Compared to previous approaches limited to single-task data generation [[26](https://arxiv.org/html/2506.10357v1#bib.bib26), [40](https://arxiv.org/html/2506.10357v1#bib.bib40)], it offers a unified pipeline for generating diverse types of data. To further enhance the quality of the generated data, we integrate multiple models and tools richly endowed with Minecraft-specific domain knowledge, provide them with environment feedback as ground truth, thereby ensuring the automated generation of high-quality annotations. Experimental results show that post-training MLLMs on data generated by this pipeline lead to significant performance improvements.

Task-level Routing MoE Architecture for Scalable Multi-task Learning. To address the interference problem in heterogeneous multi-task learning, we propose a task-level routing MoE architecture. As shown in Figure [2](https://arxiv.org/html/2506.10357v1#S1.F2 "Figure 2 ‣ 1 Introduction ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), it consists of a shared knowledge expert and multiple scalable task experts. Unlike token-level routing [[8](https://arxiv.org/html/2506.10357v1#bib.bib8)], task-level routing assigns each query to a dedicated task-specific expert, along with a shared knowledge expert that captures generalizable knowledge across tasks. Each task is learned by updating only the parameters of its corresponding expert, thereby avoiding interference among heterogeneous tasks. Experimental results show that task-level routing outperforms token-level routing across various tasks in Minecraft. Further experiments demonstrate its ability to scale to new tasks without compromising the performance of previously learned tasks, highlighting its effectiveness and extensibility in heterogeneous multi-task settings.

Multimodal Reasoning-Augmented Reinforcement Learning for Model Training. To better adapt to the visual diversity of environments in Minecraft, we propose a Multimodal Reasoning-Augmented Reinforcement Learning method. This method explicitly instructs the agent to reason about the visual content, encouraging it to ground its responses in visual observations, thereby improving the interpretability of its outputs. To further enhance such reasoning capabilities, we employ an IoU-Density Reward function with GRPO [[16](https://arxiv.org/html/2506.10357v1#bib.bib16)] algorithm, allowing the model to iteratively refine its reasoning process via reinforcement learning (RL). Experimental results demonstrate that our method further improves the performance of fine-tuned agent, achieving gains of 42% on Embodied QA and 36% on Grounding tasks.

![Image 2: Refer to caption](https://arxiv.org/html/2506.10357v1/x2.png)

Figure 2: A: The architecture of Optimus-3, which includes a task router that selects a specific task expert for each query, a ViT [[11](https://arxiv.org/html/2506.10357v1#bib.bib11)] for visual encoding, and a MoE LLM for generating responses and low-level actions. Given a long-horizon task, it can generate a feasible plan and then execute the sub-goals sequentially. B: The proposed Multimodal Reasoning-Augmented Reinforcement Learning effectively enhances the agent’s performance. C: Performance comparison of Optimus-3 against current task-specific SOTA agents, GPT-4o [[1](https://arxiv.org/html/2506.10357v1#bib.bib1)], and the original backbone Qwen2.5-VL [[2](https://arxiv.org/html/2506.10357v1#bib.bib2)].

We conducted comprehensive evaluations in the open-world environment of Minecraft. Experimental results show that Optimus-3 outperforms both general multimodal large language models and previous SOTA agents in Minecraft across a wide range of tasks. Compared to previous SOTA, Optimus-3 achieves an improvements of 20% on Planning, 3% on Long-Horizon Action, 66% on Captioning, 76% on Embodied QA, 3.4x on Grounding, and 18% on Reflection, respectively.

In summary, our contributions are as follows:

*   •To the best of our knowledge, the proposed Optimus-3 is the first generalist agent in Minecraft, which equipped with comprehensive capabilities in perception, planning, action, grounding and reflection. Moreover, we design a unified automated data generation pipeline for these tasks, providing high-quality data for the training of Optimus-3. 
*   •To mitigate interference among heterogeneous tasks, we propose the MoE architecture with task-level routing. By designing a shared knowledge expert alongside dedicated task-specific experts, it not only avoids task interference but also enables task expansion. 
*   •To further enhance the reasoning capability of Optimus-3, we propose a Multimodal Reasoning-Augmented Reinforcement Learning approach. It requires the agent to perform multimodal reasoning prior to decision-making, thereby improving the interpretability of its response. Meanwhile, reinforcement learning encourages the agent to explore diverse decision paths, promoting better generalization in open-world environments. 

2 Related Work
--------------

![Image 3: Refer to caption](https://arxiv.org/html/2506.10357v1/x3.png)

Figure 3: Different agent framework in Minecraft. (a) Goal-conditioned policy which takes observation and instruction as input. (b) Function calling, which employs (M)LLM as the planner, then generates executable functions. (c) (M)LLM as the planner, which then employs a goal-conditioned policy to generate low-level actions. (d) MLLM generates latent tokens, which are used as control conditions for the policy. (e) End-to-end architecture (ours) which is capable of generating both low-level actions and textual responses.

Minecraft Agents. The existing Minecraft agent frameworks are illustrated in Figure [3](https://arxiv.org/html/2506.10357v1#S2.F3 "Figure 3 ‣ 2 Related Work ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"). Early work [[38](https://arxiv.org/html/2506.10357v1#bib.bib38), [9](https://arxiv.org/html/2506.10357v1#bib.bib9), [4](https://arxiv.org/html/2506.10357v1#bib.bib4), [18](https://arxiv.org/html/2506.10357v1#bib.bib18)] leveraged reinforcement learning to build goal-conditioned policies in Minecraft, refer to Figure [3](https://arxiv.org/html/2506.10357v1#S2.F3 "Figure 3 ‣ 2 Related Work ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")(a). VPT [[3](https://arxiv.org/html/2506.10357v1#bib.bib3)] and GROOT [[5](https://arxiv.org/html/2506.10357v1#bib.bib5)] develop vision-conditioned policies, while MineCLIP [[13](https://arxiv.org/html/2506.10357v1#bib.bib13)] and STEVE-1 [[28](https://arxiv.org/html/2506.10357v1#bib.bib28)] introduce textual instructions as action goals. Several works leverage (M)LLMs to generate executable code, enabling agent-environment interaction through function calling mechanisms [[47](https://arxiv.org/html/2506.10357v1#bib.bib47), [31](https://arxiv.org/html/2506.10357v1#bib.bib31), [59](https://arxiv.org/html/2506.10357v1#bib.bib59), [34](https://arxiv.org/html/2506.10357v1#bib.bib34), [56](https://arxiv.org/html/2506.10357v1#bib.bib56), [22](https://arxiv.org/html/2506.10357v1#bib.bib22)], refer to Figure [3](https://arxiv.org/html/2506.10357v1#S2.F3 "Figure 3 ‣ 2 Related Work ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")(b). To equip agents with the ability to long-horizon planning, some works have leveraged MLLMs as planner, and goal-conditioned policy for low-level control [[40](https://arxiv.org/html/2506.10357v1#bib.bib40), [50](https://arxiv.org/html/2506.10357v1#bib.bib50), [51](https://arxiv.org/html/2506.10357v1#bib.bib51), [26](https://arxiv.org/html/2506.10357v1#bib.bib26), [27](https://arxiv.org/html/2506.10357v1#bib.bib27)], refer to Figure [3](https://arxiv.org/html/2506.10357v1#S2.F3 "Figure 3 ‣ 2 Related Work ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")(c). Moreover, OmniJARVIS [[52](https://arxiv.org/html/2506.10357v1#bib.bib52)] introduces the use of MLLMs to generate latent tokens, which serve as control conditions for the policy, refer to Figure [3](https://arxiv.org/html/2506.10357v1#S2.F3 "Figure 3 ‣ 2 Related Work ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")(d). Despite significant advances, a significant gap remains between current agents and generalist Minecraft agents, due to limitations in their capabilities for perception, grounding, and reflection. As shown in Figure [3](https://arxiv.org/html/2506.10357v1#S2.F3 "Figure 3 ‣ 2 Related Work ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")(e), we aim to develop an end-to-end generalist Minecraft agent, which is equipped with comprehensive capabilities and supports interactive responses.

Mixture-of-Experts Architectures. In recent years, Mixture of Experts (MoE) architectures [[37](https://arxiv.org/html/2506.10357v1#bib.bib37), [46](https://arxiv.org/html/2506.10357v1#bib.bib46)] have garnered significant attention in the field of Large Language Models (LLMs), owing to their scalability and sparsity in activation [[20](https://arxiv.org/html/2506.10357v1#bib.bib20), [15](https://arxiv.org/html/2506.10357v1#bib.bib15), [12](https://arxiv.org/html/2506.10357v1#bib.bib12)]. On the theoretical front, some work [[7](https://arxiv.org/html/2506.10357v1#bib.bib7), [35](https://arxiv.org/html/2506.10357v1#bib.bib35)] demonstrated the effectiveness of MoE architectures in tasks with cluster structures. To further enhance expert specialization, DeepSeekMoE [[8](https://arxiv.org/html/2506.10357v1#bib.bib8)] proposed more differentiated expert training strategies, significantly boosting downstream task performance, albeit with increased training complexity. Recently, MoE architectures have been incorporated into MLLMs [[44](https://arxiv.org/html/2506.10357v1#bib.bib44), [25](https://arxiv.org/html/2506.10357v1#bib.bib25), [29](https://arxiv.org/html/2506.10357v1#bib.bib29), [53](https://arxiv.org/html/2506.10357v1#bib.bib53)], significantly enhancing their generalization capabilities and computational efficiency. Despite these advancements, existing MoE architectures still face notable challenges in load balancing and routing optimization. In this paper, we propose a task-routing driven MoE architecture, in which a task router directs each query to a designated task-specific expert along with a shared knowledge expert, thereby eliminating the need for token-level dynamic routing.

3 Optimus-3
-----------

In this section, we first introduce an automated dataset generation pipeline in Sec. [3.1](https://arxiv.org/html/2506.10357v1#S3.SS1 "3.1 Knowledge-Enhanced Data Generation Pipeline ‣ 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"). Then, we provide a detailed description of the Optimus-3 architecture (Sec. [3.2](https://arxiv.org/html/2506.10357v1#S3.SS2 "3.2 MoE Architecture with Task-level Routing ‣ 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")). As shown in Figure [2](https://arxiv.org/html/2506.10357v1#S1.F2 "Figure 2 ‣ 1 Introduction ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), it adopts a Mixture-of-Experts (MoE) architecture with task-level routing, which effectively enhances the model’s capability to learn heterogeneous multi-task. Finally, in Sec [3.3](https://arxiv.org/html/2506.10357v1#S3.SS3 "3.3 Multimodal Reasoning-Augmented Reinforcement Learning ‣ 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), we elaborate on how to implement the proposed Multimodal Reasoning-Augmented RL, which enhances Optimus-3’s reasoning capabilities and generalization on vision-related tasks.

![Image 4: Refer to caption](https://arxiv.org/html/2506.10357v1/x4.png)

Figure 4: Data Generation Pipeline. Given a task pool, we utilize a knowledge graph [[26](https://arxiv.org/html/2506.10357v1#bib.bib26)] to generate task plans, forming the planning dataset. These plans are then used as instructions for STEVE-1 [[28](https://arxiv.org/html/2506.10357v1#bib.bib28)], which interacts with the environment to produce the action dataset. During this process, we randomly sample images and employ expert models [[36](https://arxiv.org/html/2506.10357v1#bib.bib36), [33](https://arxiv.org/html/2506.10357v1#bib.bib33)] with environmental feedback to generate the captioning, embodied QA, and grounding datasets.

### 3.1 Knowledge-Enhanced Data Generation Pipeline

Currently, there are no publicly available datasets for planning, grounding, or reflection in Minecraft. Compared to manual annotation, leveraging MLLMs for automated data sampling offers a lower-cost alternative. However, we observe that general-purpose MLLMs are often insufficient for use as annotation models, due to their lack of domain-specific knowledge. For instance, GPT-4o [[1](https://arxiv.org/html/2506.10357v1#bib.bib1)] fails at grounding, some MLLMs [[10](https://arxiv.org/html/2506.10357v1#bib.bib10), [2](https://arxiv.org/html/2506.10357v1#bib.bib2)] tend to hallucinate in embodied question answering, and most models [[39](https://arxiv.org/html/2506.10357v1#bib.bib39), [45](https://arxiv.org/html/2506.10357v1#bib.bib45), [36](https://arxiv.org/html/2506.10357v1#bib.bib36), [10](https://arxiv.org/html/2506.10357v1#bib.bib10)] lack the ability to produce a feasible plan for long-horizon tasks. To address this, we propose a knowledge-enhanced automated data generation pipeline. It integrates multiple expert models and tools to ensure the quality and reliability of the generated data.

As shown in Figure [4](https://arxiv.org/html/2506.10357v1#S3.F4 "Figure 4 ‣ 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), we first collect a set of commonly used items from the Minecraft Wiki to construct a task pool. We then employ a knowledge graph (directed graph capturing crafting dependencies) [[26](https://arxiv.org/html/2506.10357v1#bib.bib26)] to generate plans for each task. These plans are subsequently executed by a goal-conditioned policy, STEVE-1 [[28](https://arxiv.org/html/2506.10357v1#bib.bib28)], resulting in a collection of observation-action pairs. During execution, we randomly sample visual frames for vision-related tasks. Then we employ expert models [[36](https://arxiv.org/html/2506.10357v1#bib.bib36), [32](https://arxiv.org/html/2506.10357v1#bib.bib32), [1](https://arxiv.org/html/2506.10357v1#bib.bib1)] to label these frames, and provide them with environmental feedback [[17](https://arxiv.org/html/2506.10357v1#bib.bib17)] (agent’s state, inventory, and surrounding objects) as ground truth. By incorporating expert models with environmental feedback, we significantly enhance the quality of the generated data. For example, by providing the caption model with information about the objects present in the scene, the incidence of hallucinations in the generated captions is significantly reduced. In this way, diverse types of data are sampled to support the training of Optimus-3. For more details, please refer to Appendix D.

### 3.2 MoE Architecture with Task-level Routing

Besides textual outputs, an agent in Minecraft must also generate non-textual outputs, such as low-level actions, bounding box coordinates. This heterogeneity in task formats introduces a significant risk of task interference during multi-task training. One effective solution is to introduce a Mixture-of-Experts (MoE) architecture [[37](https://arxiv.org/html/2506.10357v1#bib.bib37), [46](https://arxiv.org/html/2506.10357v1#bib.bib46)], in which each task is learned by updating only a subset of expert parameters [[8](https://arxiv.org/html/2506.10357v1#bib.bib8)]. However, token-level routing can still result in the same expert being optimized for multiple tasks, leading to task interference[[58](https://arxiv.org/html/2506.10357v1#bib.bib58), [44](https://arxiv.org/html/2506.10357v1#bib.bib44)].

To address this issue, we introduce an MoE architecture with task-level routing, where each task is learned by updating only its designated expert parameters, thereby effectively avoiding interference across tasks. As shown in Figure [2](https://arxiv.org/html/2506.10357v1#S1.F2 "Figure 2 ‣ 1 Introduction ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), given an instruction, the Task Router assigns it to a specific task type, allowing each query to have its expert determined before entering the model. Moreover, following the design of DeepSeekMoE [[8](https://arxiv.org/html/2506.10357v1#bib.bib8)], we introduce a shared knowledge expert that is always activated for every query, facilitating the transfer of common knowledge across different tasks. Formally, at the l 𝑙 l italic_l-th MoE layer, given a query’s hidden state u q l subscript superscript 𝑢 𝑙 𝑞 u^{l}_{q}italic_u start_POSTSUPERSCRIPT italic_l end_POSTSUPERSCRIPT start_POSTSUBSCRIPT italic_q end_POSTSUBSCRIPT, the output hidden state h q l subscript superscript ℎ 𝑙 𝑞 h^{l}_{q}italic_h start_POSTSUPERSCRIPT italic_l end_POSTSUPERSCRIPT start_POSTSUBSCRIPT italic_q end_POSTSUBSCRIPT can be expressed as:

h q l=W shared⁢(u q l)+W task⁢(q)⁢(u q l),subscript superscript ℎ 𝑙 𝑞 subscript 𝑊 shared subscript superscript 𝑢 𝑙 𝑞 subscript 𝑊 task 𝑞 subscript superscript 𝑢 𝑙 𝑞 h^{l}_{q}=W_{\text{shared}}(u^{l}_{q})+W_{\text{task}(q)}(u^{l}_{q}),italic_h start_POSTSUPERSCRIPT italic_l end_POSTSUPERSCRIPT start_POSTSUBSCRIPT italic_q end_POSTSUBSCRIPT = italic_W start_POSTSUBSCRIPT shared end_POSTSUBSCRIPT ( italic_u start_POSTSUPERSCRIPT italic_l end_POSTSUPERSCRIPT start_POSTSUBSCRIPT italic_q end_POSTSUBSCRIPT ) + italic_W start_POSTSUBSCRIPT task ( italic_q ) end_POSTSUBSCRIPT ( italic_u start_POSTSUPERSCRIPT italic_l end_POSTSUPERSCRIPT start_POSTSUBSCRIPT italic_q end_POSTSUBSCRIPT ) ,(1)

where W shared⁢(⋅)subscript 𝑊 shared⋅W_{\text{shared}}(\cdot)italic_W start_POSTSUBSCRIPT shared end_POSTSUBSCRIPT ( ⋅ ) represents the transformation applied by the shared knowledge expert, and W task⁢(q)⁢(⋅)subscript 𝑊 task 𝑞⋅W_{\text{task}(q)}(\cdot)italic_W start_POSTSUBSCRIPT task ( italic_q ) end_POSTSUBSCRIPT ( ⋅ ) denotes the transformation applied from the task expert which selected by the task router. In practice, we fine-tune Sentence-BERT [[41](https://arxiv.org/html/2506.10357v1#bib.bib41)] as the task router to classify instructions into task types. For action generation, we integrate VPT [[3](https://arxiv.org/html/2506.10357v1#bib.bib3)] as the action head, enabling low-level control execution within the Minecraft environment.

We first train the shared knowledge expert across various tasks to capture common knowledge between them. Then, we fine-tune the task-specific experts while keeping the shared expert frozen. Through this approach, each task-specific expert learns specialized task knowledge, while the shared knowledge expert establishes connections across tasks. Moreover, the task scale-up experiments in Section [4.3](https://arxiv.org/html/2506.10357v1#S4.SS3 "4.3 Ablation Study ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts") demonstrate that the model supports task expansion by training new expert, without compromising the performance of previously learned tasks.

### 3.3 Multimodal Reasoning-Augmented Reinforcement Learning

In open-world environment of Minecraft, the diverse surroundings and randomized initial positions result in varying observations. To adapt to this diversity, we propose Multimodal Reasoning-Augmented Reinforcement Learning approach. It guides the agent to generate reasoning processes based on visual content and instruction, thereby explicitly activating its multimodal reasoning capability. This capability is further enhanced through reinforcement learning (RL), encouraging the agent to produce robust and interpretable responses.

Specifically, we first leverage the data collected from the pipeline (Sec. [3.1](https://arxiv.org/html/2506.10357v1#S3.SS1 "3.1 Knowledge-Enhanced Data Generation Pipeline ‣ 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")) to adapt a general MLLM to the Minecraft domain. Then, we introduce a multimodal reasoning fine-tuning phase, where the model is tuned on data with Chain-of-Thought (CoT) templates to activate its reasoning capabilities:

ℒ sft=−∑t=1 T log⁡p θ⁢(y t∣x v,x ins,y<t),y=[y(think),y(ans)]formulae-sequence subscript ℒ sft superscript subscript 𝑡 1 𝑇 subscript 𝑝 𝜃 conditional subscript 𝑦 𝑡 subscript 𝑥 𝑣 subscript 𝑥 ins subscript 𝑦 absent 𝑡 𝑦 superscript 𝑦 think superscript 𝑦 ans\mathcal{L}_{\text{sft}}=-\sum_{t=1}^{T}\log p_{\theta}\left(y_{t}\mid x_{v},x% _{\text{ins}},y_{<t}\right),\quad y=\left[y^{(\text{think})},\,y^{(\text{ans})% }\right]caligraphic_L start_POSTSUBSCRIPT sft end_POSTSUBSCRIPT = - ∑ start_POSTSUBSCRIPT italic_t = 1 end_POSTSUBSCRIPT start_POSTSUPERSCRIPT italic_T end_POSTSUPERSCRIPT roman_log italic_p start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_t end_POSTSUBSCRIPT ∣ italic_x start_POSTSUBSCRIPT italic_v end_POSTSUBSCRIPT , italic_x start_POSTSUBSCRIPT ins end_POSTSUBSCRIPT , italic_y start_POSTSUBSCRIPT < italic_t end_POSTSUBSCRIPT ) , italic_y = [ italic_y start_POSTSUPERSCRIPT ( think ) end_POSTSUPERSCRIPT , italic_y start_POSTSUPERSCRIPT ( ans ) end_POSTSUPERSCRIPT ](2)

where x v subscript 𝑥 𝑣 x_{v}italic_x start_POSTSUBSCRIPT italic_v end_POSTSUBSCRIPT and x i⁢n⁢s subscript 𝑥 𝑖 𝑛 𝑠 x_{ins}italic_x start_POSTSUBSCRIPT italic_i italic_n italic_s end_POSTSUBSCRIPT denote the input visual tokens and text tokens, respectively; y 𝑦 y italic_y represents the output token, which consists of reasoning process y(think)superscript 𝑦 think y^{(\text{think})}italic_y start_POSTSUPERSCRIPT ( think ) end_POSTSUPERSCRIPT and final answer y(ans)superscript 𝑦 ans y^{(\text{ans})}italic_y start_POSTSUPERSCRIPT ( ans ) end_POSTSUPERSCRIPT; and p θ subscript 𝑝 𝜃 p_{\theta}italic_p start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT denotes the MLLM with parameters θ 𝜃\theta italic_θ. During this phase, we require the model to describe the current visual scene as part of the multimodal reasoning process. This compels the model to attend to visual information before answering questions, guiding it to complete tasks based on visual cues.

To further enhance the model’s reasoning capabilities, we incorporate a reinforcement learning phase with Group Relative Policy Optimization (GRPO) algorithm [[43](https://arxiv.org/html/2506.10357v1#bib.bib43)]. It obviates the need for additional value function approximation as in PPO [[42](https://arxiv.org/html/2506.10357v1#bib.bib42)], and instead uses the average reward of multiple sampled outputs as the baseline. Therefore, the model can leverage its self-generated sampling data to iteratively refine its reasoning process, leading to more robust and coherent reasoning over time. To better adapt to the grounding task in Minecraft, we design an IoU-Density Reward function, which offers more fine-grained reward signal to effectively guide the model’s learning process:

f⁢(y)={1,if⁢u≥α η⁢u,if⁢α>u≥β 0,if⁢u<β 𝑓 𝑦 cases 1 if 𝑢 𝛼 𝜂 𝑢 if 𝛼 𝑢 𝛽 0 if 𝑢 𝛽 f(y)=\begin{cases}1,&\text{if }u\geq\alpha\\ \eta u,&\text{if }\alpha>u\geq\beta\\ 0,&\text{if }u<\beta\end{cases}italic_f ( italic_y ) = { start_ROW start_CELL 1 , end_CELL start_CELL if italic_u ≥ italic_α end_CELL end_ROW start_ROW start_CELL italic_η italic_u , end_CELL start_CELL if italic_α > italic_u ≥ italic_β end_CELL end_ROW start_ROW start_CELL 0 , end_CELL start_CELL if italic_u < italic_β end_CELL end_ROW(3)

Here, u 𝑢 u italic_u denotes the Intersection-over-Union (IoU), α 𝛼\alpha italic_α and β 𝛽\beta italic_β are hyperparameters in the range (0,1)0 1(0,1)( 0 , 1 ), and η 𝜂\eta italic_η is a weighting coefficient. For multimodal input x 𝑥 x italic_x, policy π θ subscript 𝜋 𝜃\pi_{\theta}italic_π start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT samples G 𝐺 G italic_G output sequences {y 1,y 2,…,y G}subscript 𝑦 1 subscript 𝑦 2…subscript 𝑦 𝐺\{y_{1},y_{2},...,y_{G}\}{ italic_y start_POSTSUBSCRIPT 1 end_POSTSUBSCRIPT , italic_y start_POSTSUBSCRIPT 2 end_POSTSUBSCRIPT , … , italic_y start_POSTSUBSCRIPT italic_G end_POSTSUBSCRIPT }. The training objective can be formulated as follows:

1 G⁢∑i=1 G 1|y i|⁢∑t=1|y i|{min⁡[r θ⁢(x,y i)⁢A i,t,c⁢l⁢i⁢p⁢(r θ⁢(x,y i),1−ε,1+ε)⁢A i,t]−λ⁢D K⁢L},1 𝐺 superscript subscript 𝑖 1 𝐺 1 subscript 𝑦 𝑖 superscript subscript 𝑡 1 subscript 𝑦 𝑖 subscript 𝑟 𝜃 𝑥 subscript 𝑦 𝑖 subscript 𝐴 𝑖 𝑡 𝑐 𝑙 𝑖 𝑝 subscript 𝑟 𝜃 𝑥 subscript 𝑦 𝑖 1 𝜀 1 𝜀 subscript 𝐴 𝑖 𝑡 𝜆 subscript 𝐷 𝐾 𝐿\frac{1}{G}\sum_{i=1}^{G}\frac{1}{\left|y_{i}\right|}\sum_{t=1}^{\left|y_{i}% \right|}\left\{\min\left[r_{\theta}\left(x,y_{i}\right)A_{i,t},clip\left(r_{% \theta}\left(x,y_{i}\right),1-\varepsilon,1+\varepsilon\right)A_{i,t}\right]-% \lambda D_{KL}\right\},divide start_ARG 1 end_ARG start_ARG italic_G end_ARG ∑ start_POSTSUBSCRIPT italic_i = 1 end_POSTSUBSCRIPT start_POSTSUPERSCRIPT italic_G end_POSTSUPERSCRIPT divide start_ARG 1 end_ARG start_ARG | italic_y start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT | end_ARG ∑ start_POSTSUBSCRIPT italic_t = 1 end_POSTSUBSCRIPT start_POSTSUPERSCRIPT | italic_y start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT | end_POSTSUPERSCRIPT { roman_min [ italic_r start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_x , italic_y start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT ) italic_A start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT , italic_c italic_l italic_i italic_p ( italic_r start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_x , italic_y start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT ) , 1 - italic_ε , 1 + italic_ε ) italic_A start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ] - italic_λ italic_D start_POSTSUBSCRIPT italic_K italic_L end_POSTSUBSCRIPT } ,(4)

r θ⁢(x,y i)=π θ⁢(y i,t∣x,y i,<t)π θ o⁢l⁢d⁢(y i,t∣x,y i,<t),D K⁢L=π r⁢e⁢f⁢(y i,t∣x,y i,<t)π θ⁢(y i,t∣x,y i,<t)−log⁡π r⁢e⁢f⁢(y i,t∣x,y i,<t)π θ⁢(y i,t∣x,y i,<t)−1,formulae-sequence subscript 𝑟 𝜃 𝑥 subscript 𝑦 𝑖 subscript 𝜋 𝜃 conditional subscript 𝑦 𝑖 𝑡 𝑥 subscript 𝑦 𝑖 absent 𝑡 subscript 𝜋 subscript 𝜃 𝑜 𝑙 𝑑 conditional subscript 𝑦 𝑖 𝑡 𝑥 subscript 𝑦 𝑖 absent 𝑡 subscript 𝐷 𝐾 𝐿 subscript 𝜋 𝑟 𝑒 𝑓 conditional subscript 𝑦 𝑖 𝑡 𝑥 subscript 𝑦 𝑖 absent 𝑡 subscript 𝜋 𝜃 conditional subscript 𝑦 𝑖 𝑡 𝑥 subscript 𝑦 𝑖 absent 𝑡 subscript 𝜋 𝑟 𝑒 𝑓 conditional subscript 𝑦 𝑖 𝑡 𝑥 subscript 𝑦 𝑖 absent 𝑡 subscript 𝜋 𝜃 conditional subscript 𝑦 𝑖 𝑡 𝑥 subscript 𝑦 𝑖 absent 𝑡 1 r_{\theta}\left(x,y_{i}\right)=\frac{\pi_{\theta}\left(y_{i,t}\mid x,y_{i,<t}% \right)}{\pi_{\theta_{old}}\left(y_{i,t}\mid x,y_{i,<t}\right)},D_{KL}=\frac{% \pi_{ref}\left(y_{i,t}\mid x,y_{i,<t}\right)}{\pi_{\theta}\left(y_{i,t}\mid x,% y_{i,<t}\right)}-\log\frac{\pi_{ref}\left(y_{i,t}\mid x,y_{i,<t}\right)}{\pi_{% \theta}\left(y_{i,t}\mid x,y_{i,<t}\right)}-1,italic_r start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_x , italic_y start_POSTSUBSCRIPT italic_i end_POSTSUBSCRIPT ) = divide start_ARG italic_π start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ∣ italic_x , italic_y start_POSTSUBSCRIPT italic_i , < italic_t end_POSTSUBSCRIPT ) end_ARG start_ARG italic_π start_POSTSUBSCRIPT italic_θ start_POSTSUBSCRIPT italic_o italic_l italic_d end_POSTSUBSCRIPT end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ∣ italic_x , italic_y start_POSTSUBSCRIPT italic_i , < italic_t end_POSTSUBSCRIPT ) end_ARG , italic_D start_POSTSUBSCRIPT italic_K italic_L end_POSTSUBSCRIPT = divide start_ARG italic_π start_POSTSUBSCRIPT italic_r italic_e italic_f end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ∣ italic_x , italic_y start_POSTSUBSCRIPT italic_i , < italic_t end_POSTSUBSCRIPT ) end_ARG start_ARG italic_π start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ∣ italic_x , italic_y start_POSTSUBSCRIPT italic_i , < italic_t end_POSTSUBSCRIPT ) end_ARG - roman_log divide start_ARG italic_π start_POSTSUBSCRIPT italic_r italic_e italic_f end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ∣ italic_x , italic_y start_POSTSUBSCRIPT italic_i , < italic_t end_POSTSUBSCRIPT ) end_ARG start_ARG italic_π start_POSTSUBSCRIPT italic_θ end_POSTSUBSCRIPT ( italic_y start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT ∣ italic_x , italic_y start_POSTSUBSCRIPT italic_i , < italic_t end_POSTSUBSCRIPT ) end_ARG - 1 ,(5)

where A i,t subscript 𝐴 𝑖 𝑡 A_{i,t}italic_A start_POSTSUBSCRIPT italic_i , italic_t end_POSTSUBSCRIPT denotes the advantage function, ε 𝜀\varepsilon italic_ε and λ 𝜆\lambda italic_λ are hyperparameters, and π θ o⁢l⁢d subscript 𝜋 subscript 𝜃 𝑜 𝑙 𝑑\pi_{\theta_{old}}italic_π start_POSTSUBSCRIPT italic_θ start_POSTSUBSCRIPT italic_o italic_l italic_d end_POSTSUBSCRIPT end_POSTSUBSCRIPT and π r⁢e⁢f subscript 𝜋 𝑟 𝑒 𝑓\pi_{ref}italic_π start_POSTSUBSCRIPT italic_r italic_e italic_f end_POSTSUBSCRIPT represent the old policy and the reference model, respectively.

Table 1: Main Result of Optimus-3 on Long-Horizon tasks. We report SR on each task group, the results of each task can be found in the Appendix. H. Planner† denotes MLLM generates the task plan, followed by STEVE-1 [[28](https://arxiv.org/html/2506.10357v1#bib.bib28)] generates actions, as adopted in previous work [[27](https://arxiv.org/html/2506.10357v1#bib.bib27)].

4 Experiments
-------------

### 4.1 Experiments Setting

Environment. Following the standard settings in many previous works [[28](https://arxiv.org/html/2506.10357v1#bib.bib28), [50](https://arxiv.org/html/2506.10357v1#bib.bib50), [51](https://arxiv.org/html/2506.10357v1#bib.bib51), [40](https://arxiv.org/html/2506.10357v1#bib.bib40), [26](https://arxiv.org/html/2506.10357v1#bib.bib26)], we conduct experiments in the open-world environment of Minecraft on the MineRL [[17](https://arxiv.org/html/2506.10357v1#bib.bib17)] platform. In MineRL, the agent receives instructions and observations and outputs mouse and keyboard control actions at a frequency of 20 Hz. For each task execution, the agent is initialized in random biomes and positions without any equipment, resulting in highly diverse environmental conditions. Therefore, Minecraft serves as a suitable and challenging testbed for evaluating open-world agents.

Implementation details. We initialize Optimus-3 with the weights of Qwen2.5-VL-7B [[2](https://arxiv.org/html/2506.10357v1#bib.bib2)]. Then we adapt it into MoE architecture, comprising one shared knowledge expert and five task-specific experts dedicated to planning, perception, action, grounding, and reflection. We collect 230k samples for supervised fine-tuning, 58k samples for the multimodal reasoning fine-tuning phase, and 5k samples for reinforcement learning. These datasets are sourced from our proposed data generation pipeline as well as previous works [[3](https://arxiv.org/html/2506.10357v1#bib.bib3), [27](https://arxiv.org/html/2506.10357v1#bib.bib27), [40](https://arxiv.org/html/2506.10357v1#bib.bib40)]. All experiments were conducted on 8x NVIDIA L40 GPUs. Training pipeline and hyperparameter setting can be found in Appendix. G.

Evaluation Tasks & Metrics. We evaluate Optimus-3 across six types of tasks: Long-Horizon, Planning, Captioning, Embodied QA, Grounding, and Reflection. For Long-Horizon tasks, we follow the previous setup [[26](https://arxiv.org/html/2506.10357v1#bib.bib26)], conducting experiments on 67 tasks grouped into 7 categories. Each task is executed at least 30 times, and the average Success Rate (SR) is used as the evaluation metric. For Planning and Reflection tasks, evaluation samples are 103 and 64, respectively. They are used to evaluate the agent’s ability for long-horizon planning and reflection on its current state, with average accuracy (Acc) as the evaluation metric. For the Captioning and Embodied QA tasks, the evaluation includes 134 and 400 samples, respectively. We adopt an LLM-as-Judge [[21](https://arxiv.org/html/2506.10357v1#bib.bib21)] approach, employing GPT-4.1 [[1](https://arxiv.org/html/2506.10357v1#bib.bib1)] to assign a score from 1 to 10 for each sample. The average score is then normalized to a value between 0 and 1. For the Grounding tasks, we construct 500 evaluation samples, and use IOU@0.5[[6](https://arxiv.org/html/2506.10357v1#bib.bib6)] as the prediction accuracy.

Baselines. For Long-Horizon tasks, we employ generalist MLLMs (GPT-3.5 [[39](https://arxiv.org/html/2506.10357v1#bib.bib39)], GPT-4o [[1](https://arxiv.org/html/2506.10357v1#bib.bib1)], Qwen2.5-VL[[2](https://arxiv.org/html/2506.10357v1#bib.bib2)], Gemini-1.5-pro [[45](https://arxiv.org/html/2506.10357v1#bib.bib45)]) and current SOTA agents in Minecraft (DEPS [[50](https://arxiv.org/html/2506.10357v1#bib.bib50)], JARVIS-1 [[51](https://arxiv.org/html/2506.10357v1#bib.bib51)], Optimus-1 [[26](https://arxiv.org/html/2506.10357v1#bib.bib26)], and Optimus-2 [[27](https://arxiv.org/html/2506.10357v1#bib.bib27)]) as baselines. For the other tasks, we compare Optimus-3 against generalist MLLMs, and various post-trained versions of Qwen2.5-VL.

### 4.2 Experimental Results

Optimus-3 outperforms existing Minecraft agents on Long-Horizon tasks. As shown in Table [1](https://arxiv.org/html/2506.10357v1#S3.T1 "Table 1 ‣ 3.3 Multimodal Reasoning-Augmented Reinforcement Learning ‣ 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), Optimus-3 achieves the highest success rate across all seven task groups, with particularly strong performance on the Diamond Group, attaining a SR of 15%. Notably, Optimus-3 performs self-planning and action prediction without any additional tools or external models, distinguishing it from other agents [[51](https://arxiv.org/html/2506.10357v1#bib.bib51), [26](https://arxiv.org/html/2506.10357v1#bib.bib26), [27](https://arxiv.org/html/2506.10357v1#bib.bib27)]. Furthermore, the results in the 4-5 rows demonstrate that post-training Qwen2.5-VL on our planning dataset significantly enhances its long-horizon planning capabilities.

Table 2: Evaluation Results of Optimus-3 on Planning, Captioning, Embodied QA, Grounding, and Reflection. We report the accuracy of each task. #Params denotes activated parameters.

Optimus-3 significantly surpasses existing agents in Planning, Captioning, Embodied QA, Grounding, and Reflection capabilities. As depicted in Table [2](https://arxiv.org/html/2506.10357v1#S4.T2 "Table 2 ‣ 4.2 Experimental Results ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), compared to all baselines, Optimus-3 achieves the highest performance across all task types. More specifically, the first four rows of experimental results reveal the limited capabilities of existing generalist MLLMs, due to they have not post-trained in the Minecraft domain. In contrast, Qwen2.5-VL (SFT), which post-trained on our dataset, shows a notable performance boost. Furthermore, after applying our proposed reinforcement learning method, Qwen2.5-VL (RL) achieves a 52% improvement in Grounding. We observe that the various versions of Qwen2.5-VL without the MoE architecture exhibit task interference, while Optimus-3 consistently achieves superior performance across tasks. Moreover, compared to token-level routing, the proposed task-level routing demonstrates superior performance on tasks such as Captioning, Planning, and Grounding.

### 4.3 Ablation Study

In this section, we conduct comprehensive ablation studies to validate the effectiveness of our approach and summarize our key findings.

![Image 5: Refer to caption](https://arxiv.org/html/2506.10357v1/x12.png)

Figure 5: Ablation Study on Training Data. original refers to the original Qwen2.5-VL, tuned_w/o_k indicates the model fine-tuned on data without knowledge, tuned_w/_k represents the model tuned on data generated by knowledge-enhanced pipeline.

High-quality training data is essential for effective MLLM post-training. Experimental results in Table [2](https://arxiv.org/html/2506.10357v1#S4.T2 "Table 2 ‣ 4.2 Experimental Results ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts") reveal that both Optimus-3 and Qwen2.5-VL benefit substantially from training on our dataset. As shown in Figure [5](https://arxiv.org/html/2506.10357v1#S4.F5 "Figure 5 ‣ 4.3 Ablation Study ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), when we remove the expert models and environmental feedback from the data generation pipeline, the performance drops by 81% on Planning, 32% on Embodied QA, and 23% on Grounding, respectively. We attribute this to the proposed data generation pipeline, which incorporates multiple expert models and tools in Minecraft domain, ensuring the quality of the collected data. Moreover, the entire data collection process incurred only $300 in API costs, required no manual annotation, and was completed using 4× NVIDIA L40 GPUs over 36 hours, demonstrating the cost-efficiency of the pipeline.

Table 3: Ablation study of Optimus-3. We report accuracy on each task. F., A., M., and R. represent the fine-tuning on our data, MoE architecture, multimodal reasoning phase, and RL phase, respectively.

The MoE architecture is crucial for effective multi-task learning. Compare rows 3-6 in Table [3](https://arxiv.org/html/2506.10357v1#S4.T3 "Table 3 ‣ 4.3 Ablation Study ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), we observe that the MoE-based Qwen2.5-VL exhibits no task interference, while the dense-architecture Qwen2.5-VL suffers performance degradation in Planning and Embodied QA due to interference from other tasks. It highlights the strength of our proposed task-routing MoE architecture in heterogeneous multi-task learning.

Multimodal Reasoning-Augmented Reinforcement Learning further enhances the agent’s capabilities. As shown in Table [3](https://arxiv.org/html/2506.10357v1#S4.T3 "Table 3 ‣ 4.3 Ablation Study ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), removing the multimodal reasoning phase and the reinforcement learning phase results in a performance drop of 26% and 16% in Grounding, respectively. We attribute this to the effectiveness of the proposed method in activating the model’s multimodal reasoning capabilities, thereby enhancing Optimus-3’s performance for vision-related tasks.

![Image 6: Refer to caption](https://arxiv.org/html/2506.10357v1/x13.png)

Figure 6: Visual comparison of Optimus-3 (ours), Qwen2.5-VL (tuned on our data), and GPT-4o. Red highlights indicate errors, while blue highlights denote correct outputs.

![Image 7: Refer to caption](https://arxiv.org/html/2506.10357v1/x14.png)

Figure 7: Performance comparison between token-level routing and task-level routing.

Comparison of task scale-up capability. We employ Qwen2.5-VL-7B [[2](https://arxiv.org/html/2506.10357v1#bib.bib2)] as the backbone and compare the performance of token-level routing and task-level routing, in the context of extending grounding capabilities. The light-colored bars indicate models trained only on planning, captioning, reflection, and embodied QA, while the dark-colored bars represent models additionally trained on grounding. As shown in Figure [7](https://arxiv.org/html/2506.10357v1#S4.F7 "Figure 7 ‣ 4.3 Ablation Study ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), after expanding to include the grounding task, the model with task-level routing (task-moe-grounding) preserves the performance on previously learned tasks, while the token-level routing model (token-moe-grounding) suffers from task interference and overall lower performance compared to its task-level counterpart. It demonstrates that our proposed MoE with task-level routing architecture possesses strong task scalability.

### 4.4 Qualitative Analysis

As depicted in Figure [6](https://arxiv.org/html/2506.10357v1#S4.F6 "Figure 6 ‣ 4.3 Ablation Study ‣ 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), we provide a visual comparison between Optimus-3, Qwen2.5-VL-7B [[2](https://arxiv.org/html/2506.10357v1#bib.bib2)], and GPT-4o [[1](https://arxiv.org/html/2506.10357v1#bib.bib1)], highlighting their differences in performance and behavior across various tasks. We observe that GPT-4o exhibits hallucinations in captioning and embodied QA, lacks grounding capabilities, and produces unreasonable plans. In contrast, Qwen2.5-VL, when fine-tuned on our dataset, shows reduced hallucination, acquires grounding and planning abilities, and generates more coherent outputs. Notably, Optimus-3 accurately performs vision-related tasks and produces well-structured plans conditioned on instructions, demonstrating its superior perception and reasoning in the Minecraft environment.

5 Conclusion
------------

We introduce Optimus-3, which endowed with comprehensive capabilities in perception, planning, action, and reflection within the Minecraft. We propose a knowledge-enhanced data generation pipeline to support agent training, a task-level routing MoE to address interference among heterogeneous tasks, and a multimodal reasoning-augmented reinforcement learning method to improve performance on vision-related tasks. Extensive experimental results demonstrate that Optimus-3 marks a significant step forward toward building a generalist agent in Minecraft.

References
----------

*   Achiam et al. [2023] Josh Achiam, Steven Adler, Sandhini Agarwal, Lama Ahmad, Ilge Akkaya, Florencia Leoni Aleman, Diogo Almeida, Janko Altenschmidt, Sam Altman, Shyamal Anadkat, et al. Gpt-4 technical report. _arXiv preprint arXiv:2303.08774_, 2023. 
*   Bai et al. [2025] Shuai Bai, Keqin Chen, Xuejing Liu, Jialin Wang, Wenbin Ge, Sibo Song, Kai Dang, Peng Wang, Shijie Wang, Jun Tang, et al. Qwen2. 5-vl technical report. _arXiv preprint arXiv:2502.13923_, 2025. 
*   Baker et al. [2022] Bowen Baker, Ilge Akkaya, Peter Zhokov, Joost Huizinga, Jie Tang, Adrien Ecoffet, Brandon Houghton, Raul Sampedro, and Jeff Clune. Video pretraining (vpt): Learning to act by watching unlabeled online videos. _Advances in Neural Information Processing Systems_, 35:24639–24654, 2022. 
*   Cai et al. [2023a] Shaofei Cai, Zihao Wang, Xiaojian Ma, Anji Liu, and Yitao Liang. Open-world multi-task control through goal-aware representation learning and adaptive horizon prediction. In _Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition_, pages 13734–13744, 2023a. 
*   Cai et al. [2023b] Shaofei Cai, Bowei Zhang, Zihao Wang, Xiaojian Ma, Anji Liu, and Yitao Liang. Groot: Learning to follow instructions by watching gameplay videos. In _The Twelfth International Conference on Learning Representations_, 2023b. 
*   Chen et al. [2023] Zhihong Chen, Ruifei Zhang, Yibing Song, Xiang Wan, and Guanbin Li. Advancing visual grounding with scene knowledge: Benchmark and method. In _Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition_, pages 15039–15049, 2023. 
*   Chen et al. [2022] Zixiang Chen, Yihe Deng, Yue Wu, Quanquan Gu, and Yuanzhi Li. Towards understanding mixture of experts in deep learning. _arXiv preprint arXiv:2208.02813_, 2022. 
*   Dai et al. [2024] Damai Dai, Chengqi Deng, Chenggang Zhao, RX Xu, Huazuo Gao, Deli Chen, Jiashi Li, Wangding Zeng, Xingkai Yu, Y Wu, et al. Deepseekmoe: Towards ultimate expert specialization in mixture-of-experts language models, 2024. _URL https://arxiv. org/abs/2401.06066_, 2024. 
*   Ding et al. [2023] Ziluo Ding, Hao Luo, Ke Li, Junpeng Yue, Tiejun Huang, and Zongqing Lu. Clip4mc: An rl-friendly vision-language model for minecraft. _arXiv preprint arXiv:2303.10571_, 2023. 
*   Dong et al. [2024] Xiaoyi Dong, Pan Zhang, Yuhang Zang, Yuhang Cao, Bin Wang, Linke Ouyang, Xilin Wei, Songyang Zhang, Haodong Duan, Maosong Cao, et al. Internlm-xcomposer2: Mastering free-form text-image composition and comprehension in vision-language large model. _arXiv preprint arXiv:2401.16420_, 2024. 
*   Dosovitskiy et al. [2021] Alexey Dosovitskiy, Lucas Beyer, Alexander Kolesnikov, Dirk Weissenborn, Xiaohua Zhai, Thomas Unterthiner, Mostafa Dehghani, Matthias Minderer, Georg Heigold, Sylvain Gelly, Jakob Uszkoreit, and Neil Houlsby. An image is worth 16x16 words: Transformers for image recognition at scale. _ICLR_, 2021. 
*   Du et al. [2022] Nan Du, Yanping Huang, Andrew M Dai, Simon Tong, Dmitry Lepikhin, Yuanzhong Xu, Maxim Krikun, Yanqi Zhou, Adams Wei Yu, Orhan Firat, et al. Glam: Efficient scaling of language models with mixture-of-experts. In _International conference on machine learning_, pages 5547–5569. PMLR, 2022. 
*   Fan et al. [2022] Linxi Fan, Guanzhi Wang, Yunfan Jiang, Ajay Mandlekar, Yuncong Yang, Haoyi Zhu, Andrew Tang, De-An Huang, Yuke Zhu, and Anima Anandkumar. Minedojo: Building open-ended embodied agents with internet-scale knowledge. _Advances in Neural Information Processing Systems_, 35:18343–18362, 2022. 
*   Fan et al. [2024] Yue Fan, Xiaojian Ma, Rujie Wu, Yuntao Du, Jiaqi Li, Zhi Gao, and Qing Li. Videoagent: A memory-augmented multimodal agent for video understanding. In _European Conference on Computer Vision_, pages 75–92. Springer, 2024. 
*   Fedus et al. [2022] William Fedus, Barret Zoph, and Noam Shazeer. Switch transformers: Scaling to trillion parameter models with simple and efficient sparsity. _Journal of Machine Learning Research_, 23(120):1–39, 2022. 
*   Guo et al. [2025] Daya Guo, Dejian Yang, Haowei Zhang, Junxiao Song, Ruoyu Zhang, Runxin Xu, Qihao Zhu, Shirong Ma, Peiyi Wang, Xiao Bi, et al. Deepseek-r1: Incentivizing reasoning capability in llms via reinforcement learning. _arXiv preprint arXiv:2501.12948_, 2025. 
*   Guss et al. [2019] William H Guss, Brandon Houghton, Nicholay Topin, Phillip Wang, Cayden Codel, Manuela Veloso, and Ruslan Salakhutdinov. Minerl: A large-scale dataset of minecraft demonstrations. _arXiv preprint arXiv:1907.13440_, 2019. 
*   Hafner et al. [2023] Danijar Hafner, Jurgis Pasukonis, Jimmy Ba, and Timothy Lillicrap. Mastering diverse domains through world models. _arXiv preprint arXiv:2301.04104_, 2023. 
*   Kim et al. [2024] Moo Jin Kim, Karl Pertsch, Siddharth Karamcheti, Ted Xiao, Ashwin Balakrishna, Suraj Nair, Rafael Rafailov, Ethan Foster, Grace Lam, Pannag Sanketi, et al. Openvla: An open-source vision-language-action model. _arXiv preprint arXiv:2406.09246_, 2024. 
*   Lepikhin et al. [2020] Dmitry Lepikhin, HyoukJoong Lee, Yuanzhong Xu, Dehao Chen, Orhan Firat, Yanping Huang, Maxim Krikun, Noam Shazeer, and Zhifeng Chen. Gshard: Scaling giant models with conditional computation and automatic sharding. _arXiv preprint arXiv:2006.16668_, 2020. 
*   Li et al. [2024a] Dawei Li, Bohan Jiang, Liangjie Huang, Alimohammad Beigi, Chengshuai Zhao, Zhen Tan, Amrita Bhattacharjee, Yuxuan Jiang, Canyu Chen, Tianhao Wu, et al. From generation to judgment: Opportunities and challenges of llm-as-a-judge. _arXiv preprint arXiv:2411.16594_, 2024a. 
*   Li et al. [2024b] Hao Li, Xue Yang, Zhaokai Wang, Xizhou Zhu, Jie Zhou, Yu Qiao, Xiaogang Wang, Hongsheng Li, Lewei Lu, and Jifeng Dai. Auto mc-reward: Automated dense reward design with large language models for minecraft. In _Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition_, pages 16426–16435, 2024b. 
*   Li et al. [2025a] Hao Li, Qi Lv, Rui Shao, Xiang Deng, Yinchuan Li, Jianye Hao, and Liqiang Nie. Star: Learning diverse robot skill abstractions through rotation-augmented vector quantization. _arXiv preprint arXiv:2506.03863_, 2025a. 
*   Li et al. [2025b] Muyao Li, Zihao Wang, Kaichen He, Xiaojian Ma, and Yitao Liang. Jarvis-vla: Post-training large-scale vision language models to play visual games with keyboards and mouse. _arXiv preprint arXiv:2503.16365_, 2025b. 
*   Li et al. [2025c] Yunxin Li, Shenyuan Jiang, Baotian Hu, Longyue Wang, Wanqi Zhong, Wenhan Luo, Lin Ma, and Min Zhang. Uni-moe: Scaling unified multimodal llms with mixture of experts. _IEEE Transactions on Pattern Analysis and Machine Intelligence_, 2025c. 
*   Li et al. [2024c] Zaijing Li, Yuquan Xie, Rui Shao, Gongwei Chen, Dongmei Jiang, and Liqiang Nie. Optimus-1: Hybrid multimodal memory empowered agents excel in long-horizon tasks. _arXiv preprint arXiv:2408.03615_, 2024c. 
*   Li et al. [2025d] Zaijing Li, Yuquan Xie, Rui Shao, Gongwei Chen, Dongmei Jiang, and Liqiang Nie. Optimus-2: Multimodal minecraft agent with goal-observation-action conditioned policy. _arXiv preprint arXiv:2502.19902_, 2025d. 
*   Lifshitz et al. [2023] Shalev Lifshitz, Keiran Paster, Harris Chan, Jimmy Ba, and Sheila McIlraith. Steve-1: A generative model for text-to-behavior in minecraft. _Advances in Neural Information Processing Systems_, 2023. 
*   Lin et al. [2024] Xi Victoria Lin, Akshat Shrivastava, Liang Luo, Srinivasan Iyer, Mike Lewis, Gargi Ghosh, Luke Zettlemoyer, and Armen Aghajanyan. Moma: Efficient early-fusion pre-training with mixture of modality-aware experts. _arXiv preprint arXiv:2407.21770_, 2024. 
*   Liu et al. [2024a] Aixin Liu, Bei Feng, Bing Xue, Bingxuan Wang, Bochao Wu, Chengda Lu, Chenggang Zhao, Chengqi Deng, Chenyu Zhang, Chong Ruan, et al. Deepseek-v3 technical report. _arXiv preprint arXiv:2412.19437_, 2024a. 
*   Liu et al. [2024b] Shaoteng Liu, Haoqi Yuan, Minda Hu, Yanwei Li, Yukang Chen, Shu Liu, Zongqing Lu, and Jiaya Jia. Rl-gpt: Integrating reinforcement learning and code-as-policy. _arXiv preprint arXiv:2402.19299_, 2024b. 
*   Liu et al. [2023] Shilong Liu, Zhaoyang Zeng, Tianhe Ren, Feng Li, Hao Zhang, Jie Yang, Chunyuan Li, Jianwei Yang, Hang Su, Jun Zhu, et al. Grounding dino: Marrying dino with grounded pre-training for open-set object detection. _arXiv preprint arXiv:2303.05499_, 2023. 
*   Liu et al. [2024c] Shilong Liu, Zhaoyang Zeng, Tianhe Ren, Feng Li, Hao Zhang, Jie Yang, Qing Jiang, Chunyuan Li, Jianwei Yang, Hang Su, et al. Grounding dino: Marrying dino with grounded pre-training for open-set object detection. In _European Conference on Computer Vision_, pages 38–55. Springer, 2024c. 
*   Liu et al. [2024d] Shunyu Liu, Yaoru Li, Kongcheng Zhang, Zhenyu Cui, Wenkai Fang, Yuxuan Zheng, Tongya Zheng, and Mingli Song. Odyssey: Empowering agents with open-world skills. _arXiv preprint arXiv:2407.15325_, 2024d. 
*   Lo et al. [2024] Ka Man Lo, Zeyu Huang, Zihan Qiu, Zili Wang, and Jie Fu. A closer look into mixture-of-experts in large language models. _arXiv preprint arXiv:2406.18219_, 2024. 
*   Lu et al. [2024] Haoyu Lu, Wen Liu, Bo Zhang, Bingxuan Wang, Kai Dong, Bo Liu, Jingxiang Sun, Tongzheng Ren, Zhuoshu Li, Yaofeng Sun, et al. Deepseek-vl: towards real-world vision-language understanding. _arXiv preprint arXiv:2403.05525_, 2024. 
*   Mu and Lin [2025] Siyuan Mu and Sen Lin. A comprehensive survey of mixture-of-experts: Algorithms, theory, and applications. _arXiv preprint arXiv:2503.07137_, 2025. 
*   Oh et al. [2017] Junhyuk Oh, Satinder Singh, Honglak Lee, and Pushmeet Kohli. Zero-shot task generalization with multi-task deep reinforcement learning. In _Proceedings of the 34th International Conference on Machine Learning_, pages 2661–2670. PMLR, 2017. 
*   Ouyang et al. [2022] Long Ouyang, Jeffrey Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright, Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray, et al. Training language models to follow instructions with human feedback. _Advances in neural information processing systems_, 35:27730–27744, 2022. 
*   Qin et al. [2023] Yiran Qin, Enshen Zhou, Qichang Liu, Zhenfei Yin, Lu Sheng, Ruimao Zhang, Yu Qiao, and Jing Shao. Mp5: A multi-modal open-ended embodied system in minecraft via active perception. _arXiv preprint arXiv:2312.07472_, 2023. 
*   Reimers and Gurevych [2019] Nils Reimers and Iryna Gurevych. Sentence-bert: Sentence embeddings using siamese bert-networks. _arXiv preprint arXiv:1908.10084_, 2019. 
*   Schulman et al. [2017] John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, and Oleg Klimov. Proximal policy optimization algorithms. _arXiv preprint arXiv:1707.06347_, 2017. 
*   Shao et al. [2024] Zhihong Shao, Peiyi Wang, Qihao Zhu, Runxin Xu, Junxiao Song, Xiao Bi, Haowei Zhang, Mingchuan Zhang, YK Li, Y Wu, et al. Deepseekmath: Pushing the limits of mathematical reasoning in open language models. _arXiv preprint arXiv:2402.03300_, 2024. 
*   Shen et al. [2025] Leyang Shen, Gongwei Chen, Rui Shao, Weili Guan, and Liqiang Nie. Mome: Mixture of multimodal experts for generalist multimodal large language models. _Advances in neural information processing systems_, 37:42048–42070, 2025. 
*   Team et al. [2024] Gemini Team, Petko Georgiev, Ving Ian Lei, Ryan Burnell, Libin Bai, Anmol Gulati, Garrett Tanzer, Damien Vincent, Zhufeng Pan, Shibo Wang, et al. Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context. _arXiv preprint arXiv:2403.05530_, 2024. 
*   Vats et al. [2024] Arpita Vats, Rahul Raja, Vinija Jain, and Aman Chadha. The evolution of mixture of experts: A survey from basics to breakthroughs. _Preprints_, 2024. 
*   Wang et al. [2023a] Guanzhi Wang, Yuqi Xie, Yunfan Jiang, Ajay Mandlekar, Chaowei Xiao, Yuke Zhu, Linxi Fan, and Anima Anandkumar. Voyager: An open-ended embodied agent with large language models. _arXiv preprint arXiv:2305.16291_, 2023a. 
*   Wang et al. [2024a] Junyang Wang, Haiyang Xu, Haitao Jia, Xi Zhang, Ming Yan, Weizhou Shen, Ji Zhang, Fei Huang, and Jitao Sang. Mobile-agent-v2: Mobile device operation assistant with effective navigation via multi-agent collaboration. _arXiv preprint arXiv:2406.01014_, 2024a. 
*   Wang et al. [2024b] Xiaohan Wang, Yuhui Zhang, Orr Zohar, and Serena Yeung-Levy. Videoagent: Long-form video understanding with large language model as agent. In _European Conference on Computer Vision_, pages 58–76. Springer, 2024b. 
*   Wang et al. [2023b] Zihao Wang, Shaofei Cai, Guanzhou Chen, Anji Liu, Xiaojian Ma, and Yitao Liang. Describe, explain, plan and select: Interactive planning with large language models enables open-world multi-task agents. _arXiv preprint arXiv:2302.01560_, 2023b. 
*   Wang et al. [2023c] Zihao Wang, Shaofei Cai, Anji Liu, Yonggang Jin, Jinbing Hou, Bowei Zhang, Haowei Lin, Zhaofeng He, Zilong Zheng, Yaodong Yang, et al. Jarvis-1: Open-world multi-task agents with memory-augmented multimodal language models. _arXiv preprint arXiv:2311.05997_, 2023c. 
*   Wang et al. [2024c] Zihao Wang, Shaofei Cai, Zhancun Mu, Haowei Lin, Ceyao Zhang, Xuejie Liu, Qing Li, Anji Liu, Xiaojian Ma, and Yitao Liang. Omnijarvis: Unified vision-language-action tokenization enables open-world instruction following agents. _arXiv preprint arXiv:2407.00114_, 2024c. 
*   Wu et al. [2024] Jialin Wu, Xia Hu, Yaqing Wang, Bo Pang, and Radu Soricut. Omni-smola: Boosting generalist multimodal models with soft mixture of low-rank experts. In _Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition_, pages 14205–14215, 2024. 
*   Xie et al. [2025] Bin Xie, Rui Shao, Gongwei Chen, Kaiwen Zhou, Yinchuan Li, Jie Liu, Min Zhang, and Liqiang Nie. Gui-explorer: Autonomous exploration and mining of transition-aware knowledge for gui agent. _arXiv preprint arXiv:2505.16827_, 2025. 
*   Zhang et al. [2024] Jiazhao Zhang, Kunyu Wang, Rongtao Xu, Gengze Zhou, Yicong Hong, Xiaomeng Fang, Qi Wu, Zhizheng Zhang, and He Wang. Navid: Video-based vlm plans the next step for vision-and-language navigation. _arXiv preprint arXiv:2402.15852_, 2024. 
*   Zhao et al. [2023] Zhonghan Zhao, Wenhao Chai, Xuan Wang, Li Boyi, Shengyu Hao, Shidong Cao, Tian Ye, Jenq-Neng Hwang, and Gaoang Wang. See and think: Embodied agent in virtual environment. _arXiv preprint arXiv:2311.15209_, 2023. 
*   Zhou et al. [2024] Gengze Zhou, Yicong Hong, Zun Wang, Xin Eric Wang, and Qi Wu. Navgpt-2: Unleashing navigational reasoning capability for large vision-language models. In _European Conference on Computer Vision_, pages 260–278. Springer, 2024. 
*   Zhou et al. [2022] Yanqi Zhou, Tao Lei, Hanxiao Liu, Nan Du, Yanping Huang, Vincent Zhao, Andrew M Dai, Quoc V Le, James Laudon, et al. Mixture-of-experts with expert choice routing. _Advances in Neural Information Processing Systems_, 35:7103–7114, 2022. 
*   Zhu et al. [2023] Xizhou Zhu, Yuntao Chen, Hao Tian, Chenxin Tao, Weijie Su, Chenyu Yang, Gao Huang, Bin Li, Lewei Lu, Xiaogang Wang, et al. Ghost in the minecraft: Generally capable agents for open-world enviroments via large language models with text-based knowledge and memory. _arXiv preprint arXiv:2305.17144_, 2023. 

Appendix of 

Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts

###### Contents

1.   [1 Introduction](https://arxiv.org/html/2506.10357v1#S1 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
2.   [2 Related Work](https://arxiv.org/html/2506.10357v1#S2 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
3.   [3 Optimus-3](https://arxiv.org/html/2506.10357v1#S3 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    1.   [3.1 Knowledge-Enhanced Data Generation Pipeline](https://arxiv.org/html/2506.10357v1#S3.SS1 "In 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    2.   [3.2 MoE Architecture with Task-level Routing](https://arxiv.org/html/2506.10357v1#S3.SS2 "In 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    3.   [3.3 Multimodal Reasoning-Augmented Reinforcement Learning](https://arxiv.org/html/2506.10357v1#S3.SS3 "In 3 Optimus-3 ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")

4.   [4 Experiments](https://arxiv.org/html/2506.10357v1#S4 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    1.   [4.1 Experiments Setting](https://arxiv.org/html/2506.10357v1#S4.SS1 "In 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    2.   [4.2 Experimental Results](https://arxiv.org/html/2506.10357v1#S4.SS2 "In 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    3.   [4.3 Ablation Study](https://arxiv.org/html/2506.10357v1#S4.SS3 "In 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    4.   [4.4 Qualitative Analysis](https://arxiv.org/html/2506.10357v1#S4.SS4 "In 4 Experiments ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")

5.   [5 Conclusion](https://arxiv.org/html/2506.10357v1#S5 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
6.   [A Limitation and Future Work](https://arxiv.org/html/2506.10357v1#A1 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
7.   [B Broader Impact](https://arxiv.org/html/2506.10357v1#A2 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
8.   [C Minecraft](https://arxiv.org/html/2506.10357v1#A3 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
9.   [D Dataset Generation Pipeline](https://arxiv.org/html/2506.10357v1#A4 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    1.   [D.1 Pipeline](https://arxiv.org/html/2506.10357v1#A4.SS1 "In Appendix D Dataset Generation Pipeline ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    2.   [D.2 Comparison with Existing Datasets](https://arxiv.org/html/2506.10357v1#A4.SS2 "In Appendix D Dataset Generation Pipeline ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")

10.   [E MoE Architecture with Task-level Routing](https://arxiv.org/html/2506.10357v1#A5 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
11.   [F Multimodal Reasoning-Augmented Reinforcement Learning](https://arxiv.org/html/2506.10357v1#A6 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
12.   [G Training Details](https://arxiv.org/html/2506.10357v1#A7 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
13.   [H Quantitative Analysis](https://arxiv.org/html/2506.10357v1#A8 "In Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    1.   [H.1 Evaluation Benchmark](https://arxiv.org/html/2506.10357v1#A8.SS1 "In Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")
    2.   [H.2 Results on Long-Horizon Tasks](https://arxiv.org/html/2506.10357v1#A8.SS2 "In Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")

Appendix A Limitation and Future Work
-------------------------------------

In this paper, we aim to endow Optimus-3 with multi-dimensional capabilities, including perception, planning, execution, grounding, and reflection. These abilities enable Optimus-3 to interact with humans and perform a wide range of tasks in Minecraft. However, due to the absence of a memory module, Optimus-3 lacks the ability for life-long learning and self-evolution. Equipping Optimus-3 with the capability to autonomously explore and learn new tasks remains a promising direction for future research. Moreover, creative tasks represent a current limitation of Optimus-3. Once suitable datasets for such tasks become available, its capabilities can be effectively enhanced via post-training.

Appendix B Broader Impact
-------------------------

Optimus-3 is built upon a multimodal large language model (MLLM), which brings both potential benefits and inherent risks. On the positive side, thanks to the perceptual and reasoning capabilities of MLLMs, Optimus-3 demonstrates strong performance in planning and visual question answering. Moreover, it exhibits good generalization across a wide range of tasks. However, on the negative side, MLLMs carry the risk of generating harmful or unintended outputs. Although techniques such as post-training have significantly reduced the likelihood of Optimus-3 producing undesired content, a comprehensive assessment of its potential risks remains essential to ensure safe deployment.

Appendix C Minecraft
--------------------

Minecraft is a highly popular sandbox video game developed by Mojang Studios 1 1 1 https://www.minecraft.net/en-us/article/meet-mojang-studios. It allows players to explore an infinitely generated 3D world composed of blocks, gather raw materials, tame and breed creatures, craft tools, build structures, and battle bosses. The game features a diverse range of environments, including mountains, rivers, oceans, forests, deserts, villages, and caves. In such an open world, the agent receives visual observations as input and generates mouse and keyboard control actions as output. The diversity of the environment, visual observations, and action space makes Minecraft an ideal testbed for evaluating a general-purpose agent’s abilities in perception, planning, action, and reflection. Therefore, consistent with a large body of prior work [[3](https://arxiv.org/html/2506.10357v1#bib.bib3), [28](https://arxiv.org/html/2506.10357v1#bib.bib28), [47](https://arxiv.org/html/2506.10357v1#bib.bib47), [13](https://arxiv.org/html/2506.10357v1#bib.bib13), [50](https://arxiv.org/html/2506.10357v1#bib.bib50), [51](https://arxiv.org/html/2506.10357v1#bib.bib51), [40](https://arxiv.org/html/2506.10357v1#bib.bib40), [26](https://arxiv.org/html/2506.10357v1#bib.bib26), [27](https://arxiv.org/html/2506.10357v1#bib.bib27)], we adopt Minecraft as the environment for evaluating our agent.

Appendix D Dataset Generation Pipeline
--------------------------------------

### D.1 Pipeline

We first use a script to extract commonly used items from the Minecraft Wiki 2 2 2 https://minecraft.wiki/, which are then assembled into a task pool. For each item in the task pool, we use a knowledge graph to derive its crafting or acquisition path. For example, the crafting path for the “stone pickaxe” represented as: {log → planks → crafting table → sticks → wooden pickaxe → cobblestone → stone pickaxe}. This path is converted into a task plan format. To increase the diversity and complexity of planning tasks, we randomly generate scenarios where the agent is assumed to already possess some materials. For example: “Given one crafting table and two cobblestones, how can a stone sword be crafted?” Such settings significantly increase the difficulty of planning, as the agent must reason under partial resource constraints and adjust the crafting sequence accordingly.

Next, we introduce STEVE-1 [[28](https://arxiv.org/html/2506.10357v1#bib.bib28)] to sequentially execute each sub-goal in the plan. Through interaction with the environment, we collect the corresponding observation-action pairs for each step, which are then used to construct the action dataset. We follow prior settings [[27](https://arxiv.org/html/2506.10357v1#bib.bib27)] by sampling frames at 640×360 resolution and 20 frames per second, and mapping the agent’s actions into a discrete action space [[3](https://arxiv.org/html/2506.10357v1#bib.bib3)].

![Image 8: Refer to caption](https://arxiv.org/html/2506.10357v1/x15.png)

Figure 8: Planning and Action samples generated from our pipeline.

![Image 9: Refer to caption](https://arxiv.org/html/2506.10357v1/x16.png)

Figure 9: Captioning and Embodied QA samples generated from our pipeline.

![Image 10: Refer to caption](https://arxiv.org/html/2506.10357v1/x17.png)

Figure 10: Grounding and Reflection samples generated from our pipeline.

During execution, we randomly sample visual frames for vision-related tasks. For the captioning, we leverage environmental feedback (including the agent’s state, surrounding objects, and items in the inventory) as ground truth, and employ DeepSeek-VL2 [[36](https://arxiv.org/html/2506.10357v1#bib.bib36)] to generate visual descriptions. For the embodied QA, we leverage GPT-4 3 3 3 https://openai.com/index/gpt-4/ to generate question-answer pairs based on the visual descriptions and environmental feedback, constructing the VQA dataset. For the grounding dataset, Grounding DINO [[32](https://arxiv.org/html/2506.10357v1#bib.bib32)] is used to generate object coordinates based on the object information provided in the environmental feedback. When the environmental feedback indicates task failure, we sample the corresponding trajectory and query GPT-4 to produce reflective analyses, thereby constructing the reflection dataset.

Through this pipeline, we collected a total of 100k action trajectories, 10k planning samples, 40k captioning samples, 40k embodied QA samples, 40k grounding samples, and 3k reflection samples. These datasets were then randomly split into training and evaluation sets. We present some samples in Figure [8](https://arxiv.org/html/2506.10357v1#A4.F8 "Figure 8 ‣ D.1 Pipeline ‣ Appendix D Dataset Generation Pipeline ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")-[10](https://arxiv.org/html/2506.10357v1#A4.F10 "Figure 10 ‣ D.1 Pipeline ‣ Appendix D Dataset Generation Pipeline ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), showcasing the diversity and structure of the collected datas.

### D.2 Comparison with Existing Datasets

To highlight the novelty and coverage of dataset generated from proposed pipeline, we compare it with existing datasets commonly used in the Minecraft. As shown in Table [4](https://arxiv.org/html/2506.10357v1#A4.T4 "Table 4 ‣ D.2 Comparison with Existing Datasets ‣ Appendix D Dataset Generation Pipeline ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), existing datasets lack coverage of critical tasks such as planning, grounding, and reflection, which significantly limits the development of general-purpose agents in Minecraft. Key advantages of our dataset:

*   •Broader Task Coverage: Includes six task types, planning, action, captioning, embodied QA, grounding, and reflection, many of which are not jointly covered in existing datasets. 
*   •Automated and Scalable: Generated via our proposed unified pipeline, reducing the cost and time of manual annotation. 
*   •Knowledge-Enhanced: Incorporates Minecraft-specific expert models and environment feedback to ensure data quality. 
*   •Supports End-to-End Training: Enables training of generalist agents like Optimus-3 that can reason and act across multiple modalities and tasks. 

Table 4: Comparison of our dataset with existing datasets used in Minecraft.

Appendix E MoE Architecture with Task-level Routing
---------------------------------------------------

We initialize our model with Qwen2.5-VL-7B [[2](https://arxiv.org/html/2506.10357v1#bib.bib2)], and then adapt it into a Mixture-of-Experts (MoE) architecture. Following the configuration of DeepSeek-V3 [[30](https://arxiv.org/html/2506.10357v1#bib.bib30)], it adopts a hybrid architecture that integrates a shared backbone with MoE modules to balance generalization and specialization across diverse tasks. The lower layers of the model are implemented as dense Transformer blocks, enabling the learning of universal semantic representations. In contrast, the upper layers incorporate a MoE structure, where experts are selectively activated based on inputs. The MoE structure consists of one shared knowledge expert and five task-specific experts for planning, perception, action, grounding, and reflection. All experts are configured to have equal parameters.

Appendix F Multimodal Reasoning-Augmented Reinforcement Learning
----------------------------------------------------------------

Multimodal Reasoning-Augmented Reinforcement Learning consists of two training stages:

Multimodal Reasoning Tuning Phase: The model is required to perform explicit reasoning before executing the target task. For example, in embodied QA, the model must first describe the visual content as a reasoning process, and then answer the question based on both the question itself and the generated visual description. In our experiments, we observe that this multimodal reasoning fine-tuning stage significantly enhances the model’s performance in tasks such as planning and embodied QA. The prompt templates for planning, embodied QA, grounding, and reflection are presented in Templates [1](https://arxiv.org/html/2506.10357v1#LST1 "Listing 1 ‣ Appendix F Multimodal Reasoning-Augmented Reinforcement Learning ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts")–[4](https://arxiv.org/html/2506.10357v1#LST4 "Listing 4 ‣ Appendix F Multimodal Reasoning-Augmented Reinforcement Learning ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts").

Reinforcement Learning Phase: We leverage the GRPO [[43](https://arxiv.org/html/2506.10357v1#bib.bib43)] algorithm to further enhance the model’s reasoning capabilities. For the grounding task, we design an IoU-Density Reward to provide finer-grained supervision, enabling more precise optimization of the model’s grounding performance.

S ystem:You are an expert in Minecraft,capable of performing task planning,visual question answering,reflection,grounding and executing low-level actions.

U ser:You should first think about the reasoning process in the mind and then provide the u ser with the answer.The reasoning process and answer are enclosed within<think></think>and<answer></answer>tags,respectively,i.e.,<think>reasoning process here</think><answer>answer here</answer>.The u ser’s instruction is:{instruction}

A ssistant:<think>To craft{items},it is necessary to first consider the required materials and subsequently acquire them in the appropriate order.

{crafting recipes}

Upon analyzing the crafting dependencies among these materials,the resulting list of components and their respective quantities is as follows:

{materials and their quantities}

</think>

<answer>

To obtain{items}from scratch,you need to carry out the following steps in sequence:

{plans}

</answer>

Listing 1: Prompt for Planning.

S ystem:You are an expert in Minecraft,capable of performing task planning,visual question answering,reflection,grounding and executing low-level actions.

U ser:You should first think about the reasoning process in the mind and then provide the u ser with the answer.The reasoning process and answer are enclosed within<think></think>and<answer></answer>tags,respectively,i.e.,<think>reasoning process here</think><answer>answer here</answer>.The u ser’s instruction is:<image>{instruction}

A ssistant:

<think>

To answer the questions accurately,I must first provide a precise description of the visual content.

{description of visual content}

Then,I will analyze the questions in relation to the visual content to derive the correct answers.

</think>

<answer>

{ans}

</answer>

Listing 2: Prompt for Embodied QA.

S ystem:You are an expert in Minecraft,capable of performing task planning,visual question answering,reflection,grounding and executing low-level actions.

U ser:You should first think about the reasoning process in the mind and then provide the u ser with the answer.The reasoning process and answer are enclosed within<think></think>and<answer></answer>tags,respectively,i.e.,<think>reasoning process here</think><answer>answer here</answer>.The u ser’s instruction is:<image>{instruction}

A ssistant:

<think>

{description of visual content}

</think>

<answer>

{bbox}

</answer>

Listing 3: Prompt for Grounding.

S ystem:You are an expert in Minecraft,capable of performing task planning,visual question answering,reflection,grounding and executing low-level actions.

U ser:<image>Given the current task:{task}and the corresponding image,you are required to determine whether the task can continue.

A ssistant:

<think>

To accurately assess the current state,I must first provide a precise description of the visual content.

{description of visual content}

Then,I need to perform reasoning based on the current task and the visual content.

{reasoning}

</think>

<answer>

{state of current task}

</answer>

Listing 4: Prompt for Reflection.

Table 5: Hyperparameter setting for each training phase.

Appendix G Training Details
---------------------------

The entire training process is divided into three phase. We first train the shared knowledge expert on various tasks via supervised fine-tuning. During this stage, all parameters of the ViT [[11](https://arxiv.org/html/2506.10357v1#bib.bib11)] and the LLM are unfrozen and trained for 2 epochs to capture generalizable, task-agnostic knowledge. Next, we freeze the ViT and the dense backbone of the LLM, and train only the task-specific experts through multimodal reasoning tuning. Notably, for the action task, we apply imitation learning [[27](https://arxiv.org/html/2506.10357v1#bib.bib27)] to train the model to generate low-level actions. During this phase, the action head is also unfrozen and updated. Finally, we further improve the reasoning capabilities of specific experts, particularly for grounding and reflection, through the reinforcement learning phase. The hyperparameter settings for each training phase are summarized in the Table [5](https://arxiv.org/html/2506.10357v1#A6.T5 "Table 5 ‣ Appendix F Multimodal Reasoning-Augmented Reinforcement Learning ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts").

Appendix H Quantitative Analysis
--------------------------------

### H.1 Evaluation Benchmark

The evaluation benchmark consists of:

*   •104 samples for planning. 
*   •134 samples for captioning. 
*   •400 samples for embodied QA. 
*   •64 samples for reflection. 
*   •500 samples for grounding. 
*   •67 long-horizon tasks for action execution. 

Planning: We randomly sampled 104 cases to construct the planning evaluation set, covering six technological levels: wood, stone, iron, gold, diamond, and redstone. Notably, we introduced planning scenarios with partially available materials, which increases the difficulty of generating accurate plans. This setup poses a significant challenge—even for human players—as computing the correct crafting path for diamond-level items within one minute can be non-trivial. We present a subset of examples in Table [6](https://arxiv.org/html/2506.10357v1#A8.T6 "Table 6 ‣ H.1 Evaluation Benchmark ‣ Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"). We use accuracy as the evaluation metric, where a prediction is considered correct only if the agent’s generated planning steps exactly match the ground truth.

Table 6: Samples from the Planning Evaluation Set.

Table 7: Samples from the Captioning and Embodied QA Evaluation Set.

Table 8: Samples from the Grounding and Reflection Evaluation Set.

Captioning: We collect 134 samples as the evaluation set, where the model is required to accurately describe first-person visual scenes in Minecraft. We adopt an LLM-as-Judge evaluation protocol, employing GPT-4.1 to score each generated visual description on a scale of 1 to 10. The average score is then normalized to the (0, 1) range and used as the evaluation metric. To enhance the robustness of evaluation, we prompt GPT-4.1 to simultaneously score responses from multiple models, reducing randomness and bias in individual assessments. The evaluation prompt is shown in Template [5](https://arxiv.org/html/2506.10357v1#LST5 "Listing 5 ‣ H.1 Evaluation Benchmark ‣ Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts").

Embodied QA: We collect 400 samples as the evaluation set, where the model is required to answer questions related to the visual scene. The evaluation metric is consistent with that of the captioning task. We present some evaluation samples in Table [7](https://arxiv.org/html/2506.10357v1#A8.T7 "Table 7 ‣ H.1 Evaluation Benchmark ‣ Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts").

S ystem:You are a rigorous evaluator.Your task is to score and analyze multiple answers based on a provided correct answer.

U ser:Each answer should be scored from 0 to 10 based on the following dimensions:

-Accuracy:Does the answer correctly reflect the information in the correct answer?

-Completeness:Does the answer include all the key points from the correct answer?

-Clarity:Is the answer clear,well-structured,and easy to understand?

-Relevance:Is all content in the answer relevant to the correct answer,without unnecessary additions?

You will provide both a numerical score(0,10)and a detailed reason for each answer.

Input Format:

Answer:{ground truth}

Response1:{r1}

Response2:{r2}

Response3:{r3}

Output Format:

Output1 Score:X/10

Output1 Reason:xxx

Output2 Score:X/10

Output2 Reason:xxx

Output3 Score:X/10

Output3 Reason:xxx

Listing 5: Evaluation prompt template for Captioning and Embodied QA.

Grounding: We randomly select 500 samples as the evaluation set, where the model is required to predict the coordinates of a specified object. We use IoU@0.5 as the accuracy metric, where a prediction is considered correct if the intersection-over-union (IoU) between the predicted bounding box and the ground truth is greater than 50%. Some cases are shown in Table [8](https://arxiv.org/html/2506.10357v1#A8.T8 "Table 8 ‣ H.1 Evaluation Benchmark ‣ Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts").

Reflection: We randomly select 64 samples as the evaluation set, where the model is required to assess whether the current state allows for continued execution of a given task. This involves reasoning about conditions such as whether the agent is in danger or whether the environment permits task completion. We formulate this as a binary classification task (whether the task can or cannot be continued) and use accuracy as the evaluation metric.

Long-Horizon Tasks: Following the settings of prior work [[26](https://arxiv.org/html/2506.10357v1#bib.bib26)], we select 67 long-horizon tasks spanning seven groups (wood, stone, iron, gold, diamond, redstone, and armor), to evaluate the agent’s ability to perform long-sequence action execution. For each task, the agent is initialized at a random location and without any materials or equipment. As a result, the agent must progressively gather resources and craft tools in order to complete the final objective. To ensure robustness, each task is executed at least 30 times during evaluation. We employ success rate as metric. In the next section, we report the results for each task. Notably, Optimus-3 is the only agent that completes both long-horizon task planning and low-level action generation within an end-to-end architecture, without relying on any external generalist multimodal large models [[40](https://arxiv.org/html/2506.10357v1#bib.bib40), [50](https://arxiv.org/html/2506.10357v1#bib.bib50)] or additional memory modules [[51](https://arxiv.org/html/2506.10357v1#bib.bib51), [26](https://arxiv.org/html/2506.10357v1#bib.bib26)].

### H.2 Results on Long-Horizon Tasks

As shown in Table [9](https://arxiv.org/html/2506.10357v1#A8.T9 "Table 9 ‣ H.2 Results on Long-Horizon Tasks ‣ Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts") and Table [10](https://arxiv.org/html/2506.10357v1#A8.T10 "Table 10 ‣ H.2 Results on Long-Horizon Tasks ‣ Appendix H Quantitative Analysis ‣ Optimus-3: Towards Generalist Multimodal Minecraft Agents with Scalable Task Experts"), we report the success rate of Optimus-3 on each long-horizon task, providing a detailed breakdown of its performance across different task categories.

Table 9: The results of Optimus-3 on the Wood Group, Stone Group, and Iron Group.

Group Task Sub-Goal Num.SR Eval Times
Wood Craft a wooden shovel 6 100.00 40
Craft a wooden pickaxe 5 100.00 39
Craft a wooden axe 5 97.22 36
Craft a wooden hoe 5 100.00 35
Craft a stick 4 100.00 30
Craft a crafting table 3 100.00 30
Craft a wooden sword 5 96.67 30
Craft a chest 4 96.97 30
Craft a bowl 4 100.00 30
Craft a ladder 4 100.00 30
Stone Craft a stone shovel 8 90.32 31
Craft a stone pickaxe 10 91.43 35
Craft a stone axe 10 91.18 34
Craft a stone hoe 8 91.43 35
Craft a charcoal 9 91.43 35
Craft a smoker 9 96.77 31
Craft a stone sword 8 90.91 33
Craft a furnace 9 100.00 30
Craft a torch 8 90.32 31
Iron Craft an iron shovel 13 83.33 30
Craft an iron pickaxe 13 80.00 30
Craft an iron axe 13 57.58 33
Craft an iron hoe 13 60.00 30
Craft a bucket 13 72.97 37
Craft a hopper 14 65.71 35
Craft a rail 13 63.33 30
Craft an iron sword 12 71.88 32
Craft a shears 12 63.64 33
Craft a smithing table 12 37.84 37
Craft a tripwire hook 13 40.00 30
Craft a chain 13 36.11 36
Craft an iron bars 12 35.00 40
Craft an iron nugget 12 45.95 37
Craft a blast furnace 14 40.54 37
Craft a stonecutter 13 60.00 40

Table 10: The results of Optimus-3 on the Gold group, Diamond Group, Redstone Group, and Armor Group.

Group Task Sub Goal Num.SR Eval Times
Gold Craft a golden shovel 16 9.09 77
Craft a golden pickaxe 16 5.41 37
Craft a golden axe 16 10.81 37
Craft a golden hoe 16 12.50 32
Craft a golden sword 16 5.41 37
Smelt and craft a golden ingot 15 16.67 42
Diamond Craft a diamond shovel 15 16.67 42
Craft a diamond pickaxe 15 13.95 43
Craft a diamond axe 16 11.36 44
Craft a diamond hoe 15 28.13 32
Craft a diamond sword 15 14.63 41
Dig down and mine a diamond 15 16.67 30
Craft a jukebox 15 5.56 36
Redstone Craft a piston 16 26.42 53
Craft a redstone torch 16 29.58 71
Craft an activator rail 18 23.44 64
Craft a compass 23 31.48 54
Craft a dropper 16 27.27 44
Craft a note block 16 27.08 48
Armor Craft shield 14 60.00 30
Craft iron chestplate 14 46.67 30
Craft iron boots 14 65.00 60
Craft iron leggings 14 13.33 30
Craft iron helmet 14 46.67 30
Craft diamond helmet 17 15.52 58
Craft diamond chestplate 17 20.00 50
Craft diamond leggings 17 6.25 48
Craft diamond boots 17 8.89 45
Craft golden helmet 17 10.00 50
Craft golden leggings 17 4.00 50
Craft golden boots 17 4.35 46
Craft golden chestplate 17 4.55 44

