"use client";
import { useState } from "react";
import {
  Wand2,
  ChevronDown,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  TriangleAlert,
} from "lucide-react";
import Switch from "@/components/ui/Switch";
function buildScript({
  name,
  number,
  session,
  botname,
  prefix,
  mode,
  autoread,
  autostatus,
}) {
  return `const { spawnSync } = require('child_process');const fs = require('fs');const path = require('path');const ROOT = process.cwd();const STAGE = path.join(ROOT, '.codex-bootstrap');const SOURCE = {  url: 'https://github.com/codexverified/CODEX-AI.git',  branch: 'main'};const KEEP_LOCAL = new Set([  '.env',  'config.env',  'database',  'node_modules',  'plugins',  'session']);function codexConfig() {  const ownerNumber = '${number}'.replace(/\\D/g, '');  return {    botName: '${botname}',    prefix: '${prefix}',    owner: {      name: '${name}',      number: \`\${ownerNumber}@s.whatsapp.net\`    },    mods: [],    sudo: [],    mode: '${mode}',    autoTyping: true,    autoRecording: false,    autoRead: ${autoread},    alwaysOnline: false,    statusView: { enabled: ${autostatus} },    statusReact: { enabled: true, emoji: '👀' },    sessionId: '${session}',    antiCall: true,    antiLink: { enabled: true, action: 'warn', maxWarns: 3 },    antiSpam: { enabled: true, action: 'warn', maxWarns: 3, limit: 5, cooldown: 10000 },    antiBot: { enabled: true, action: 'kick', maxWarns: 1 },    antiTag: { enabled: true, action: 'warn', maxWarns: 3 },    antiGame: { enabled: false, action: 'warn', maxWarns: 3 },    antiGroupMention: { enabled: false, action: 'warn', maxWarns: 3 },    antiDelete: { enabled: false, forwardTo: 'dm' },    antiEdit: { enabled: false, forwardTo: 'dm' },    mentionReact: { enabled: false, emoji: '❤️' },    autoReact: { enabled: false, emoji: '❤️' },    welcome: true,    goodbye: true,    sessionName: 'session',    STICKER_PACKNAME: '${botname}',    STICKER_AUTHOR: '${name}'  };}function run(bin, args, options = {}) {  const result = spawnSync(bin, args, {    cwd: options.cwd || ROOT,    stdio: 'inherit',    shell: false  });  if (result.error) throw result.error;  if (result.status !== 0) {    throw new Error(\`\${bin} \${args.join(' ')} failed with exit code \${result.status}\`);  }}function resetStage() {  fs.rmSync(STAGE, { recursive: true, force: true });  fs.mkdirSync(STAGE, { recursive: true });}function pullFreshSource() {  run('git', ['clone', '--depth', '1', '--branch', SOURCE.branch, SOURCE.url, STAGE]);  fs.rmSync(path.join(STAGE, '.git'), { recursive: true, force: true });}function syncProjectFiles() {  for (const name of fs.readdirSync(STAGE)) {    if (KEEP_LOCAL.has(name)) continue;    const incoming = path.join(STAGE, name);    const target = path.join(ROOT, name);    fs.rmSync(target, { recursive: true, force: true });    fs.renameSync(incoming, target);  }}function writeCodexConfig() {  const configPath = path.join(ROOT, 'config.json');  fs.writeFileSync(configPath, JSON.stringify(codexConfig(), null, 2));}function ensureRuntimeFolders() {  for (const dir of ['database', 'plugins', 'session']) {    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });  }}function bootstrap() {  console.log('Preparing CODEX-AI source...');  resetStage();  pullFreshSource();  console.log('Syncing project files...');  syncProjectFiles();  fs.rmSync(STAGE, { recursive: true, force: true });  console.log('Writing Codex config...');  writeCodexConfig();  ensureRuntimeFolders();  console.log('Installing dependencies...');  run('npm', ['install']);  console.log('Launching CODEX-AI...');  run('npm', ['start']);}try {  bootstrap();} catch (error) {  fs.rmSync(STAGE, { recursive: true, force: true });  console.error(\`CODEX-AI setup failed: \${error.message}\`);  process.exit(1);}`;
}
export default function GenerateConsole() {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [session, setSession] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [botname, setBotname] = useState("");
  const [prefix, setPrefix] = useState("");
  const [publicMode, setPublicMode] = useState(true);
  const [autoread, setAutoread] = useState(true);
  const [autostatus, setAutostatus] = useState(false);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const canGenerate = name.trim().length > 0 && number.trim().length > 0;
  const generate = () => {
    if (!canGenerate) return;
    setCode(
      buildScript({
        name: name.trim() || "USER",
        number: number.trim(),
        session: session.trim(),
        botname: botname.trim() || "CODEX AI",
        prefix: prefix.trim() || ".",
        mode: publicMode ? "public" : "private",
        autoread: autoread ? "true" : "false",
        autostatus: autostatus ? "true" : "false",
      }),
    );
  };
  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const downloadCode = () => {
    if (!code) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    a.download = "index.js";
    a.click();
  };
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-edge bg-surface p-6 sm:p-8">
      
      <div className="mb-5 flex items-center gap-2.5">
        
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          
          <Wand2 size={17} />
        </span>
        <div>
          
          <h2 className="font-display text-base font-bold">
            Generate index.js
          </h2>
          <p className="text-xs text-muted">
            Build a bootstrap script for your bot
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        
        <label className="flex flex-col gap-1.5 text-sm">
          
          <span className="font-medium">
            
            Your Name <span className="text-azure-500">*</span>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CODEX"
            className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          
          <span className="font-medium">
            
            WhatsApp Number <span className="text-azure-500">*</span>
          </span>
          <input
            type="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 2347019135989"
            className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
          />
        </label>
      </div>
      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        
        <span className="font-medium">Session ID</span>
        <input
          value={session}
          onChange={(e) => setSession(e.target.value)}
          placeholder="Optional — paste it here, or leave blank to set it up later"
          spellCheck={false}
          className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 font-mono text-xs outline-none placeholder:text-muted/70"
        />
      </label>
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="focus-ring mt-4 flex w-full items-center justify-between rounded-lg border border-edge bg-surface2 px-3.5 py-2.5 text-sm font-medium transition hover:border-azure-500/40"
      >
        
        <span>Advanced Options</span>
        <ChevronDown
          size={15}
          className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${showAdvanced ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        
        <div className="flex flex-col gap-4 overflow-hidden">
          
          <div className="grid gap-4 sm:grid-cols-2">
            
            <label className="flex flex-col gap-1.5 text-sm">
              
              <span className="font-medium">Bot Name</span>
              <input
                value={botname}
                onChange={(e) => setBotname(e.target.value)}
                placeholder="CODEX AI"
                className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              
              <span className="font-medium">Command Prefix</span>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder=". or /"
                className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>
          </div>
          <ToggleRow
            label="Bot Mode"
            hint={
              publicMode
                ? "Public — anyone can use commands"
                : "Private — owner only"
            }
            checked={publicMode}
            onChange={setPublicMode}
          />
          <ToggleRow
            label="Auto Read Messages"
            hint="Marks incoming messages as read"
            checked={autoread}
            onChange={setAutoread}
          />
          <ToggleRow
            label="Auto View Statuses"
            hint="Automatically views WhatsApp statuses"
            checked={autostatus}
            onChange={setAutostatus}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={!canGenerate}
        className="focus-ring mt-5 flex w-full items-center justify-center rounded-lg bg-azure-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-azure-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
      >
        
        <span className="inline-flex items-center gap-2">
          
          <Wand2 size={15} /> Generate index.js
        </span>
      </button>
      <div className="mt-4 overflow-hidden rounded-xl border border-edge">
        
        <div className="flex items-center justify-between border-b border-edge bg-surface2 px-3.5 py-2">
          
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            
            <FileCode2 size={13} /> index.js
          </span>
          <div className="flex gap-1.5">
            
            {code && (
              <button
                type="button"
                onClick={downloadCode}
                className="focus-ring flex items-center gap-1 rounded-md border border-edge bg-surface px-2.5 py-1 text-[11px] font-semibold transition hover:border-azure-500/60"
              >
                
                <Download size={12} /> Save
              </button>
            )}
            <button
              type="button"
              onClick={copyCode}
              disabled={!code}
              className="focus-ring flex items-center gap-1 rounded-md border border-edge bg-surface px-2.5 py-1 text-[11px] font-semibold transition hover:border-azure-500/60 disabled:opacity-50"
            >
              
              {copied ? (
                <Check size={12} className="text-green-400" />
              ) : (
                <Copy size={12} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="max-h-[320px] overflow-auto bg-ink-950 p-4">
          
          {code ? (
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-azure-300">
              {code}
            </pre>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              
              <FileCode2 size={22} className="text-muted" />
              <p className="text-xs text-muted">
                
                Fill in your details above, then click
                <strong className="text-fg">Generate index.js</strong>
              </p>
            </div>
          )}
        </div>
      </div>
      {code && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-azure-500/25 bg-azure-500/5 px-3.5 py-2.5 text-xs text-azure-300">
          
          <Terminal size={13} />
          <code className="font-mono">node index.js</code>
          <span className="text-muted">Save the file and run this.</span>
        </div>
      )}
    </div>
  );
}
function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-edge bg-surface2 px-3.5 py-2.5">
      
      <div>
        
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}
