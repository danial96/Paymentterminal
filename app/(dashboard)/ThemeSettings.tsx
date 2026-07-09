"use client";

import { useTheme, type BgPreset } from "@/app/ThemeProvider";

const BG_PRESETS: { value: BgPreset; label: string; light: string; dark: string }[] = [
  { value: "default", label: "Default",  light: "#f9fafb", dark: "#0f172a" },
  { value: "white",   label: "White",    light: "#ffffff", dark: "#1e293b" },
  { value: "indigo",  label: "Indigo",   light: "#eef2ff", dark: "#1e1b4b" },
  { value: "emerald", label: "Emerald",  light: "#f0fdf4", dark: "#052e16" },
  { value: "rose",    label: "Rose",     light: "#fff1f2", dark: "#1c0a0f" },
  { value: "amber",   label: "Amber",    light: "#fffbeb", dark: "#1c1107" },
  { value: "slate",   label: "Slate",    light: "#f1f5f9", dark: "#0f172a" },
];

export default function ThemeSettings({ onClose }: { onClose: () => void }) {
  const { mode, bg, setMode, setBg } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-80 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
              <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Light / Dark toggle */}
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("light")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                mode === "light"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Light
            </button>
            <button
              onClick={() => setMode("dark")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                mode === "dark"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                  : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark
            </button>
          </div>
        </div>

        {/* Background color */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">Background</p>
          <div className="grid grid-cols-7 gap-1.5">
            {BG_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setBg(preset.value)}
                title={preset.label}
                className={`group relative h-9 w-9 rounded-lg border-2 transition-all hover:scale-110 ${
                  bg === preset.value
                    ? "border-indigo-500 shadow-md shadow-indigo-200 dark:shadow-indigo-900"
                    : "border-transparent hover:border-gray-300 dark:hover:border-slate-500"
                }`}
                style={{ backgroundColor: mode === "dark" ? preset.dark : preset.light }}
              >
                {bg === preset.value && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                {/* Tooltip */}
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
