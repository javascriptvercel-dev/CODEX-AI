"use client";

import { useMemo, useState } from "react";
import { Type } from "lucide-react";
import { TOOL_CARD_CLASS, TOOL_INPUT_CLASS, TOOL_LABEL_CLASS, ToolFrame } from "./ToolFrame";

const EMPTY_STATS = {
  characters: 0,
  charactersNoSpaces: 0,
  words: 0,
  sentences: 0,
  paragraphs: 0,
  readingMinutes: 0,
};

function analyzeText(value) {
  const characters = Array.from(value).length;
  const words = value.match(/\S+/gu)?.length || 0;
  const sentences = value.trim()
    ? (value.match(/[.!?]+(?=\s|$)/gu) || []).length || 1
    : 0;
  const paragraphs = value.trim()
    ? value.trim().split(/\r?\n\s*\r?\n/u).filter(Boolean).length
    : 0;
  return {
    characters,
    charactersNoSpaces: Array.from(value).filter((char) => !/\s/u.test(char)).length,
    words,
    sentences,
    paragraphs,
    readingMinutes: words ? Math.max(1, Math.ceil(words / 225)) : 0,
  };
}

export default function CharacterCounter() {
  const [text, setText] = useState("");
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limit, setLimit] = useState(280);
  const stats = useMemo(() => (text ? analyzeText(text) : EMPTY_STATS), [text]);
  const topLetters = useMemo(() => {
    const counts = new Map();
    for (const char of text.toLocaleLowerCase()) {
      if (/\p{L}/u.test(char)) counts.set(char, (counts.get(char) || 0) + 1);
    }
    return Array.from(counts, ([letter, count]) => ({ letter, count }))
      .sort((a, b) => b.count - a.count || a.letter.localeCompare(b.letter))
      .slice(0, 8);
  }, [text]);
  const progress = limitEnabled && limit > 0
    ? Math.min(100, (stats.characters / limit) * 100)
    : 0;

  const metrics = [
    { label: "Characters", value: stats.characters },
    { label: "Words", value: stats.words },
    { label: "Sentences", value: stats.sentences },
    { label: "Characters without spaces", value: stats.charactersNoSpaces },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Reading time", value: stats.readingMinutes ? `${stats.readingMinutes} min` : "—" },
  ];

  return (
    <ToolFrame
      icon={Type}
      title="Character Counter"
      description="Count characters, words, sentences, and paragraphs as you type. Your text stays in this browser."
    >
      <label htmlFor="character-counter-input" className={TOOL_LABEL_CLASS}>
        Your text
      </label>
      <textarea
        id="character-counter-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={9}
        spellCheck={false}
        placeholder="Type or paste your text here…"
        className={`${TOOL_INPUT_CLASS} resize-y leading-6`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className={TOOL_CARD_CLASS}>
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-fg">{value}</p>
          </div>
        ))}
      </div>

      <section className={`${TOOL_CARD_CLASS} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-fg">
            <input
              type="checkbox"
              checked={limitEnabled}
              onChange={(event) => setLimitEnabled(event.target.checked)}
              className="h-4 w-4 accent-azure-500"
            />
            Set a character limit
          </label>
          {limitEnabled && (
            <label className="flex items-center gap-2 text-sm text-muted">
              Limit
              <input
                type="number"
                min="1"
                max="100000"
                value={limit}
                onChange={(event) => setLimit(Math.max(1, Number(event.target.value) || 1))}
                className="focus-ring w-24 rounded-md border border-edge bg-surface px-2 py-1.5 text-fg"
              />
            </label>
          )}
        </div>
        {limitEnabled && (
          <>
            <div
              role="progressbar"
              aria-label="Character limit usage"
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={Math.min(stats.characters, limit)}
              className="h-2 overflow-hidden rounded-full bg-surface"
            >
              <div
                className={`h-full rounded-full transition-[width] ${stats.characters > limit ? "bg-red-500" : "bg-azure-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`text-xs ${stats.characters > limit ? "text-red-400" : "text-muted"}`}>
              {stats.characters.toLocaleString()} / {limit.toLocaleString()} characters
              {stats.characters > limit ? ` · ${stats.characters - limit} over the limit` : ""}
            </p>
          </>
        )}
      </section>

      {topLetters.length > 0 && (
        <section className={`${TOOL_CARD_CLASS} space-y-3`} aria-label="Most common letters">
          <h3 className="text-sm font-semibold text-fg">Letter frequency</h3>
          {topLetters.map(({ letter, count }) => (
            <div key={letter} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 text-xs">
              <span className="font-mono font-semibold text-fg">{letter.toLocaleUpperCase()}</span>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-azure-500"
                  style={{ width: `${(count / topLetters[0].count) * 100}%` }}
                />
              </div>
              <span className="text-muted">{count} ({((count / stats.characters) * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </section>
      )}
    </ToolFrame>
  );
}
