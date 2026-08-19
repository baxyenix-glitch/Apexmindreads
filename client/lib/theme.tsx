import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authHeaders } from "./firebase";

export type ThemeId =
  | "warm-editorial"
  | "executive-obsidian"
  | "nordic-sage"
  | "midnight-executive"
  | "oxford-navy"
  | "wabi-sabi"
  | "monochrome-luxe"
  | "royal-sapphire"
  | "warm-copper"
  | "cyber-slate";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  tagline: string;
  isDark: boolean;
  colors: {
    bg: string;
    bgHero: string;
    bgCard: string;
    bgMuted: string;
    text: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentBadge: string;
    border: string;
    kicker: string;
    star: string;
  };
  swatches: string[];
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "warm-editorial",
    name: "Warm Editorial",
    tagline: "Signature literary bookstore with warm linen paper & terracotta accents",
    isDark: false,
    colors: {
      bg: "#f8f4ec",
      bgHero: "#f8f4ec",
      bgCard: "#fcfbf9",
      bgMuted: "#eee7dc",
      text: "#26332f",
      textMuted: "#736b61",
      accent: "#d86f45",
      accentHover: "#bf5937",
      accentBadge: "#f0bc58",
      border: "#e5ddd2",
      kicker: "#d86f45",
      star: "#e4a83d",
    },
    swatches: ["#f8f4ec", "#26332f", "#d86f45", "#f0bc58", "#e5ddd2"],
  },
  {
    id: "executive-obsidian",
    name: "Executive Obsidian & Amber",
    tagline: "High-authority MasterClass & Wall Street look with sharp luxury gold",
    isDark: false,
    colors: {
      bg: "#fafafb",
      bgHero: "#f4f4f7",
      bgCard: "#ffffff",
      bgMuted: "#f1f3f6",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#d97706",
      accentHover: "#b45309",
      accentBadge: "#f59e0b",
      border: "#e2e8f0",
      kicker: "#d97706",
      star: "#f59e0b",
    },
    swatches: ["#fafafb", "#0f172a", "#d97706", "#f59e0b", "#e2e8f0"],
  },
  {
    id: "nordic-sage",
    name: "Nordic Sage & Pine",
    tagline: "Serene, mindful growth aesthetic inspired by Scandinavian wellness",
    isDark: false,
    colors: {
      bg: "#f5f8f6",
      bgHero: "#edf4f0",
      bgCard: "#ffffff",
      bgMuted: "#e6efe9",
      text: "#132e27",
      textMuted: "#5a736b",
      accent: "#0d9488",
      accentHover: "#0f766e",
      accentBadge: "#f97316",
      border: "#dee7e2",
      kicker: "#0d9488",
      star: "#f59e0b",
    },
    swatches: ["#f5f8f6", "#132e27", "#0d9488", "#f97316", "#dee7e2"],
  },
  {
    id: "midnight-executive",
    name: "Midnight Executive Dark",
    tagline: "Sleek, immersive Silicon Valley dark mode for maximum focus & readability",
    isDark: true,
    colors: {
      bg: "#0b0f17",
      bgHero: "#111827",
      bgCard: "#151d2a",
      bgMuted: "#1f2937",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
      accent: "#f59e0b",
      accentHover: "#d97706",
      accentBadge: "#38bdf8",
      border: "#263345",
      kicker: "#f59e0b",
      star: "#f59e0b",
    },
    swatches: ["#0b0f17", "#f1f5f9", "#f59e0b", "#38bdf8", "#263345"],
  },
  {
    id: "oxford-navy",
    name: "Oxford Navy & Crimson",
    tagline: "Prestigious Ivy League academic publishing feel with deep navy & crimson",
    isDark: false,
    colors: {
      bg: "#f8f9fb",
      bgHero: "#eff3f8",
      bgCard: "#ffffff",
      bgMuted: "#e2e9f3",
      text: "#0f172a",
      textMuted: "#475569",
      accent: "#be123c",
      accentHover: "#9f1239",
      accentBadge: "#2563eb",
      border: "#cbd5e1",
      kicker: "#be123c",
      star: "#eab308",
    },
    swatches: ["#f8f9fb", "#0f172a", "#be123c", "#2563eb", "#cbd5e1"],
  },
  {
    id: "wabi-sabi",
    name: "Japanese Minimalist (Wabi-Sabi)",
    tagline: "Clean, organic Zen aesthetic with stone parchment and cedar bronze",
    isDark: false,
    colors: {
      bg: "#f5f3ef",
      bgHero: "#ece7e0",
      bgCard: "#fcfbf9",
      bgMuted: "#e6e1d8",
      text: "#2c2b29",
      textMuted: "#6b6761",
      accent: "#8c5a47",
      accentHover: "#734433",
      accentBadge: "#b58d67",
      border: "#ded9cf",
      kicker: "#8c5a47",
      star: "#c99a5e",
    },
    swatches: ["#f5f3ef", "#2c2b29", "#8c5a47", "#b58d67", "#ded9cf"],
  },
  {
    id: "monochrome-luxe",
    name: "Monochrome Luxe",
    tagline: "High-contrast architectural black & pure alabaster editorial design",
    isDark: false,
    colors: {
      bg: "#ffffff",
      bgHero: "#f8f8f9",
      bgCard: "#ffffff",
      bgMuted: "#f0f0f2",
      text: "#09090b",
      textMuted: "#52525b",
      accent: "#18181b",
      accentHover: "#27272a",
      accentBadge: "#71717a",
      border: "#e4e4e7",
      kicker: "#09090b",
      star: "#eab308",
    },
    swatches: ["#ffffff", "#09090b", "#18181b", "#71717a", "#e4e4e7"],
  },
  {
    id: "royal-sapphire",
    name: "Royal Sapphire & Gold",
    tagline: "Regal, high-ticket digital library with deep royal navy & radiant champagne",
    isDark: false,
    colors: {
      bg: "#f4f7fb",
      bgHero: "#e9f0f8",
      bgCard: "#ffffff",
      bgMuted: "#dde7f3",
      text: "#0b192c",
      textMuted: "#506580",
      accent: "#1e3e62",
      accentHover: "#152d47",
      accentBadge: "#d4af37",
      border: "#d1deec",
      kicker: "#1e3e62",
      star: "#f59e0b",
    },
    swatches: ["#f4f7fb", "#0b192c", "#1e3e62", "#d4af37", "#d1deec"],
  },
  {
    id: "warm-copper",
    name: "Warm Copper & Espresso",
    tagline: "Rich, cozy artisan coffeehouse & craft publication palette",
    isDark: false,
    colors: {
      bg: "#faf6f0",
      bgHero: "#f2ece1",
      bgCard: "#ffffff",
      bgMuted: "#e9e1d3",
      text: "#2b2118",
      textMuted: "#736354",
      accent: "#a75d33",
      accentHover: "#8b4b27",
      accentBadge: "#dda15e",
      border: "#e5dbcc",
      kicker: "#a75d33",
      star: "#dda15e",
    },
    swatches: ["#faf6f0", "#2b2118", "#a75d33", "#dda15e", "#e5dbcc"],
  },
  {
    id: "cyber-slate",
    name: "Cyber Slate & Violet",
    tagline: "Futuristic, high-energy palette for modern tech entrepreneurship & AI",
    isDark: true,
    colors: {
      bg: "#0f0e17",
      bgHero: "#161524",
      bgCard: "#1a1829",
      bgMuted: "#25233a",
      text: "#fffffe",
      textMuted: "#a7a9be",
      accent: "#7f5af0",
      accentHover: "#6b46e5",
      accentBadge: "#2cb67d",
      border: "#2e2b44",
      kicker: "#7f5af0",
      star: "#ff8906",
    },
    swatches: ["#0f0e17", "#fffffe", "#7f5af0", "#2cb67d", "#2e2b44"],
  },
];

