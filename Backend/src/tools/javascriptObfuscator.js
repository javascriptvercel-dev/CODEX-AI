import JavaScriptObfuscator from "javascript-obfuscator";

export const OBFUSCATION_MODES = Object.freeze({
  easy: {
    compact: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    identifierNamesGenerator: "hexadecimal",
    simplify: true,
    stringArray: false,
  },
  medium: {
    compact: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    identifierNamesGenerator: "hexadecimal",
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 8,
    stringArray: true,
    stringArrayThreshold: 0.5,
  },
  hard: {
    compact: false,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.1,
    identifierNamesGenerator: "hexadecimal",
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayThreshold: 0.75,
  },
});

export function obfuscateJavaScript(code, mode) {
  const options = OBFUSCATION_MODES[mode];
  if (!options) throw new TypeError("Unsupported obfuscation mode.");
  return JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();
}
