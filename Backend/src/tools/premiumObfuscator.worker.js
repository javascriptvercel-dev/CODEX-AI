import { parentPort, workerData } from "node:worker_threads";
import { obfuscateJavaScript } from "./javascriptObfuscator.js";

try {
  parentPort.postMessage({
    code: obfuscateJavaScript(workerData.source, workerData.mode),
  });
} catch (error) {
  parentPort.postMessage({ error: error.message || "JavaScript obfuscation failed." });
}
