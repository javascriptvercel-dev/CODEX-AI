"use client";
import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("codex-theme");
    const initial = stored || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setReady(true);
  }, []);
  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      window.localStorage.setItem("codex-theme", next);
      return next;
    });
  };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
