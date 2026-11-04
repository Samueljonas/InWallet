import { Platform, StatusBar } from "react-native";

/**
 * Design System — Midnight Navy & Royal Blue
 * Paleta oficial:
 * - #0A0F1E (Deep Midnight Navy)
 * - #1B2A41 (Dark Slate Navy)
 * - #3B82F6 (Vibrant Royal Blue)
 * - #94A3B8 (Cool Muted Slate)
 * - #E2E8F0 (Crisp Light Slate)
 */
export const colors = {
  // Fundos & Superfícies (Midnight Navy & Dark Slate)
  bg: "#0A0F1E", // Deep Midnight Navy — Fundo principal da aplicação
  surface: "#1B2A41", // Dark Slate Navy — Cards principais, barras e modais
  surfaceAlt: "#111C2E", // Superfície rebaixada para inputs, chips inativos e blocos internos
  surfaceSubtle: "#0E1628", // Fundo intermediário sutil
  surfaceHover: "#243754", // Estado de hover/press em superfícies

  // Bordas minimalistas (1px sutil)
  border: "rgba(148, 163, 184, 0.14)",
  borderStrong: "rgba(148, 163, 184, 0.24)",
  borderFocus: "#3B82F6",

  // Tipografia (Crisp Light Slate & Cool Muted Slate — contraste WCAG AA)
  text: "#E2E8F0", // Crisp Light Slate — Títulos e valores principais
  textMuted: "#94A3B8", // Cool Muted Slate — Subtítulos, labels e descrições
  textFaint: "#64748B", // Datas secundárias, dicas e placeholders

  // Acento Primário (Vibrant Royal Blue)
  primary: "#3B82F6", // Royal Blue principal
  primaryLight: "#60A5FA",
  primaryDark: "#2563EB",
  primarySoft: "rgba(59, 130, 246, 0.14)",
  primaryBorder: "rgba(59, 130, 246, 0.32)",

  // Cores Semânticas Financeiras (Sóbrias e Elegantes)
  income: "#10B981", // Emerald
  incomeBg: "rgba(16, 185, 129, 0.12)",
  incomeBorder: "rgba(16, 185, 129, 0.28)",
  expense: "#F43F5E", // Rose
  expenseBg: "rgba(244, 63, 94, 0.12)",
  expenseBorder: "rgba(244, 63, 94, 0.28)",

  // Neutros de contraste
  white: "#FFFFFF", // Texto puro sobre botões primários (#3B82F6)
  slate800: "#1B2A41",
  slate900: "#0A0F1E",
};

export const chartPalette = [
  "#3B82F6", // Royal Blue
  "#38BDF8", // Sky Blue
  "#818CF8", // Indigo
  "#2DD4BF", // Teal
  "#60A5FA", // Light Blue
  "#94A3B8", // Cool Slate
  "#A78BFA", // Violet
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 14, xl: 18, pill: 999 };

/** Sombra discreta para profundidade em tema escuro */
export const shadowCard = Platform.select({
  web: {
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.28)",
  } as any,
  default: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
});

/** Sombra destacada para modais e card principal */
export const shadowHero = Platform.select({
  web: {
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)",
  } as any,
  default: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});

export const maxContentWidth = 720;

export const topInset = Platform.select({
  ios: 56,
  android: (StatusBar.currentHeight ?? 24) + 12,
  default: 24,
}) as number;
