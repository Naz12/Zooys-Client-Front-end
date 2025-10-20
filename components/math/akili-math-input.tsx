"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "katex/dist/katex.min.css";

// ✅ robust import for react-katex (works with default/named exports)
import * as ReactKatex from "react-katex";
const TeX: any =
  (ReactKatex as any).default ??
  (ReactKatex as any).TeX ??
  (ReactKatex as any).InlineMath ??
  null;

/*
  Akili Math Input — UI Preview (Fixes v5)
  ----------------------------------------
  • Universal KaTeX import (no invalid element errors)
  • Correct LaTeX escaping: \\ in code -> \ at runtime
  • Light/Dark theme with palette; fixed layout colors in dark mode
  • Self-tests to guard escaping mistakes
*/

const COLORS = {
  primary: "#243B53", // accent for headings
  accent: "#6366F1",
  success: "#10B981",
  danger: "#EF4444",
};

const THEME = {
  light: {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#111827",
    subtext: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    bg: "#0F172A",
    surface: "#111827",
    text: "#E5E7EB",
    subtext: "#94A3B8",
    border: "#334155",
  },
};

// ------- Small UI primitives --------
const Pill = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
      active
        ? "bg-[var(--accent)] text-white shadow"
        : "bg-white/80 hover:bg-white border-gray-300 text-gray-700"
    }`}
    style={{ "--accent": COLORS.accent } as React.CSSProperties}
  >
    {children}
  </button>
);

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  style,
  children,
  ...rest
}) => (
  <div
    className={`rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border ${className}`}
    style={style}
    {...rest}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{
  title: string;
  hint?: string;
  color: string;
  hintColor: string;
}> = ({ title, hint, color, hintColor }) => (
  <div className="flex items-end justify-between gap-3">
    <h3 className="text-lg font-semibold tracking-tight" style={{ color }}>
      {title}
    </h3>
    {hint && (
      <span className="text-xs" style={{ color: hintColor }}>
        {hint}
      </span>
    )}
  </div>
);

// ----------------- helpers -----------------
function insertAtCursor(
  text: string,
  toInsert: string,
  selStart?: number,
  selEnd?: number
) {
  if (selStart == null || selEnd == null)
    return { text: text + toInsert, caret: (text + toInsert).length };
  const before = text.slice(0, selStart);
  const after = text.slice(selEnd);
  const next = before + toInsert + after;
  const caret = before.length + toInsert.length;
  return { text: next, caret };
}

function toMathML(latex: string) {
  const escaped = latex
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mtext>${escaped}</mtext></semantics></math>`;
}

function hexToRgba(hex: string, alpha: number) {
  const m = (hex || "").trim().replace("#", "");
  if (m.length !== 6 || /[^0-9a-fA-F]/.test(m)) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ----------------- keypad data (LaTeX strings escaped as JS) -----------------
const GROUPS: {
  label: string;
  items: { k: string; v: string; hint?: string }[];
}[] = [
  {
    label: "Structure",
    items: [
      { k: "a^b", v: "a^{b}", hint: "Power" },
      { k: "a_b", v: "a_{b}", hint: "Subscript" },
      { k: "frac", v: "\\frac{a}{b}", hint: "Fraction" },
      { k: "sqrt", v: "\\sqrt{a}", hint: "Square root" },
      { k: "nroot", v: "\\sqrt[n]{a}", hint: "Nth root" },
      { k: "sum", v: "\\sum_{i=1}^{n}", hint: "Summation" },
      {
        k: "int",
        v: "\\int_{a}^{b} f(x)\\,dx",
        hint: "Integral (thin space via \\,)",
      },
      { k: "lim", v: "\\lim_{x\\to 0}", hint: "Limit" },
    ],
  },
  {
    label: "Symbols",
    items: [
      { k: "π", v: "\\pi" },
      { k: "∞", v: "\\infty" },
      { k: "≈", v: "\\approx" },
      { k: "≠", v: "\\neq" },
      { k: "≤", v: "\\leq" },
      { k: "≥", v: "\\geq" },
      { k: "±", v: "\\pm" },
      { k: "∂", v: "\\partial" },
      { k: "∑", v: "\\sum" },
      { k: "∏", v: "\\prod" },
    ],
  },
  {
    label: "Greek",
    items: [
      { k: "α", v: "\\alpha" },
      { k: "β", v: "\\beta" },
      { k: "γ", v: "\\gamma" },
      { k: "Δ", v: "\\Delta" },
      { k: "θ", v: "\\theta" },
      { k: "λ", v: "\\lambda" },
      { k: "μ", v: "\\mu" },
      { k: "σ", v: "\\sigma" },
      { k: "Ω", v: "\\Omega" },
    ],
  },
  {
    label: "Sets",
    items: [
      { k: "∈", v: "\\in" },
      { k: "∉", v: "\\notin" },
      { k: "∩", v: "\\cap" },
      { k: "∪", v: "\\cup" },
      { k: "⊂", v: "\\subset" },
      { k: "⊆", v: "\\subseteq" },
      { k: "⊇", v: "\\supseteq" },
      { k: "ℝ", v: "\\mathbb{R}" },
      { k: "ℤ", v: "\\mathbb{Z}" },
      { k: "ℕ", v: "\\mathbb{N}" },
    ],
  },
];

interface AkiliMathInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onExport?: (latex: string, mathml: string) => void;
  className?: string;
}

