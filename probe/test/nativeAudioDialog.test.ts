import { test } from "node:test";
import assert from "node:assert/strict";

import { extractNativeAudioDialogText } from "../src/provider/gemini/nativeAudioDialog.js";

test("native audio dialog keeps transcription and discards inline audio", () => {
  const extracted = extractNativeAudioDialogText({
    serverContent: {
      modelTurn: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/pcm;rate=24000",
              data: "AAA="
            }
          }
        ]
      },
      outputTranscription: {
        text: '{"ok":true}'
      },
      turnComplete: true
    }
  });

  assert.equal(extracted.transcriptionText, '{"ok":true}');
  assert.equal(extracted.audioChunksDiscarded, 1);
  assert.equal(extracted.inlineDataPartsIgnored, 1);
});

test("native audio dialog does not treat modelTurn text as assistant output", () => {
  const extracted = extractNativeAudioDialogText({
    serverContent: {
      modelTurn: {
        parts: [{ text: "should-not-use-this" }]
      },
      outputTranscription: {
        text: "use-transcription-only"
      }
    }
  });

  assert.equal(extracted.transcriptionText, "use-transcription-only");
  assert.equal(extracted.modelTextIgnored, true);
});