export function getTheme(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

type ThemeContextValue = {
  currentTheme: ThemeDefinition;
  themeId: ThemeId;
  previewTheme: (id: ThemeId) => void;
  saveTheme: (id: ThemeId) => Promise<void>;
  themes: ThemeDefinition[];
  isSaving: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDom(theme: ThemeDefinition) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--theme-bg", theme.colors.bg);
  root.style.setProperty("--theme-bg-hero", theme.colors.bgHero);
  root.style.setProperty("--theme-bg-card", theme.colors.bgCard);
  root.style.setProperty("--theme-bg-muted", theme.colors.bgMuted);
  root.style.setProperty("--theme-text", theme.colors.text);
  root.style.setProperty("--theme-text-muted", theme.colors.textMuted);
  root.style.setProperty("--theme-accent", theme.colors.accent);
  root.style.setProperty("--theme-accent-hover", theme.colors.accentHover);
  root.style.setProperty("--theme-accent-badge", theme.colors.accentBadge);
  root.style.setProperty("--theme-border", theme.colors.border);
  root.style.setProperty("--theme-kicker", theme.colors.kicker);
  root.style.setProperty("--theme-star", theme.colors.star);

  if (theme.isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "warm-editorial";
    const stored = window.localStorage.getItem("apexmindreads-theme") as ThemeId | null;
    return stored && THEMES.some((t) => t.id === stored) ? stored : "warm-editorial";
  });

  const [isSaving, setIsSaving] = useState(false);

  // Apply active theme immediately to DOM on mount and changes
  useEffect(() => {
    const active = getTheme(themeId);
    applyThemeToDom(active);
  }, [themeId]);

  // Fetch saved theme from server settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings?.theme) {
          const serverTheme = data.settings.theme as ThemeId;
          if (THEMES.some((t) => t.id === serverTheme)) {
            setThemeId(serverTheme);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("apexmindreads-theme", serverTheme);
            }
          }
        }
      })
      .catch(() => {
        // Fallback already active
      });
  }, []);

  const previewTheme = (id: ThemeId) => {
    const target = getTheme(id);
    applyThemeToDom(target);
  };

  const saveTheme = async (id: ThemeId) => {
    setIsSaving(true);
    try {
      setThemeId(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("apexmindreads-theme", id);
      }
      applyThemeToDom(getTheme(id));

      const headers = await authHeaders();
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ theme: id }),
      });
    } catch (e) {
      console.error("Failed to save theme setting to backend:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const currentTheme = getTheme(themeId);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeId,
        previewTheme,
        saveTheme,
        themes: THEMES,
        isSaving,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
