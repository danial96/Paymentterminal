"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";

export type BgPreset = "default" | "white" | "indigo" | "emerald" | "rose" | "amber" | "slate";
export type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  bg: BgPreset;
  setMode: (m: ThemeMode) => void;
  setBg: (b: BgPreset) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light", bg: "default",
  setMode: () => {}, setBg: () => {},
});

export function useTheme() { return useContext(ThemeContext); }

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [bg, setBgState] = useState<BgPreset>("default");
  const [, startTransition] = useTransition();

  // Read from localStorage once on mount
  useEffect(() => {
    const saved = localStorage.getItem("crm-theme");
    if (saved) {
      try {
        const { mode: m, bg: b } = JSON.parse(saved);
        startTransition(() => {
          if (m) setModeState(m);
          if (b) setBgState(b);
        });
      } catch {}
    }
  }, []);

  // Apply to <html> element whenever mode/bg changes
  useEffect(() => {
    const html = document.documentElement;
    if (mode === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    html.setAttribute("data-bg", bg === "default" ? "" : bg);
    localStorage.setItem("crm-theme", JSON.stringify({ mode, bg }));
  }, [mode, bg]);

  function setMode(m: ThemeMode) { setModeState(m); }
  function setBg(b: BgPreset) { setBgState(b); }

  return (
    <ThemeContext.Provider value={{ mode, bg, setMode, setBg }}>
      {children}
    </ThemeContext.Provider>
  );
}
