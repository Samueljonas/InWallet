import { Platform, StatusBar } from "react-native";

export const colors = {
  // Fundos & Superfícies (Clean & Frio)
  bg: "#F8FAFC", // Slate 50 - Fundo geral limpo e descansado
  surface: "#FFFFFF", // Branco puro para cards principais
  surfaceAlt: "#F1F5F9", // Slate 100 - Fundos de inputs, chips secundários
  surfaceSubtle: "#F8FAFC",
  surfaceHover: "#E2E8F0", // Slate 200

  // Bordas sutis e limpas
  border: "#E2E8F0", // Slate 200
  borderStrong: "#CBD5E1", // Slate 300
  borderFocus: "#2563EB",

  // Tipografia (Slate de alto contraste)
  text: "#0F172A", // Slate 900 - Títulos e valores
  textMuted: "#475569", // Slate 600 - Subtítulos e rótulos
  textFaint: "#94A3B8", // Slate 400 - Placeholders e dicas

  // Azul Fintech (Identidade Primária)
  primary: "#2563EB", // Blue 600 - Azul vibrante e corporativo
  primaryLight: "#3B82F6", // Blue 500
  primaryDark: "#1D4ED8", // Blue 700
  primarySoft: "#EFF6FF", // Blue 50 - Fundos suaves com destaque
  primaryBorder: "#BFDBFE", // Blue 200

  // Cores Financeiras (Semáforo moderno)
  income: "#059669", // Emerald 600
  incomeBg: "#ECFDF5", // Emerald 50
  incomeBorder: "#A7F3D0",
  expense: "#DC2626", // Red 600
  expenseBg: "#FEF2F2", // Red 50
  expenseBorder: "#FECACA",

  // Neutros auxiliares
  white: "#FFFFFF",
  slate800: "#1E293B",
  slate900: "#0F172A",
};

// Paleta fria e harmônica para gráficos (Azuis, Ciano, Indigo e Ardósia)
export const chartPalette = [
  "#2563EB", // Azul Royal
  "#0284C7", // Ciano / Céu
  "#6366F1", // Indigo
  "#0D9488", // Teal Frio
  "#3B82F6", // Azul Suave
  "#64748B", // Slate Frio
  "#8B5CF6", // Roxo Frio
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

/** Sombra sutil multiplataforma para dar profundidade aos cards */
export const shadowCard = Platform.select({
  web: {
    boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
  } as any,
  default: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
});

/** Sombra destacada para o card de saldo principal */
export const shadowHero = Platform.select({
  web: {
    boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.18), 0 8px 10px -6px rgba(37, 99, 235, 0.12)",
  } as any,
  default: {
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
});

/** Largura máxima do conteúdo (deixa a versão web com cara de app moderno). */
export const maxContentWidth = 720;

/** Espaço do topo para não ficar embaixo da barra de status. */
export const topInset = Platform.select({
  ios: 56,
  android: (StatusBar.currentHeight ?? 24) + 12,
  default: 20,
}) as number;

