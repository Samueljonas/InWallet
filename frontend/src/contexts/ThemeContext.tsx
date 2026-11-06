import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Appearance,
  ImageStyle,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  applyThemePalette,
  buildShadows,
  chartPalettes,
  Palette,
  palettes,
  ThemeName,
} from "../theme";

const STORAGE_KEY = "@inwallet:theme";

export interface Theme {
  name: ThemeName;
  isDark: boolean;
  colors: Palette;
  chartPalette: string[];
  shadowCard: object;
  shadowHero: object;
}

interface ThemeContextData extends Theme {
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    isDark: true,
    colors: palettes.dark,
    chartPalette: chartPalettes.dark,
    ...buildShadows("dark"),
  },
  light: {
    name: "light",
    isDark: false,
    colors: palettes.light,
    chartPalette: chartPalettes.light,
    ...buildShadows("light"),
  },
};

const ThemeContext = createContext<ThemeContextData>({
  ...THEMES.dark,
  setTheme: () => {},
  toggleTheme: () => {},
});

/**
 * Provedor de tema (Escuro Midnight Navy / Claro Crisp Daylight).
 * Persiste a escolha do usuário no AsyncStorage e sincroniza a paleta global.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [name, setName] = useState<ThemeName>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") {
          applyThemePalette(stored);
          setName(stored);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    applyThemePalette(name);
    Appearance.setColorScheme?.(name);
  }, [name]);

  const setTheme = useCallback((next: ThemeName) => {
    applyThemePalette(next);
    setName(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setName((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyThemePalette(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ...THEMES[name], setTheme, toggleTheme }),
    [name, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Hook utilitário que gera e faz cache de StyleSheets por tema ("dark" / "light").
 */
export function createThemedStyles<
  T extends NamedStyles<T> | NamedStyles<any>,
>(factory: (theme: Theme) => T): () => T {
  const cache: Partial<Record<ThemeName, T>> = {};
  return function useThemedStyles(): T {
    const { name } = useTheme();
    if (!cache[name]) {
      cache[name] = StyleSheet.create(factory(THEMES[name])) as T;
    }
    return cache[name] as T;
  };
}
