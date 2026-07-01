# Visual Evidence Third-Person Smoke

Search token: `VISUAL_EVIDENCE_THIRD_PERSON_SMOKE_2026_06_13`.

Status: completed smoke record.

Purpose:

- verify that social-cycle visual evidence can use a third-person Prismarine
  viewer camera instead of the NPC eye view;
- verify that `--visual-evidence-interval 1` captures every completed cycle;
- keep the check on the deterministic provider path so no external LLM provider
  cost is involved.

Command:

```bash
cd probe
bun run probe:social-cycle -- \
  --actor npc_b \
  --provider deterministic-social \
  --model deterministic-social \
  --fresh-world \
  --world-scenario wooden-pickaxe-flat-benchmark-v1 \
  --cycles 1 \
  --max-actions-per-cycle 1 \
  --visual-evidence \
  --visual-evidence-interval 1 \
  --visual-evidence-camera third-person \
  --report ../tmp/visual-evidence-third-person-smoke.json
```

Result:

- run id: `social-cycle-e56284f9-c220-407f-996e-c8246a4f8ed5`;
- runtime status: `blocked` for the one-cycle deterministic gameplay smoke;
- provider usage: zero external provider requests;
- visual evidence: 3 captured screenshots, 0 capture failures;
- manifest camera mode: `third_person`;
- manifest interval: `1`.

The nonzero CLI exit came from the gameplay smoke status, not from visual
capture failure.

Artifacts:

- `report.json`
- `screenshots/initial-initial.png`
- `screenshots/cycle-0001-cycle-end.png`
- `screenshots/cycle-0001-final.png`
