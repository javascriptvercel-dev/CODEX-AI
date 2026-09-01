
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./context/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "var(--ink-950)",
          900: "var(--ink-900)",
          800: "var(--ink-800)",
          700: "var(--ink-700)",
        },
        paper: {
          50: "var(--paper-50)",
          100: "var(--paper-100)",
        },
        azure: {
          300: "var(--azure-300)",
          500: "var(--azure-500)",
          600: "var(--azure-600)",
        },
        edge: "var(--edge)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        fg: "var(--text)",
        muted: "var(--text-muted)",
        bg: "var(--bg)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px var(--edge), 0 12px 40px -12px rgba(47, 111, 237, 0.35)",
      },
      keyframes: {
        blink: { "0%, 49%": { opacity: 1 }, "50%, 100%": { opacity: 0 } },
        rise: { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        blink: "blink 1s step-start infinite",
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
