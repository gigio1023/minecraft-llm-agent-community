# Goffman, interaction order, face, frames

- author: Erving Goffman. Primary works: *The Presentation of Self in Everyday
  Life* (1959); *Interaction Ritual* (1967, the "On Face-Work" essay); *Frame
  Analysis* (1974); "The Interaction Order" (ASA presidential address, *American
  Sociological Review* 1983).
- source used: WebSearch + reputable summaries (howcommunicationworks.com,
  uregina.ca sociology notes). Secondary for wording; "expressive order" quote is
  the standard attribution.

## Primary-source facts

- **Interaction order**: the domain of face-to-face co-presence has its own
  "invisible" norms governing encounters, semi-autonomous from macro structure.
- **Presentation of self / dramaturgy**: actors present a front-stage image to
  others while a back stage exists where the self is prepared; impression
  management is continuous.
- **Face**: the positive social value a person claims in an encounter; **face-
  work** is the management of social identity to keep conduct consistent with the
  face claimed. Goffman's **expressive order** "regulates the flow of events ...
  so that anything that appears to be expressed by them will be consistent with
  face."
- **Frames** (*Frame Analysis*): the schemata of interpretation that let
  participants answer "what is going on here?"

## Interpretation (labeled inference)

- Goffman is the theorist of *consistency between claim and conduct*, which is
  precisely what a Social WAM verifies in Minecraft. A "broken promise" is a
  face/expressive-order violation: the actor's stated commitment (chat) is
  contradicted by world evidence (no return, no repair). The repo's
  `fake_progress_rejected` and `failed_promise_v1` are Goffmanian face threats
  made physically verifiable.
- "Frames" maps onto the repo's scenario/issue framing: actors must share what the
  situation *is* (a loan vs a gift vs a theft), a frame mismatch is a measurable
  source of conflict.

## Mechanically useful vs research contribution

- Mechanically useful: a loggable **claim-vs-conduct consistency** check , 
  for every recorded commitment (chat promise, `request_accepted`,
  `ObligationLedgerEntry` with status `accepted`), verify whether later world
  evidence matches. Inconsistency is a face/trust-decrement event. This is the
  honest, world-grounded version of "saving face."
- Avoid / overclaim: do NOT claim the actor "felt embarrassment" or "lost face"
  as an internal state. The repo can record the *consistency violation* and the
  *trust/friction ledger update* it triggers, not an emotion.

## WAM layer(s) informed

- **Social WAM** (face, promise consistency, frame alignment, conflict from frame
  mismatch).
