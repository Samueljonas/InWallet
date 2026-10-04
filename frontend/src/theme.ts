import { Platform, StatusBar } from "react-native";

export const colors = {
  bg: "#0B1220",
  surface: "#111A2E",
  surfaceAlt: "#1A2540",
  border: "#243152",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  income: "#22C55E",
  incomeBg: "rgba(34,197,94,0.12)",
  expense: "#EF4444",
  expenseBg: "rgba(239,68,68,0.12)",
  white: "#FFFFFF",
};

export const chartPalette = [
  "#3B82F6",
  "#F59E0B",
  "#A855F7",
  "#14B8A6",
  "#EC4899",
  "#84CC16",
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

/** Largura máxima do conteúdo (deixa a versão web com cara de app). */
export const maxContentWidth = 720;

/** Espaço do topo para não ficar embaixo da barra de status. */
export const topInset = Platform.select({
  ios: 56,
  android: (StatusBar.currentHeight ?? 24) + 12,
  default: 20,
}) as number;
