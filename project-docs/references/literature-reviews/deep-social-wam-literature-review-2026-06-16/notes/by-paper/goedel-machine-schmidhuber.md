# Goedel Machine - Schmidhuber 2003/2006 (the canonical reference)

- **title**: Goedel Machines: Self-Referential Universal Problem Solvers Making Provably Optimal Self-Improvements
- **authors**: Juergen Schmidhuber (IDSIA; TU Munich)
- **year**: 2003 (v1, 25 Sep 2003); the canonical citable version is v5, December 2006 (TR IDSIA-19-03), also published in "Adaptive Agents and Multi-Agent Systems II" (LNCS 3394, 2005) and "Artificial General Intelligence" (Springer, 2006)
- **venue/source**: arXiv preprint cs.LO/0309048 + book chapters
- **arxiv_id**: cs/0309048
- **urls**: paper https://arxiv.org/abs/cs/0309048 ; code/data N/A (a theoretical construction, not an implementation)
- **source availability**: latex (extracted gm6.tex, 2138 lines, deep-read)

Note on the seed: lane brief said "Goedel machine (Schmidhuber, ~2003): find the canonical reference; verify." Verified: cs/0309048 is it. There is no separate "real" arXiv id; this is the canonical one, last revised 2006.

## Primary-source facts (LaTeX-verified)

- **The claim**: "the first class of mathematically rigorous, general, fully self-referential, self-improving, optimally efficient problem solvers" (abstract, gm6.tex:85-96).
- **The mechanism (Basic Idea, gm6.tex:334-382)**: the machine is loaded with self-modifying code `p`. `p(1)` contains (i) a problem-solving subroutine `e(1)` (e.g. any traditional RL algorithm) and (ii) a general proof-searcher subroutine that systematically constructs pairs `(switchprog, proof)` until it finds a *proof* of a target theorem stating: "the immediate rewrite of p through the current program switchprog implies higher utility than leaving p as is." Only then does it execute `switchprog`, which may rewrite any part of `p`, including the proof searcher itself.
- **The utility function, hardware, and entire initial code are described by axioms** encoded in an initial axiomatic system `A`, which is itself part of the initial code. The proof searcher tests computable *proof techniques* (programs whose outputs are proofs).
- **Global Optimality Theorem (gm6.tex:972-1029)**: the self-improvement strategy is provably *not* greedy. Because the utility of "leaving p as is" implicitly evaluates all possible alternative `switchprog`s that an unmodified `p` might find later, the first provably useful self-rewrite the searcher accepts is globally optimal: "no local maxima," because the code first had to prove it is not useful to continue searching for alternatives. The proof assumes consistency of the axiom system `A`.
- **Order-optimality (abstract)**: unlike Hutter's earlier non-self-referential hardwired-proof-searcher methods (AIXI(t,l), HSEARCH), the Goedel machine can optimally reduce constant-factor slowdowns hidden by O()-notation, *provided the utility of such speed-ups is provable*.

### Limitations stated by the paper itself (gm6.tex:418-447), the load-bearing honesty content

- **Goedel-incompleteness bound**: "Any formal system that encompasses arithmetics (or ZFC etc) is either flawed or allows for unprovable but true statements. Hence even a Goedel machine with unlimited computational resources must ignore those self-improvements whose effectiveness it cannot prove, e.g., for lack of sufficiently powerful axioms in A."
- **Pathological cases exist**: "one can construct pathological examples of environments and utility functions that make it impossible for the machine to ever prove a target theorem." (Compare Blum's speed-up theorem, incomputable predicates.)
- **Resource bound**: a realistic Goedel machine with limited resources "cannot profit from self-improvements whose usefulness it cannot prove within its time and space constraints."
- **No implementation**: the paper is a mathematical construction. The proof search is asymptotically optimal but practically intractable (the searcher must find a *proof*, an undecidable search in general).

## Interpretation (flagged as inference)

- This is the strongest formal statement of what "a system improves itself" can mean: a self-rewrite gated by a *proof of utility*, with a theorem that the first accepted rewrite is global-optimal. It is the asymptote against which every empirical "self-improvement" system should be measured, and it shows the asymptote is provably unreachable in general (incompleteness + intractable proof search).
- The proof-gate is the formal ancestor of this repo's "the runtime owns truth; the LLM proposes" rule. The Goedel machine never rewrites itself on a hunch; it rewrites only on a *proof*. Modern LLM self-improvers (see goedel-agent, STOP) replace the proof with an empirical check or LLM judgment, which is strictly weaker and reintroduces exactly the gameability the proof-gate ruled out.
- For the autoresearch thesis, the Goedel machine marks the ceiling and the reason the ceiling is unreachable: an unbounded, provably-correct recursive self-improver is a theoretical object, not an engineering target. Anything the repo builds is at best one or two verifier-gated rounds, not Goedel-machine recursion. Framing repo work as "recursive self-improvement" toward an intelligence explosion is unsupported and out of scope.

## Mechanically useful vs research contribution

- **Mechanically useful**: almost nothing is directly implementable (it is a theory). What transfers is the *design principle*: gate any self-modification on an external check that the modification is beneficial, and make the check authoritative over the proposer. The repo already does the weaker, practical version (the runtime verifier gates whether an action/skill is accepted).
- **Not a contribution to claim**: the repo cannot and should not claim a Goedel-machine-style provably-optimal self-improver. The honest framing is: the repo runs a bounded, verifier-gated improvement loop, which is to the Goedel machine what a unit test is to a correctness proof - useful, far weaker, and not the same kind of guarantee.
- **The honest bound this paper supplies for lane I6**: even with unlimited compute and a perfect prover, a self-improver must ignore improvements it cannot prove useful. With a *learned* or *LLM* judge instead of a prover, "cannot prove useful" becomes "the judge can be fooled," which is the progress-laundering / reward-hacking failure documented empirically elsewhere (DGM node 114; Socratic Learning's feedback condition).

## WAM layer(s) informed

Method-level, cross-layer, and primarily a bound. It informs how (and how much) any layer's predictor/policy could be self-improved: the answer from theory is "only as far as an authoritative, hard-to-game check can certify," which is strongest at the Physical/Material layers where the runtime verifier is near-unbiased.
