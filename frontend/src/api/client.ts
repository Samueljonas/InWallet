import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

export const TOKEN_KEY = "@inwallet:token";
export const REFRESH_KEY = "@inwallet:refresh";

/**
 * Descobre a URL do backend:
 * 1. EXPO_PUBLIC_API_URL (se definida)
 * 2. Web: mesmo host da página, porta 8000
 * 3. Celular/emulador: mesmo IP do servidor Metro (funciona com Expo Go na mesma rede Wi-Fi)
 */
function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (Platform.OS === "web") {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${host}:8000`;
  }

  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  const match = scriptURL?.match(/\/\/([^:/]+)/);
  if (match?.[1]) return `http://${match[1]}:8000`;

  // Fallback para celular físico na mesma rede Wi-Fi / emulador
  return "http://192.168.0.109:8000";
}

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let onUnauthorized: (() => void) | null = null;
/** O AuthContext registra aqui o que fazer quando a sessão expira de vez. */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  try {
    const res = await axios.post(
      `${API_BASE_URL}/accounts/api/v1/auth/token/refresh/`,
      { refresh },
    );
    const { access, refresh: newRefresh } = res.data as {
      access: string;
      refresh?: string;
    };
    await AsyncStorage.setItem(TOKEN_KEY, access);
    if (newRefresh) await AsyncStorage.setItem(REFRESH_KEY, newRefresh);
    return access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthCall = original?.url?.includes("/auth/token");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall
    ) {
      original._retry = true;
      refreshPromise =
        refreshPromise ??
        refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      const newToken = await refreshPromise;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Busca todas as páginas de um endpoint paginado do DRF. */
export async function fetchAll<T>(
  url: string,
  params?: Record<string, string | number>,
): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;
  let first = true;
  while (next) {
    const res: { data: T[] | { results: T[]; next: string | null } } =
      await api.get(next, {
        params: first ? params : undefined,
      });
    first = false;
    if (Array.isArray(res.data)) {
      items.push(...res.data);
      next = null;
    } else {
      items.push(...res.data.results);
      next = res.data.next;
    }
  }
  return items;
}
