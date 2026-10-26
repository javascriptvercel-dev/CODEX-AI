import postcss from "postcss";
import { minify as minifyJavaScript } from "terser";

const JAVASCRIPT_SYNTAX =
  /\b(?:async|await|class|const|export|function|import|let|new|require|return|throw|var)\b|=>/u;
const OTHER_LANGUAGE_SYNTAX = [
  ["TypeScript", /\b(?:interface|enum)\s+\w+|\btype\s+\w+\s*=|:\s*(?:string|number|boolean|any|unknown|void)\b/u],
  ["Python", /^\s*(?:def\s+\w+|class\s+\w+|from\s+\S+\s+import\b|import\s+\S+|print\s*\()/mu],
  ["SQL", /^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\b/imu],
  ["Java", /\b(?:public|private|protected)\s+(?:static\s+)?(?:class|interface|enum|void)\b/u],
  ["PHP", /<\?php\b/u],
  ["C++", /#include\s*[<"]|std::|int\s+main\s*\(/u],
  ["Go", /^\s*package\s+\w+|^\s*func\s+main\s*\(/mu],
  ["Rust", /^\s*fn\s+main\s*\(|\blet\s+mut\b|\buse\s+std::/mu],
];
const CSS_PROPERTIES = new Set([
  "align-items",
  "background",
  "background-color",
  "border",
  "border-radius",
  "bottom",
  "color",
  "display",
  "flex",
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "gap",
  "grid",
  "height",
  "justify-content",
  "left",
  "line-height",
  "margin",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "opacity",
  "overflow",
  "padding",
  "position",
  "right",
  "text-align",
  "text-decoration",
  "top",
  "transform",
  "transition",
  "width",
]);

function minifyCss(source) {
  const root = postcss.parse(source);
  root.walkComments((comment) => {
    if (!comment.text.startsWith("!")) comment.remove();
  });
  root.raws.before = "";
  root.raws.after = "";
  root.walk((node) => {
    if (node.nodes) node.raws.semicolon = false;
  });
  root.walkRules((rule) => {
    rule.selector = rule.selector.replace(/\s*,\s*/gu, ",");
    rule.raws.before = "";
    rule.raws.between = "";
    rule.raws.after = "";
  });
  root.walkAtRules((rule) => {
    rule.raws.before = "";
    rule.raws.afterName = rule.params ? " " : "";
    rule.raws.between = "";
    rule.raws.after = "";
  });
  root.walkDecls((declaration) => {
    declaration.raws.before = "";
    declaration.raws.between = ":";
  });
  return root.toString();
}

export function detectCodeLanguage(source) {
  const trimmed = source.trim();
  if (!trimmed) return "";

  try {
    JSON.parse(trimmed);
    return "JSON";
  } catch {
    // Continue checking other supported formats.
  }

  const otherLanguage = OTHER_LANGUAGE_SYNTAX.find(([, pattern]) => pattern.test(trimmed));
  if (otherLanguage) return otherLanguage[0];

  if (JAVASCRIPT_SYNTAX.test(trimmed)) return "JavaScript";

  try {
    const root = postcss.parse(trimmed);
    let hasKnownDeclaration = false;
    root.walkDecls((declaration) => {
      if (CSS_PROPERTIES.has(declaration.prop.toLowerCase()) || declaration.prop.startsWith("--")) {
        hasKnownDeclaration = true;
      }
    });
    const hasCssDirective = root.nodes.some(
      (node) => node.type === "atrule" && ["charset", "import", "namespace"].includes(node.name.toLowerCase()),
    );
    if (hasKnownDeclaration || hasCssDirective) {
      return "CSS";
    }
  } catch {
    // The input is not valid CSS.
  }

  return "Unknown";
}

export async function minifyCode(source, language) {
  if (language === "JSON") {
    return JSON.stringify(JSON.parse(source));
  }
  if (language === "JavaScript") {
    const result = await minifyJavaScript(source, {
      compress: false,
      mangle: false,
      format: { beautify: false },
    });
    if (!result.code) throw new Error("Could not produce minified JavaScript.");
    return result.code;
  }
  if (language === "CSS") return minifyCss(source);
  if (language && language !== "Unknown") {
    throw new Error(
      `${language} detected, but this minifier currently supports JavaScript, CSS, and JSON.`,
    );
  }
  throw new Error("Could not detect a supported language. Supported formats are JavaScript, CSS, and JSON.");
}

export function getMinifiedFilename(language) {
  const extensions = {
    CSS: "css",
    JavaScript: "js",
    JSON: "json",
  };
  return `minified.${extensions[language] || "txt"}`;
}