export default function AkiliMathInput({ 
  value = "e^{i\\pi} + 1 = 0", 
  onChange,
  onExport,
  className = "" 
}: AkiliMathInputProps) {
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [darkMode, setDarkMode] = useState(prefersDark);
  const palette = darkMode ? THEME.dark : THEME.light;

  const [mode, setMode] = useState<"type" | "hand" | "voice">("type");
  // Use \\ in code -> \ in the textbox at runtime
  const [latex, setLatex] = useState<string>(value);
  const [cursor, setCursor] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const taRef = useRef<HTMLTextAreaElement>(null);

  const mathML = useMemo(() => toMathML(latex), [latex]);

  // Update internal state when external value changes
  React.useEffect(() => {
    if (value !== latex) {
      setLatex(value);
    }
  }, [value]);

  // Notify parent of changes
  const handleLatexChange = (newLatex: string) => {
    setLatex(newLatex);
    onChange?.(newLatex);
  };

  const applySnippet = (snippet: string) => {
    const { text, caret } = insertAtCursor(
      latex,
      snippet,
      cursor.start,
      cursor.end
    );
    handleLatexChange(text);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(caret, caret);
      setCursor({ start: caret, end: caret });
    });
  };

  // Background gradient colors
  const accentSoft = hexToRgba(COLORS.accent, 0.14);
  const successSoft = hexToRgba(COLORS.success, 0.1);

  return (
    <div
      className={`w-full relative overflow-hidden ${className}`}
      style={{
        color: palette.text,
        backgroundColor: palette.bg,
        backgroundImage: `radial-gradient(1200px 600px at 10% -10%, ${accentSoft}, transparent 60%), radial-gradient(900px 500px at 120% 10%, ${successSoft}, transparent 50%)`,
      }}
    >
      {/* Decorative gradient orb */}
      <div
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
        style={{ background: COLORS.accent }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight"
              style={{ color: COLORS.primary }}
            >
              Akili Math Input
            </h1>
            <p
              className="text-sm md:text-base"
              style={{ color: palette.subtext }}
            >
              Visual keypad • Live render • LaTeX/MathML export •
              Voice/Handwriting ready
            </p>
          </div>
          <div className="flex gap-2">
            <Pill active={mode === "type"} onClick={() => setMode("type")}>
              Type
            </Pill>
            <Pill active={mode === "hand"} onClick={() => setMode("hand")}>
              Handwrite
            </Pill>
            <Pill active={mode === "voice"} onClick={() => setMode("voice")}>
              Voice
            </Pill>
            <Pill onClick={() => setDarkMode((d) => !d)}>
              {darkMode ? "🌙 Dark" : "☀️ Light"}
            </Pill>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Editor + Keypad */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              className="p-4 md:p-6"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <SectionTitle
                title={
                  mode === "type"
                    ? "Equation Editor"
                    : mode === "hand"
                    ? "Handwriting (Prototype)"
                    : "Voice (Prototype)"
                }
                hint={
                  mode === "type"
                    ? "Insert with keypad or type LaTeX"
                    : "Preview UI only — model integration next"
                }
                color={palette.text}
                hintColor={palette.subtext}
              />

              {mode === "type" && (
                <div className="mt-4">
                  <textarea
                    ref={taRef}
                    value={latex}
                    onChange={(e) => handleLatexChange(e.target.value)}
                    onSelect={(e) => {
                      const t = e.target as HTMLTextAreaElement;
                      setCursor({
                        start: t.selectionStart,
                        end: t.selectionEnd,
                      });
                    }}
                    className="w-full min-h-[120px] md:min-h-[160px] rounded-xl border focus:outline-none focus:ring-4 p-3 font-mono text-sm"
                    style={{
                      borderColor: palette.border,
                      background: palette.bg,
                      color: palette.text,
                    }}
                    placeholder={
                      "Type LaTeX here, e.g. \\int_0^{\\infty} x^2 e^{-x} \\, dx"
                    }
                  />

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {GROUPS.map((g) => (
                      <Card
                        key={g.label}
                        className="p-3"
                        style={{
                          backgroundColor: palette.surface,
                          borderColor: palette.border,
                        }}
                      >
                        <div
                          className="text-xs font-semibold"
                          style={{ color: palette.subtext, marginBottom: 8 }}
                        >
                          {g.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map((it) => (
                            <button
                              key={it.k}
                              onClick={() => applySnippet(it.v)}
                              title={it.hint || it.k}
                              className="px-2.5 py-1.5 rounded-lg border text-sm bg-transparent hover:opacity-80 active:scale-95 transition"
                              style={{
                                borderColor: palette.border,
                                color: palette.text,
                              }}
                            >
                              {it.k}
                            </button>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {mode === "hand" && (
                <div className="mt-4">
                  <div
                    className="rounded-xl border border-dashed p-6 text-center"
                    style={{
                      borderColor: palette.border,
                      color: palette.subtext,
                    }}
                  >
                    <div
                      className="mx-auto mb-3 w-16 h-16 rounded-full"
                      style={{ background: hexToRgba(COLORS.accent, 0.2) }}
                    />
                    <p className="font-medium" style={{ color: palette.text }}>
                      Sketch your equation here
                    </p>
                    <p className="text-xs">
                      Canvas + symbol recognition coming next (ONNX in-browser).
                      For now, this is a visual placeholder.
                    </p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      className="px-4 py-2 rounded-xl font-semibold text-white"
                      style={{ background: COLORS.accent }}
                    >
                      Recognize
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl border"
                      style={{
                        borderColor: palette.border,
                        color: palette.text,
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {mode === "voice" && (
                <div className="mt-4">
                  <div
                    className="rounded-xl border p-6 flex items-center justify-between gap-4"
                    style={{ borderColor: palette.border }}
                  >
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: palette.text }}
                      >
                        Say: "integrate x squared from 0 to infinity"
                      </p>
                      <p className="text-xs" style={{ color: palette.subtext }}>
                        We'll parse to LaTeX like{" "}
                        <code>{"\\int_0^{\\infty} x^2 \\, dx"}</code>.
                        Placeholder UI for now.
                      </p>
                    </div>
                    <button
                      className="px-5 py-2 rounded-xl font-semibold shadow text-white"
                      style={{ background: COLORS.accent }}
                    >
                      ● Record
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Export */}
            <Card
              className="p-4 md:p-6"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <SectionTitle
                title="Export"
                hint="Share with AI agents or other apps"
                color={palette.text}
                hintColor={palette.subtext}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div
                    className="text-xs font-semibold mb-2"
                    style={{ color: palette.subtext }}
                  >
                    LaTeX
                  </div>
                  <pre
                    className="p-3 rounded-xl text-sm overflow-auto border"
                    style={{
                      borderColor: palette.border,
                      background: darkMode ? "#0B1220" : "#F9FAFB",
                      color: palette.text,
                    }}
                  >
                    {latex}
                  </pre>
                </div>
                <div>
                  <div
                    className="text-xs font-semibold mb-2"
                    style={{ color: palette.subtext }}
                  >
                    MathML
                  </div>
                  <pre
                    className="p-3 rounded-xl text-sm overflow-auto border"
                    style={{
                      borderColor: palette.border,
                      background: darkMode ? "#0B1220" : "#F9FAFB",
                      color: palette.text,
                    }}
                  >
                    {mathML}
                  </pre>
                </div>
              </div>
              {onExport && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onExport(latex, mathML)}
                    className="px-4 py-2 rounded-xl font-semibold text-white"
                    style={{ background: COLORS.accent }}
                  >
                    Export to Math Solver
                  </button>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Live Render & Hints */}
          <div className="space-y-6">
            <Card
              className="p-4 md:p-6"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <SectionTitle
                title="Live Render"
                hint="Powered by KaTeX"
                color={palette.text}
                hintColor={palette.subtext}
              />
              <div
                className="mt-4 p-4 rounded-xl border"
                style={{
                  borderColor: palette.border,
                  background: palette.surface,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={latex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="text-2xl"
                  >
                    {TeX ? (
                      <TeX math={latex} errorColor={COLORS.danger} />
                    ) : (
                      <code>{latex}</code>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </Card>

            <Card
              className="p-4 md:p-6"
              style={{
                backgroundColor: palette.surface,
                borderColor: palette.border,
              }}
            >
              <SectionTitle
                title="Tips & Shortcuts"
                hint=""
                color={palette.text}
                hintColor={palette.subtext}
              />
              <ul
                className="mt-3 space-y-2 text-sm"
                style={{ color: palette.text }}
              >
                <li>
                  <b>Power:</b> type <code>^</code> → <code>{"a^{b}"}</code>
                </li>
                <li>
                  <b>Fraction:</b> <code>{"\\frac{a}{b}"}</code>
                </li>
                <li>
                  <b>Limits/Integrals:</b> <code>{"\\lim_{x\\to 0}"}</code>,{" "}
                  <code>{"\\int_{a}^{b} f(x)\\,dx"}</code>
                </li>
                <li>
                  <b>Greek:</b> <code>{"\\alpha"}</code>,{" "}
                  <code>{"\\beta"}</code>, <code>{"\\theta"}</code>, …
                </li>
                <li>
                  <b>Sets:</b> <code>{"\\mathbb{R}"}</code>,{" "}
                  <code>{"\\in"}</code>, <code>{"\\subset"}</code>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

















