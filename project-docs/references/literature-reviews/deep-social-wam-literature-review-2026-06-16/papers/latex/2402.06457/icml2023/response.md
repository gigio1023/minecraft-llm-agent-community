# R1 FSyj

Summary:
This paper proposes a self-improvement called V-STaR framework for LLMs. In comparison to the existing work (e.g., STaR), V-STaR is equipped with a trainable verifier based on Direct Preference Optimization (DPO). This verifier enables V-STaR to additionally utilise negative examples sampled from LLMs.

Strengths And Weaknesses:
Strength: The paper is well written and easy to follow. The idea behind is not complex but yields reasonable performance gain. The choice of DPO is well justified and compared against an outcome supervised reward model (ORM).
Weakness: V-STaR is mainly compared against STaR that does not feature a trainable verifier. To better justify the effectiveness of V-STaR, more comparison/discussions could be drawn upon frameworks with verifiers like 'Let's Verify Step by Step' (https://arxiv.org/pdf/2305.20050.pdf).

Questions:
In your experiments, did you reimplement STaR as you baselines? If so, what did you do with rationalization step that hints the model with ground truth when it fails.
Limitations:
N.A.

## Response: 

Thank you for your comments. We are glad that the reviewer finds our paper well written, and the proposed method well justfied.

> V-STaR is mainly compared against STaR that does not feature a trainable verifier. To better justify the effectiveness of V-STaR, more comparison/discussions could be drawn upon frameworks with verifiers like 'Let's Verify Step by Step' (https://arxiv.org/pdf/2305.20050.pdf).

There is potentially a misunderstanding and we want to clarify. We do compare V-STaR to existing self-improvement **and** verification approaches. We do compare our method to a verifier based model (denoted as Verification in Table 1 and Figure 2), as well as to STaR, RFT and REST-EM (denoted as STaR$^\dagger$ in Table 1 and Figure 2), as well as a non-iterative variant of V-STaR which also utilizes incorrect generations to train a verifier. 

We would like to mention that Process reward models (PRM) such as the one in 'Let's Verify Step by Step' (Lightman et al., 2023) rely on expensive human annotations for each reasoning step in a a chain of thought. On the other hand, V-STaR utilizes iteratively model generated correct and incorrect solutions to train a verifier without any human annotation. Extending V-STaR to verify individual steps in reasoning chains is certainly a topic for future work.

> In your experiments, did you reimplement STaR as you baselines? If so, what did you do with rationalization step that hints the model with ground truth when it fails.

As the rationalization does not help STaR significantly on GSM8K (10.7 vs 10.1 test accuracy), we do not perform this extra step. Singh et al. (2023) [1] observe that this rationalization leads to a significant number of false positives and degrades the performance.

[1] : Singh et al. (2023) Beyond Human Data: Scaling Self-Training for Problem-Solving with Language Models

___

_We hope that your concerns/questions have been addressed and, if so, we would appreciate it if you could reconsider your assessment. We'd be happy to engage in further discussions._



------------------------------------------------------------------



# R2 1eov
Summary:
The paper proposes a simple but effective idea on training a verifier for language model reasoning tasks. The verifier is trained with DPO based on constructed training pairs of reasoning paths that leads to correct and incorrect answers. Experiment results show that the method is quite effective compared to other baselines.
Strengths And Weaknesses:
Strengths:
The authors propose a simple yet effective idea on training verifiers for language model reasoning, and demonstrate in experiments that using DPO for training the verifier is quite effective.
The paper provides a clear comparison with other baselines. The authors include a very detailed table comparing the difference between multiple methods (Verification, STAR, RFT, and the proposed V-STAR).
The experiment analysis is interesting. Several design analysis are included, such as whether verifier should be in the training loop, DPO vs. ORM verifiers, etc.
Weaknesses:
There are still some descriptions that are unclear, for example:
(1) In "Self-Taught Reasoner" in "Preliminaries", the authors mentioned "*we* generate one solution yˆ using greedy decoding with the language model generator";
(2) In "Rejection Sampling Finetuning" in "Preliminaries", the authors mentioned "For each problem xi, we then sample k solutions" and "we only keep correct generated solutions" when introducing other peoples' work. Please revise the sentence to make sure what part is the preliminary work, and what part is the author's proposed modification.
The authors proposed the metric "Verifier@K" using the probability of the correctness of the top result from N choose k samples. They didn't directly use the correctness of the top result from k samples. However, it seems that alpha_i in equation (2) is sorted in a decreasing order, this would lead to a larger "Verifier@K" because sampling N times always have a better performance than sampling k times (when N > k). Therefore, the proposed calculation method is questionable.
Questions:
Can the authors show the result of "Verifier@K" computed by directly using the correctness of the top result from k samples? Otherwise, can the authors provide more justifications for equation (2) on why organzing alpha_i in a decreasing order?
The authors discuss a lot of self-improving work in related works, but most of the works need ground truth answer to filter out incorrect reasoning paths. I would suggest the authors to also include and discuss some works that simply use the model's own generations (without correction filtering) for self-improving, which could be adapted to broader settings where ground truth data is very limited:
[1] Large Language Models Can Self-Improve. Huang et al.
[2] Teaching Large Language Models to Self-Debug. Chen et al.
Though the authors are focusing on working with improving verifiers, it would still be interesting to have at least some discussions on how verifier-based methods can be applied to low-resource settings with limited ground truth annotations.
Limitations:
The authors mention that they encourage users to be cautious about possible misuse of LLM reasoning ability, but did not have further in depth analysis.



