# Mead & Blumer, symbolic interactionism

- authors: George H. Mead (*Mind, Self and Society*, 1934, Univ. Chicago Press,
  posthumous); Herbert Blumer (*Symbolic Interactionism: Perspective and Method*,
  1969, Prentice-Hall, who named and codified the school).
- source used: WebSearch + standard summaries (SEP "symbolic interactionism"
  referenced). Secondary for exact wording.

## Primary-source facts

- Blumer's three premises: (1) people act toward things on the basis of the
  *meanings* those things have for them; (2) meanings arise out of *social
  interaction*; (3) meanings are handled and modified through an *interpretive
  process* the actor uses in dealing with the things encountered.
- Mead: the self emerges through taking the role of the other; meaning is not
  intrinsic to an object but is constituted in the response it calls out in
  interaction (the gesture-response-meaning triad).

## Interpretation (labeled inference)

- This is the theory that warns the project hardest: the *meaning* of a Minecraft
  act (is depositing logs a gift, a payment, a claim, or storage?) is not in the
  act itself; it is negotiated in interaction. A Social WAM cannot read meaning
  off a single inventory delta, it must read the surrounding request/response
  sequence and prior history.
- The repo's existing rule ("`npc_b` collects logs for itself -> no social event;
  `npc_b` deposits into shared storage -> `shared_storage_updated`") is exactly an
  interactionist judgment: the same physical act (gaining/moving logs) gets a
  different social meaning from its interactional context.

## Mechanically useful vs research contribution

- Mechanically useful: never assign social meaning to a lone physical delta;
  require an interaction context (a preceding `request_made` / chat reference /
  prior obligation) before tagging a delta as a gift, repayment, or claim. This is
  a concrete logging discipline: a transfer event should carry a `context_ref` to
  the request/promise it answers.
- Avoid / overclaim: do NOT infer "the actor understood the gesture as X." Meaning-
  attribution is interpretive and unverifiable. The repo can record the
  *interaction sequence* and the *most consistent meaning given history*, labeled
  as an inference, not a fact about either actor's mind.

## WAM layer(s) informed

- **Social WAM** (meaning of social acts is interaction-dependent, not intrinsic).
