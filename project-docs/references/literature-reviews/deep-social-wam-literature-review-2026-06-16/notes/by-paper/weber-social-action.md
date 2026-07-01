# Weber, social action

- author: Max Weber. Primary work: *Economy and Society* (*Wirtschaft und
  Gesellschaft*, 1922; Eng. ed. 1978, UC Press).
- source used: WebSearch over Wikipedia "Social action" + reputable summaries;
  the definitional sentence is the standard translated quotation. Secondary
  paraphrase of the four ideal types.

## Primary-source facts

- Definition: "Action is 'social' insofar as its subjective meaning takes account
  of the behavior of others and is thereby oriented in its course." Action carries
  a *subjective meaning* the actor attaches to it (overt or covert, including
  omission/acquiescence).
- Four ideal types of social action: (1) instrumentally-rational (zweckrational,
  efficient goal-seeking given expectations about others); (2) value-rational
  (wertrational, oriented to an absolute value for its own sake); (3) affectual
  (driven by emotion); (4) traditional (habitual, "we have always done it this
  way").

## Interpretation (labeled inference)

- Weber gives the *demarcation* this whole project needs: social behavior is
  action oriented toward others, not action that merely contains dialogue. The
  repo's frame already adopts this ("define social behavior as action whose
  meaning and consequence are oriented toward other actors"). The operational
  test for "is this action social?" is: does it have a recorded other-actor
  target or other-actor-affecting consequence?

## Mechanically useful vs research contribution

- Mechanically useful: a binary, loggable `is_other_oriented` flag derivable from
  evidence, an action is social iff it names another actor (request/lend/refuse)
  OR its verified delta changes another actor's options (a placed
  `public affordance`, a taken `weak commons` item). This separates genuine
  social actions from solo inventory grinding (echoing the repo's
  `social-plausibility-gate`).
- Avoid / overclaim: "subjective meaning" is internal and unobservable. The repo
  may classify *orientation* from evidence (target/consequence) but may NOT assert
  the actor's inner meaning or which of Weber's four motive types drove it.

## WAM layer(s) informed

- **Social WAM** (the definition of what counts as a social action at all).
