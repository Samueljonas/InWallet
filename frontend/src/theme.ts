import { Platform, StatusBar } from "react-native";

/**
 * Design System — Midnight Navy & Royal Blue (Dark) + Crisp Daylight (Light)
 *
 * Paleta oficial da marca:
 * - #0A0F1E (Deep Midnight Navy)
 * - #1B2A41 (Dark Slate Navy)
 * - #3B82F6 (Vibrant Royal Blue)
 * - #94A3B8 (Cool Muted Slate)
 * - #E2E8F0 (Crisp Light Slate)
 */

export type ThemeName = "dark" | "light";

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceSubtle: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  borderFocus: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySoft: string;
  primaryBorder: string;
  income: string;
  incomeBg: string;
  incomeBorder: string;
  expense: string;
  expenseBg: string;
  expenseBorder: string;
  warning: string;
  warningBg: string;
  white: string;
  slate800: string;
  slate900: string;
  onPrimary: string;
  backdrop: string;
}

/** Tema escuro (padrão) — Midnight Navy & Royal Blue */
export const darkColors: Palette = {
  bg: "#0A0F1E",
  surface: "#1B2A41",
  surfaceAlt: "#111C2E",
  surfaceSubtle: "#0E1628",
  surfaceHover: "#243754",

  border: "rgba(148, 163, 184, 0.14)",
  borderStrong: "rgba(148, 163, 184, 0.24)",
  borderFocus: "#3B82F6",

  text: "#E2E8F0",
  textMuted: "#94A3B8",
  textFaint: "#7C8BA1",

  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  primaryDark: "#2563EB",
  primarySoft: "rgba(59, 130, 246, 0.14)",
  primaryBorder: "rgba(59, 130, 246, 0.32)",

  income: "#10B981",
  incomeBg: "rgba(16, 185, 129, 0.12)",
  incomeBorder: "rgba(16, 185, 129, 0.28)",
  expense: "#F43F5E",
  expenseBg: "rgba(244, 63, 94, 0.12)",
  expenseBorder: "rgba(244, 63, 94, 0.28)",
  warning: "#F59E0B",
  warningBg: "rgba(245, 158, 11, 0.12)",

  white: "#FFFFFF",
  slate800: "#1B2A41",
  slate900: "#0A0F1E",
  onPrimary: "#FFFFFF",
  backdrop: "rgba(10, 15, 30, 0.78)",
};

/** Tema claro — Crisp Daylight & Royal Blue (contraste WCAG AA garantido) */
export const lightColors: Palette = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  surfaceAlt: "#E2E8F0",
  surfaceSubtle: "#F8FAFC",
  surfaceHover: "#CBD5E1",

  border: "rgba(15, 23, 42, 0.10)",
  borderStrong: "rgba(15, 23, 42, 0.18)",
  borderFocus: "#2563EB",

  text: "#0A0F1E",
  textMuted: "#475569",
  textFaint: "#64748B",

  primary: "#2563EB",
  primaryLight: "#1D4ED8",
  primaryDark: "#1E40AF",
  primarySoft: "rgba(37, 99, 235, 0.10)",
  primaryBorder: "rgba(37, 99, 235, 0.26)",

  income: "#059669",
  incomeBg: "rgba(5, 150, 105, 0.10)",
  incomeBorder: "rgba(5, 150, 105, 0.25)",
  expense: "#E11D48",
  expenseBg: "rgba(225, 29, 72, 0.09)",
  expenseBorder: "rgba(225, 29, 72, 0.24)",
  warning: "#D97706",
  warningBg: "rgba(217, 119, 6, 0.10)",

  white: "#FFFFFF",
  slate800: "#1B2A41",
  slate900: "#0A0F1E",
  onPrimary: "#FFFFFF",
  backdrop: "rgba(15, 23, 42, 0.50)",
};

export const palettes: Record<ThemeName, Palette> = {
  dark: darkColors,
  light: lightColors,
};

/**
 * Objeto reativo de cores sincronizado com o tema ativo.
 * Permite tanto acesso direto (`colors.primary`) quanto via hook `useTheme()`.
 */
export const colors: Palette = { ...darkColors };

export function applyThemePalette(name: ThemeName): void {
  Object.assign(colors, palettes[name]);
}

export const chartPalettes: Record<ThemeName, string[]> = {
  dark: ["#3B82F6", "#38BDF8", "#818CF8", "#2DD4BF", "#60A5FA", "#94A3B8", "#A78BFA"],
  light: ["#2563EB", "#0284C7", "#4F46E5", "#0D9488", "#3B82F6", "#64748B", "#7C3AED"],
};

export const chartPalette = chartPalettes.dark;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 14, xl: 18, pill: 999 };
export const maxContentWidth = 720;

export const topInset = Platform.select({
  ios: 56,
  android: (StatusBar.currentHeight ?? 24) + 12,
  default: 24,
}) as number;

export function buildShadows(name: ThemeName) {
  const isDark = name === "dark";
  const card = Platform.select({
    web: {
      boxShadow: isDark
        ? "0 4px 16px rgba(0, 0, 0, 0.28)"
        : "0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.05)",
    } as any,
    default: {
      shadowColor: isDark ? "#000000" : "#0F172A",
      shadowOffset: { width: 0, height: isDark ? 4 : 2 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: isDark ? 8 : 6,
      elevation: isDark ? 3 : 2,
    },
  }) as object;
  const hero = Platform.select({
    web: {
      boxShadow: isDark
        ? "0 12px 32px rgba(0, 0, 0, 0.45)"
        : "0 12px 32px rgba(15, 23, 42, 0.12)",
    } as any,
    default: {
      shadowColor: isDark ? "#000000" : "#0F172A",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  }) as object;
  return { shadowCard: card, shadowHero: hero };
}

export const { shadowCard, shadowHero } = buildShadows("dark");
