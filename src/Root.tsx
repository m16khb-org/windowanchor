import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import App from "./App";

export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "windowanchor.theme";

function readThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function Root() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  const resolvedTheme =
    themeMode === "system" ? (systemDark ? "dark" : "light") : themeMode;

  useEffect(() => {
    document.documentElement.style.colorScheme = resolvedTheme;
    document.body.style.backgroundColor =
      resolvedTheme === "dark" ? "#1f1f1f" : "#f5f5f5";
  }, [resolvedTheme]);

  return (
    <FluentProvider
      style={{ height: "100%" }}
      theme={resolvedTheme === "dark" ? webDarkTheme : webLightTheme}
    >
      <App
        onThemeModeChange={setThemeMode}
        resolvedTheme={resolvedTheme}
        themeMode={themeMode}
      />
    </FluentProvider>
  );
}
