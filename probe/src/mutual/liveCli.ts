import { runLiveDialogueProbe } from "./runLiveDialogueProbe.js";

// Live dialogue uses provider auth and a real server path; the CLI prints only
// the transcript path so tokens and prompts stay in structured artifacts.
const result = await runLiveDialogueProbe();
console.log(result.transcriptPath);
