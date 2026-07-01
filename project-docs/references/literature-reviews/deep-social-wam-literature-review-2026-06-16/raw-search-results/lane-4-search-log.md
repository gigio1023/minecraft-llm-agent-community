# Lane 4 Search Log, Sociology / Social Theory Grounding

Lane 4 (N=4). Date: 2026-06-16 (`Asia/Seoul`). Channels: Hugging Face CLI
(`hf`, authenticated as `naem1023`) for computational-sociology papers; WebSearch
/ WebFetch for canonical theory (Stanford Encyclopedia of Philosophy, Ostrom
Workshop, primary-text references).

Note on this lane: most canonical sociology anchors (Weber, Goffman, Homans,
Blau, Coleman, Granovetter, North, Ostrom, Bicchieri, Elster, Nelson & Winter)
are books / pre-arXiv journal articles, so the primary discovery channel for them
is the web (SEP + reputable secondary catalogs), not `hf papers`. `hf papers` was
used to find the *computational* operationalizations (norm emergence, LLM
commons governance, generative social agents) that show how these theories have
already been turned into measurable agent variables.

## Hugging Face CLI, computational-sociology discovery

```
# norm emergence / LLM social norms
hf papers search "social norm emergence multi-agent" --limit 12
hf papers search "LLM agents social norms conventions" --limit 12
# social exchange / reputation / reciprocity
hf papers search "reputation reciprocity cooperation agents simulation" --limit 10
# commons governance / social dilemma (Ostrom-adjacent)
hf papers search "commons governance social dilemma reinforcement learning" --limit 10
# generative agents / social capital / trust
hf papers search "generative agents social capital trust simulation" --limit 10
# emergent roles / division of labor
hf papers search "emergent role specialization division of labor multi-agent" --limit 10
```

Strongest computational hits (read in depth via `hf papers read`):

```
hf papers read 2404.16698   # GovSim: Ostrom-grounded common-pool-resource LLM sim
hf papers read 2106.09012   # social norms from public sanctions (Classifier Norm Model)
```

Other relevant computational candidates recorded to manifest (abstract-level):
2510.14401 (social learning + collective norm formation in LLM agents),
2412.10270 (cultural evolution of cooperation among LLM agents),
2404.02491 (Measuring Social Norms of LLMs), 2606.14600 (LoSoNA local-norm
adaptation benchmark), 2304.03442 (Generative Agents), 2502.08691
(AgentSociety), 2606.02859 (Economy of Minds, economic interactions),
2011.00620 (Social Chemistry 101 norm reasoning).

## Web, canonical theory anchors

```
WebSearch "Ostrom IAD framework ... action situation rules-in-use eight design principles commons"
WebFetch  https://en.wikipedia.org/wiki/Institutional_analysis_and_development_framework   # rule taxonomy (thin)
WebFetch  https://plato.stanford.edu/entries/social-norms/        # Bicchieri empirical/normative expectations; Elster
WebSearch "Ostrom eight design principles long-enduring common-pool resource ..."
WebFetch  https://www.agrariantrust.org/ostroms-eight-design-principles-for-a-successfully-managed-commons/  # 8 principles wording
WebFetch  https://plato.stanford.edu/entries/social-institutions/  # North/Weber/roles/sanctions/collective-acceptance
WebSearch "Granovetter strength of weak ties 1973 / embeddedness 1985"
WebSearch "Goffman interaction order / Blau exchange and power / Homans elementary social behavior"
WebSearch "Coleman 1988 social capital ... obligations expectations information channels norms; Coleman's boat"
WebSearch "Weber social action ... four types instrumentally rational value-rational affectual traditional"
WebSearch "Nelson Winter 1982 organizational routines ... March Simon bounded rationality"
```

Failed / blocked fetches (recorded for honesty, did not fabricate around them):

- `WebFetch gpde.direito.ufmg.br/.../Ostrom-2011-Policy_Studies_Journal.pdf`, TLS
  cert error ("unable to verify the first certificate"). Used Ostrom Workshop +
  SEP + Wikipedia + agrariantrust instead for IAD components and design principles.
- `WebFetch ostromworkshop.indiana.edu/.../iad-framework/index.html`, HTTP 503.
- `WebFetch wiki.p2pfoundation.net/Eight_Design_Principles...`, HTTP 403. Got the
  eight principles from agrariantrust.org (paraphrased wording; flagged as such).

## Reproducibility note

Theory anchors are claim-faithful to widely cited primary works; where I relied
on a secondary catalog (not the original book) I label the source as secondary in
the by-paper notes and matrix. GovSim (2404.16698) and the public-sanctions norm
model (2106.09012) are reproducible/partial (open-source sim + standard MARL
methods, respectively).
