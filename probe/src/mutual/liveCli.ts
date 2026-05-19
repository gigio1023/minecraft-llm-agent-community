import { runLiveDialogueProbe } from "./runLiveDialogueProbe.js";

const result = await runLiveDialogueProbe();
console.log(result.transcriptPath);
