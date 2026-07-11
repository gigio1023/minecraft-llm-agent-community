/** Contract tests for phenomenon-record/v1 writer, loader, and searchable index. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildPhenomenonCatalogIndexEntry,
  emptyPhenomenonCatalogIndex,
  loadPhenomenonRecordFromFile,
  preparePhenomenonRecordForWrite,
  searchPhenomenonCatalog,
  upsertPhenomenonCatalogIndexEntry,
  validatePhenomenonRecord,
  writePhenomenonRecord
} from "../src/benchmarks/phenomenon/index.js";
import type {
  PhenomenonRecordDraftV1,
  PhenomenonRecordV1
} from "../src/benchmarks/phenomenon/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(
  here,
  "../benchmarks/phenomenon/fixture-asymmetric-tool-share-v1.json"
);

function loadFixtureRecord(): PhenomenonRecordV1 {
  return loadPhenomenonRecordFromFile(fixturePath);
}

function asDraft(record: PhenomenonRecordV1): PhenomenonRecordDraftV1 {
  const { schema: _schema, status: _status, user_decision: _userDecision, ...rest } = record;
  return rest;
}

function withTempCatalog(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "phenomenon-catalog-"));
}

test("fixture phenomenon record loads and is labeled fixture not research", () => {
  const record = loadFixtureRecord();
  assert.equal(record.schema, "phenomenon-record/v1");
  assert.equal(record.record_kind, "fixture");
  assert.equal(record.is_research_result, false);
  assert.equal(record.status, "candidate");
  assert.match(record.title, /fixture/i);
  assert.match(record.pattern, /fixture/i);
  assert.match(record.pattern, /not a research result/i);
  assert.equal(record.observation_class, "boring");
  assert.equal(record.recurrence.numerator, 2);
  assert.equal(record.recurrence.denominator, 3);
  assert.ok(record.capability_refs.length >= 1);
  assert.ok(record.continuity_refs.length >= 1);
  assert.equal(record.alternative_explanations.length, 5);
});

test("writer defaults to candidate without reviewer_decision", () => {
  const draft = asDraft(loadFixtureRecord());
  const prepared = preparePhenomenonRecordForWrite({ record: draft });
  assert.equal(prepared.status, "candidate");
  assert.equal(prepared.user_decision, undefined);

  const catalogDir = withTempCatalog();
  const written = writePhenomenonRecord(catalogDir, { record: draft });
  assert.equal(written.record.status, "candidate");
  assert.equal(written.index.entries.length, 1);
  assert.equal(written.index.entries[0]?.phenomenon_id, draft.phenomenon_id);
  assert.equal(written.index.entries[0]?.observation_class, "boring");
  assert.ok(fs.existsSync(written.record_path));
  assert.ok(fs.existsSync(written.index_path));
});

test("selected_for_followup without reviewer_decision is rejected", () => {
  const draft = asDraft(loadFixtureRecord());
  assert.throws(
    () =>
      preparePhenomenonRecordForWrite({
        record: { ...draft, status: "selected_for_followup" }
      }),
    /reviewer_decision/
  );
});

test("selected_for_followup requires explicit reviewer_decision from user or delegated reviewer", () => {
  const draft = asDraft(loadFixtureRecord());
  const prepared = preparePhenomenonRecordForWrite({
    record: draft,
    reviewer_decision: {
      reviewer_role: "delegated_reviewer",
      decision: "select_for_followup",
      rationale: "Synthetic promotion for writer contract test only.",
      decided_at: "2026-07-11T00:00:00.000Z"
    }
  });
  assert.equal(prepared.status, "selected_for_followup");
  assert.equal(prepared.user_decision?.decided_by, "delegated_reviewer");
  assert.match(prepared.user_decision?.rationale ?? "", /Synthetic promotion/);
});

test("retired candidates remain writable and searchable", () => {
  const draft = asDraft(loadFixtureRecord());
  const catalogDir = withTempCatalog();
  const written = writePhenomenonRecord(catalogDir, {
    record: {
      ...draft,
      phenomenon_id: "fixture-retired-boring-v1",
      title: "[FIXTURE] Retired boring candidate (not a research result)",
      observation_class: "negative"
    },
    reviewer_decision: {
      reviewer_role: "user",
      decision: "retire",
      rationale: "Fixture retirement to verify negative/retired catalog retention.",
      decided_at: "2026-07-11T00:00:00.000Z"
    }
  });
  assert.equal(written.record.status, "retired");
  assert.equal(written.record.observation_class, "negative");

  const found = searchPhenomenonCatalog(written.index, {
    status: "retired",
    include_retired: true,
    include_negative_or_boring: true
  });
  assert.equal(found.length, 1);
  assert.equal(found[0]?.phenomenon_id, "fixture-retired-boring-v1");

  const excluded = searchPhenomenonCatalog(written.index, { include_retired: false });
  assert.equal(excluded.length, 0);
});

test("rejects single-quote-only recurrence without denominator", () => {
  const base = loadFixtureRecord();

  const missingDenominator = validatePhenomenonRecord({
    ...base,
    recurrence: {
      numerator: 1
    }
  });
  assert.equal(missingDenominator.ok, false);
  if (!missingDenominator.ok) {
    assert.ok(
      missingDenominator.errors.some((error) => /denominator/i.test(error)),
      missingDenominator.errors.join("; ")
    );
  }

  const quoteString = validatePhenomenonRecord({
    ...base,
    recurrence: "actor said please share the axe"
  });
  assert.equal(quoteString.ok, false);
  if (!quoteString.ok) {
    assert.ok(
      quoteString.errors.some((error) => /quote|denominator|numerator/i.test(error)),
      quoteString.errors.join("; ")
    );
  }

  const forbiddenKey = validatePhenomenonRecord({
    ...base,
    transcript_quote: "please share"
  });
  assert.equal(forbiddenKey.ok, false);
  if (!forbiddenKey.ok) {
    assert.ok(
      forbiddenKey.errors.some((error) => /transcript_quote|recurrence/i.test(error)),
      forbiddenKey.errors.join("; ")
    );
  }
});

test("searchable index retains fixture and filters by scenario/text", () => {
  const record = loadFixtureRecord();
  let index = emptyPhenomenonCatalogIndex("2026-07-11T00:00:00.000Z");
  index = upsertPhenomenonCatalogIndexEntry(
    index,
    buildPhenomenonCatalogIndexEntry(record, "fixture-asymmetric-tool-share-v1.json"),
    "2026-07-11T00:00:00.000Z"
  );

  const byScenario = searchPhenomenonCatalog(index, {
    scenario_id: "asymmetric-tool-access-minimal-v1"
  });
  assert.equal(byScenario.length, 1);

  const byText = searchPhenomenonCatalog(index, { text: "tool share" });
  assert.equal(byText.length, 1);

  const withoutFixtures = searchPhenomenonCatalog(index, { include_fixtures: false });
  assert.equal(withoutFixtures.length, 0);

  const boring = searchPhenomenonCatalog(index, { observation_class: "boring" });
  assert.equal(boring.length, 1);
});

test("fixture claiming is_research_result true is rejected", () => {
  const base = loadFixtureRecord();
  const result = validatePhenomenonRecord({
    ...base,
    is_research_result: true
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => /research result|fixture/i.test(error)));
  }
});