## Reponse: 

Thank you for your valuable feedback. We are glad that the reviewer finds our proposed method effective, our comparison against baselines clear, and our analysis interesting. 

> Please revise [the sentence with "we"] to make sure what part is the preliminary work, and what part is the author's proposed modification.

Thank you for pointing this out; we will edit the text as suggested. There is no modification done to STaR or RFT. 

> The authors proposed the metric "Verifier@K" using the probability of the correctness of the top result from N choose k samples. They didn't directly use the correctness of the top result from k samples. However, it seems that alpha_i in equation (2) is sorted in a decreasing order, this would lead to a larger "Verifier@K" because sampling N times always have a better performance than sampling k times (when N > k). Therefore, the proposed calculation method is questionable.

We respectfully disagree with the reviewer on this point. The proposed metric is intended to measure the performance of a model that draws $k$ samples (out of $N$, where $N\gg k$) and selects the one with highest verifier score. Such an evaluation could theoretically be done by Monte Carlo simulation (by taking many times $k$ samples, selecting the top one, and counting how often it is correct).

The sorting by $\alpha_i$ is simply needed to derive the formula (2), which allows computing this probability **in closed form, without simulation**. Note that a similar formula exists for Pass@k.

> Can the authors show the result of "Verifier@K" computed by directly using the correctness of the top result from k samples? Otherwise, can the authors provide more justifications for equation (2) on why organzing alpha_i in a decreasing order?

