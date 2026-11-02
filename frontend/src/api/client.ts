import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

// Chaves compatíveis com o padrão do Keychain/KeyStore nativo (apenas alfanuméricos, ".", "-" e "_")
export const TOKEN_KEY = "inwallet_access_token";
export const REFRESH_KEY = "inwallet_refresh_token";
const LEGACY_TOKEN_KEY = "@inwallet:token";
const LEGACY_REFRESH_KEY = "@inwallet:refresh";

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * Lê um item do armazenamento seguro criptografado (Keychain no iOS / EncryptedSharedPreferences + KeyStore no Android).
 * No ambiente Web, onde o hardware KeyStore não está disponível, utiliza fallback controlado.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS !== "web") {
      return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
    }
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Salva um token de forma criptografada no armazenamento seguro nativo.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

/**
 * Remove um item do armazenamento seguro nativo.
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // Ignora falhas de limpeza se a chave já não existir
  }
}

/**
 * Remove todos os tokens de sessão do SecureStore e limpa eventuais resíduos legados do AsyncStorage.
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    deleteSecureItem(TOKEN_KEY),
    deleteSecureItem(REFRESH_KEY),
    AsyncStorage.multiRemove([
      TOKEN_KEY,
      REFRESH_KEY,
      LEGACY_TOKEN_KEY,
      LEGACY_REFRESH_KEY,
    ]).catch(() => {}),
  ]);
}

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
  const token = await getSecureItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getSecureItem(REFRESH_KEY);
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
    await setSecureItem(TOKEN_KEY, access);
    if (newRefresh) await setSecureItem(REFRESH_KEY, newRefresh);
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
    const url = original?.url ?? "";
    const isLoginOrRegisterCall =
      url.endsWith("/auth/token/") || url.includes("/auth/register/");

    if (error.response?.status === 401 && !isLoginOrRegisterCall) {
      if (original && !original._retry && !url.includes("/auth/token/refresh/")) {
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
      }

      // Sessão inválida ou expirada definitivamente: limpa o armazenamento seguro e redireciona ao login
      await clearAuthTokens();
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