Please refer to [this figure](https://ibb.co/6F13F9P) for a comparison between computing verifier accuracy by sampling 64 candidate solutions multiple times (x-axis) and our proposed Verifier@k method. As it can be seen, computing verifier accuracy by sampling multiple times has a noisy mean (for small number of subsamples), high variance in general and is expensive to compute. However, Verifier@k is more compute efficient and has a very small variance.


> The authors discuss a lot of self-improving work in related works, but most of the works need ground truth answer to filter out incorrect reasoning paths. I would suggest the authors to also include and discuss some works that simply use the model's own generations (without correction filtering) for self-improving, which could be adapted to broader settings where ground truth data is very limited

Thank you for the references. We will discuss the connection between our work and the papers you suggested in the related works section.


> Though the authors are focusing on working with improving verifiers, it would still be interesting to have at least some discussions on how verifier-based methods can be applied to low-resource settings with limited ground truth annotations.
 
In this work we focus on utilizing correct and incorrect solutions discovered during the self-improvement process to train a verifier to judge correctness of model-generated solutions. **One of the motivations for our approach is precisely to avoid the need for human-annotated negative examples  (as required, e.g., by vanilla forms of DPO), reducing the data requirements.** We agree it would be interesting, in future work, to study the performance of V-STaR and other self-improvement methods in very-low-resource settings.

> The authors mention that they encourage users to be cautious about possible misuse of LLM reasoning ability, but did not have further in depth analysis.

Thank you for the comment. The misuse of LLM's reasoning abilities improved by V-STaR falls under the general misuse of LLMs' generative capabilities, such as manipulating public opinion, generation of take content, and unintended bias amplification. While we do not feel the proposed algorithm has a particular relevance to any of these areas, we are happy to expand on this topic in the impact statement.

___

_We hope that your concerns/questions have been addressed and, if so, we would appreciate it if you could reconsider your assessment. We'd be happy to engage in further discussions._

----------------------------------------


# R3 ckwK
Summary:
The paper proposes a variant of STaR to add a Verification model to improve the reasoning abilities of large language models (LLMs) through an iterative process of self-improvement and verification. The key idea is to utilize both the correct and incorrect solutions generated by the LLM during the self-improvement process to train a verifier model. The generator model is fine-tuned on the correct solutions, while the verifier is trained using Direct Preference Optimization (DPO) on pairs of correct and incorrect solutions. At inference time, the verifier ranks multiple candidate solutions from the generator and selects the best one.
The authors conduct experiments on math reasoning (GSM8K and MATH) and code generation (MBPP and HumanEval) tasks using LLaMA2 and CodeLLaMA models to show effectiveness of the proposed method comparing to baselines.
Strengths And Weaknesses:
Strengths:

The in-domain and out-of-domain experiments on the math and coding tasks looks promising.
The paper is well-written and organized, making it easy to follow the authors' methodology and experimental setup.

Weaknesses:
The paper is lack of novelty, given that the STaR and Verification are both existing work. The authors combined them together, making the contribution is not enough.

Although the experimental results show strong gain comparing to baselines, the training and inference times seem much longer than baselines, which may not be a piratical method to be used in the real world.

The paper only focus on benchmark tasks which have correct answers. However, in the real-world user cases, there may not be correct answers. I suggest conduct experiments on more general cases such as AlpacaEval [1] and utilize LLM-as-a-judge [2] to evaluate the performance.
Questions:
What is the training and inference time compared to baselines?
As I mentioned in the weaknesses, I want to know the performance of the proposed methods in real-world diverse generation tasks. I suggest using AlpaFarm to test the performance.
What is the performance gap compared to other general domain LLMs, e.g., Vicuna 7B, 13B, ChatGPT, GPT-4? I think it is important to compare the performance with open-sourced general domain models without special tuning to show the effectiveness and compare it with closed-sourced LLMs to understand the gap.
Limitations:
I suggest to discuss the limitation in
Scalability and Computational Costs: The iterative nature of V-STaR and the need for generating multiple candidate solutions and training both generator and verifier could make it computationally expensive, especially for larger models and datasets. The authors could address the scalability challenges and potential avenues for improving computational efficiency.
Generalization and Transfer Learning: While the authors evaluate transfer performance on MATH and HumanEval, they could provide more insights into the generalization capabilities of V-STaR to tasks and domains beyond those studied in the paper.

## Response

Thank you for your feedback. We are glad that the reviewer finds our paper well written and organized, our experiments design for both in-domain and out-of-domain settings promising.

> The paper is lack of novelty, given that the STaR and Verification are both existing work. The authors combined them together, making the contribution is not enough.

We want to emphasize our contribution: we propose V-STaR, that utilizes iteratively generated correct and incorrect solutions to train a better generator and verifier, resulting in significant gains over existing self-improvement and verification approaches. We also propose DPO for verifier training and find it to be more effective that the widely used classification based method by Cobbe et al. (2021) [1]. Finally, we propose a formula Verifier@K, to evlauate the performance of verifiers more reliably at tset time. 


> Although the experimental results show strong gain comparing to baselines, the training and inference times seem much longer than baselines, which may not be a piratical method to be used in the real world.

The training time of the generator of our method is the same as the generators in STaR$^\dagger$ and V-STaR [1 Iter]. The training time for the verifier in V-STaR is the same as the verification baseline. 

We would like to emphasize that at test time, V-STaR and verification baseline score all the candidate solutions in parallel. Our method, similar to Cobbe et al. (2021) [1] and Lightman et al. (2023) [2], trades off a bit of test-time compute for a significant boost in performance and accuracy. Notably, our 7B fine-tuned V-STaR model surpasses 70B (8-shot) LlaMA2 on GSM8K, and nearly matches 34B CodeLLaMA (zero-shot) on HumanEval. 

>I want to know the performance of the proposed methods in real-world diverse generation tasks. I suggest conduct experiments on more general cases such as AlpacaEval and utilize LLM-as-a-judge to evaluate the performance.

Thank you for your suggestions. However, AlpacaEval which is an automatic evaluator for chat models is not applicable to our setting. Our paper focuses on self-taught reasoners and utilizing both correct and incorrect self-generated solutions to improve performance. 

While this type of generalization (to real-world diverse tasks) could be made for any idea, to further evaluate the efficacy of our method we added CommonsenseQA (Talmore et al., 2019) [3] to our evaluation tasks. 

Please refer to [this figure](link) for the results on CommonsenseQA. 
....
These additional results show the robustness of our method across tasks.

> What is the training and inference time compared to baselines?

Training and inference time details are mentioned in the previous section (see above). 

Inference time of V-STaR (and verifier based baselines) is comparable to majority voting for baselines without a verifier, which is a widely used method in research.

> As I mentioned in the weaknesses, I want to know the performance of the proposed methods in real-world diverse generation tasks. I suggest using AlpaFarm to test the performance.

Thank you for your suggestion. We have addressed this in the previous sections. Please see above.

> What is the performance gap compared to other general domain LLMs, e.g., Vicuna 7B, 13B, ChatGPT, GPT-4?

| Model | Method | Acc |
| -------- | ------- | ------- |
| Vicuna 13B [4] | 4-shot | 7.62 |
| Vicuna 7B [5] | 5-shot | 8-19 |
| GPT-3.5 [6] | 8-shot | 57.1 |
| GPT-4 [6] | 8-shot | 92.0 |
| V-STaR 7B |  | 62.68 | 

> Scalability and Computational Costs

In general, verifier based methods trade off a modest amount test time compute for a significant improvment in performance. Please refer to the previous discussion about train and test time compute.

> Generalization and Transfer Learning: While the authors evaluate transfer performance on MATH and HumanEval, they could provide more insights into the generalization capabilities of V-STaR to tasks and domains beyond those studied in the paper.

Indeed, evaluating generalization across a wide spectrum of tasks and domains is an important aspect of assessing the robustness of any method. Our method focuses on self-taught reasoners for math reasoning and code generation, and we have evaluated our method on GSM8k, MATH, MBPP, HumanEval and CommonsenseQA. 

Respectfully, it's worth noting that the scope of any research endeavor is inherently constrained by practical limitations, resource constraints, time and complexity of tasks. Expanding the evaluation to encompass additional tasks and domains is an avenue for future exploration and can offer insights into the capabilities of V-STaR.


[1] Cobbe et al. (2021) Training Verifiers to Solve Math Word Problems
[2] Lightman et al. (2023) Let's Verify Step by Step
[3] Talmor et al. (2019) CommonsenseQA: A Question Answering Challenge Targeting Commonsense Knowledge
[4] Dutta et al. (2023) Frugal LMs Trained to Invoke Symbolic Solvers Achieve Parameter-Efficient Arithmetic Reasoning
[5] [https://huggingface.co/datasets/open-llm-leaderboard/details_lmsys__vicuna-7b-v1.5](https://huggingface.co/datasets/open-llm-leaderboard/details_lmsys__vicuna-7b-v1.5)
[6] Touvron et al. (2023) Llama 2: Open Foundation and Fine-Tuned Chat Models

___

_We hope that your concerns/questions have been addressed and, if so, we would appreciate it if you could reconsider your assessment. We'd be happy to engage in further discussions._

----------------------------------------------------------

# R4 y2W1
Summary:
This paper studies how to conduct self-improvement for LLM. The core idea is to conduct multi-iteration STaR-like training loop to collect reasoning traces with correct answers, use them to continually improve a policy model; in the meantime, some negative data are added into the pool, to eventually fine-tune a verifier via DPO. The results show improvement compared with previous StAR and RFT baselines.
Strengths And Weaknesses:
Strength:
This is one of the recent studies that utilize both positive and negative samples to conduct self-improvement (one concurrent work is self-rewarding LM), the main difference for this work is its emphasis on reward model (verifier), and this work shows that by keeply improving the language model quality, we can collect some higher-quality hard negative samples to train better verifier. (fig 5)
The approach is simple but sounds reasonable, and it beats some of the previous baselines like STaR and RFT.
Weakness:
Authors claim Verifier@k as one of contribution, but I think this is the same as Best-of-N that is widely used in literature? (like the one reported in Let's Verify Step by Step). Sec 4.4 shows a trick to estimate the results without repeating multiple times, which seems reasonable, but I think probably just call it fast estimation of Best@N repeating t times for different N?

The comparison is unfair. Currently the authors choose only STaR as the self-improvement baseline (for generator only), and their method's ablation (1st-iteration) as the verifier baseline. In the reported plot, they show the pass@1 for STaR, and verifier@64 (if I understand correctly, is sample 64 answers and pick the one with highest predicted score). This from my understanding is really unfair. We all know that with more samples, LLM can have higher chance to get correct results. For every comparison, you shall report the number with the same number of samples (or LLM token consumption). For example, you can run k times for STaR, and conduct self-consistency (and universal self-consistency for MBPP). The current Fig3 is misleading to me.
One of the major novelty in this paper is multi-iteration training, but the main evaluation curve Fig5 only show the comparison with a single iteration, also it's unclear to me whether the improvement is due to policy (generator)'s improvement or verifier improvement. Authors shall decouple these two, such as showing the Best@N curve using vanilla LM and Fine-tuned verifier (with different iteration), and report the finetuned policy (generator) performance (either under pass@K or self-consistency@K).
It looks like the policy training part is exactly the same as Rest_EM and STaR? (please correct me if I'm wrong) Probably the authors shall add this point during method.
Only Math (GSM8K and MATH) and Code (MBPP) problems are being evaluated. Can this method generalize to other general language tasks (e.g., MMLU & AlpacaEval)?
In short, I think this paper's idea is reasonable, and results are promising. However, some comparison are not very rigorous and can be potentially misleading. I would like to adjust the score if authors can provide fair comparison with existing baselines and show the multi-iteration training indeed provide improvement.
Questions:
The authors use DPO to fine-tune the verifier, why not using it to fine-tune policy model?
Can the authors show more qualitative examples of how the fine-tuned verifier can pick up incorrect samples? (For example, changing a correct trace by a few numbers like https://www.anthropic.com/news/measuring-faithfulness-in-chain-of-thought-reasoning)
Some studies show that after SFT, the pass@K results will get influenced (even though pass@1 improved), can the authors try reporting the results after self-training?
How is this self-improved verifier compared with the PRM trained from PRM800K? And how can this method generalize to step-wise verification / reward?
I think the fine-tuned verifier could probably improve the policy training, either on unlabelled data or picking better correct samples. Probably can discuss this potential?

## Response

We thank the reivewer for their insightful comments. We are glad that the reviewer likes our proposal of leveraging both positive and negative samples for self-improving the model. We are happy that the reviewer suggests our proposed method simple but reasonable. 

> Authors claim Verifier@k as one of contribution, but I think this is the same as Best-of-N that is widely used in literature? (like the one reported in Let's Verify Step by Step). Sec 4.4 shows a trick to estimate the results without repeating multiple times, which seems reasonable, but I think probably just call it fast estimation of Best@N repeating t times for different N?

??? Do we want to promise to rename Verifier@k to best-of-k?

The expected value of Verifier@k is the same as that of Best-of-k. The idea we propose is to estimate the curve of Verifier@k/Best-of-k for all $k$ simultaneously without taking $k$ samples from the generator for each $k$ (that is, the complexity of computing Verifier@k for $1\leq k\leq N$ becomes ${\cal O}(N)$, not ${\cal O}(N^2)$).

This curve is more informative than the single value, such as Best-of-500, reported by "Let's Verify Step by Step".


### Regarding comparisons:

To be clear, we compare our method against all the methods in Table 1. Specifically, we compare V-STaR against SFT, STaR, RFT and $\text{STaR}^{\dag}$ which is the same as Rest-EM (generator only).

We also compare our method against Verification which is the proposed method in Cobbe et al (2021) [1], and a non-iterative variant of V-STaR denoted as V-STaR [1 Iter]. In Figure 2 and Figure 3, we show that V-STaR significantly outperforms these prevalent self-improvement and verification based methods on math reasoning (GSM8K and MATH) and code generation (MBPP and HumanEval).

### Regarding fairness of comparisons
Pass@1 is reported for generator only models following Cobbe et al. (2021) [1] and Wang et al. (2023) [4] to name a few. As mentioned in Section 4.3, at inference, we generate 128 candidate solutions for each test problem from the generator. The Pass@1 estimates the probablity of producing a correct answer given 128 tries reliably. In verifier-based method, we take the solution with the highest probablity under the verifier from a pool of 64 solutions sampled from 128 (measured reliably with verifier@k formula).

Comparison with majority voting is fair and we already have this comparison in Figure 6. It was an oversight that we did not include it in the main plot. We will include it in the main figure. We appreciate this feedback.

We would like to mention that verifier ranking can complement majority voting as discussed in Cobbe et al. (2021) [1] section 5.1.


> One of the major novelty in this paper is multi-iteration training, but the main evaluation curve Fig5 only show the comparison with a single iteration, also it's unclear to me whether the improvement is due to policy (generator)'s improvement or verifier improvement. Authors shall decouple these two, such as showing the Best@N curve using vanilla LM and Fine-tuned verifier (with different iteration), and report the finetuned policy (generator) performance (either under pass@K or self-consistency@K).

The STaR$^\dagger$ baseline in the paper is the exact policy in V-STaR. Pass@1 of this policy is reported in Figures 2, 3 and 4, and its majority@k is reported in Figure 6 in the paper. These results show that adding our verifier trained with iterative data to this policy (i.e. V-STaR) results in improvements across multiple tasks.



> It looks like the policy training part is exactly the same as Rest_EM and STaR? (please correct me if I'm wrong) Probably the authors shall add this point during method.


Indeed. That is the rationale behind naming our method V-STaR. 


> Only Math (GSM8K and MATH) and Code (MBPP) problems are being evaluated. Can this method generalize to other general language tasks (e.g., MMLU & AlpacaEval)?

Typically research on Verifiers is done in math reasoning and coding domains [1,2,3,4]. In our paper, we focus on training verifiers for self-taught reasoners which are typically evaluated on math and coding settings. Figures 3 and 4 show our results for GSM8k and MATH for math reasoning, and MBPP and HumanEval for code generation. To further evaluate the efficacy of V-STaR, we added CommonsenseQA (Talmore et al., 2019) [5] to our benchmark. Please refer to this [figure]() for results on CommonsenseQA.

MMLU is a benchmark for the knowledge learned during pretraining and AlpacaEval is an automatic evaluator for chat models. They are not applicable to our setting. 


> The authors use DPO to fine-tune the verifier, why not using it to fine-tune policy model?

This is discussed in the paper. Please see section 4.9 and Figure 7.

> Can the authors show more qualitative examples of how the fine-tuned verifier can pick up incorrect samples?

Below is a query from GSM8k and two very similar candidate respones. The first one is chosen by V-STaR verifier, while the second one is ranked quite low due to the calculation mistake in the beginning of the rationale.

A robe takes 2 bolts of blue fiber and half that much white fiber. How many bolts in total does it take?

candidate response 1: "The robe takes 2*1/2=<<2*1/2=1>>1 bolt of white fiber.\nIt takes 2+1=<<2+1=3>>3 bolts in total.\n 3"

candidate response 2: "The robe takes 2*1.5=<<2*1.5=3>>3 bolts of white fiber\nSo it takes 2+3=<<2+3=5>>5 bolts total\n 5"

We will add a few examples like this in the appendix for qualitative analysis.

> Some studies show that after SFT, the pass@K results will get influenced (even though pass@1 improved), can the authors try reporting the results after self-training?

Please check [this](https://ibb.co/jkmLWbt) figure which shows the pass@k for the SFT model and the model after self-improvement (STaR$^\dagger$). 

> How is this self-improved verifier compared with the PRM trained from PRM800K? And how can this method generalize to step-wise verification / reward?

The process reward model (PRM) from [2] is trained with the PRM800K dataset which is **annotated by humans** for step-level correctness. Our work is focused on outcome reward models (ORM), and future work could focus on this type of comparison. Wang et al. (2023) [4] train a PRM verifier without human annotated data. We will update our related works section accordingly.

> I think the fine-tuned verifier could probably improve the policy training, either on unlabelled data or picking better correct samples. Probably can discuss this potential?

We actually tried this and reported observations in the paper. Please see section 4.6 in the paper.

In short, we tried to put the verifier in the training loop to filter correct solutions from the generator for the next training iteration. After running three iterations with verifier in the loop for MBPP we did not observe substantial gains for this task.

___

_We hope that your concerns/questions have been addressed and, if so, we would appreciate it if you could reconsider your assessment. We'd be happy to engage in further discussions.
_


[1] Cobbe et al. (2021) Training Verifiers to Solve Math Word Problems
[2] Lightman et al (2023) Let's Verify Step by Step
[3] Ni et al. (2023) LEVER: Learning to Verify Language-to-Code Generation with Execution
[4] Wang et al. (2023) Math-Shepherd: Verify and Reinforce LLMs Step-by-step without Human Annotations
[5] Talmor et al. (2019) CommonsenseQA: A Question Answering Challenge Targeting Commonsense Knowledge