import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  api,
  clearAuthTokens,
  getSecureItem,
  REFRESH_KEY,
  setSecureItem,
  setUnauthorizedHandler,
  TOKEN_KEY,
} from "../api/client";
import { User } from "../types";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await clearAuthTokens();
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.delete("/api/v1/auth/account/");
    await clearAuthTokens();
    await AsyncStorage.clear().catch(() => {});
    setUser(null);
  }, []);

  useEffect(() => {
    // Sessão expirou de vez (refresh falhou ou 401): volta para o login.
    setUnauthorizedHandler(() => setUser(null));
    loadStoredAuth();
    return () => setUnauthorizedHandler(null);
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await getSecureItem(TOKEN_KEY);
      if (token) {
        const response = await api.get<User>("/accounts/api/v1/auth/me/");
        setUser(response.data);
      }
    } catch {
      await clearAuthTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<User>("/accounts/api/v1/auth/me/");
      setUser(response.data);
    } catch {
      // Falha silenciosa se houver erro temporário de rede
    }
  }, []);

  async function login(username: string, password: string) {
    const response = await api.post<{ access: string; refresh: string }>(
      "/accounts/api/v1/auth/token/",
      {
        username: username.trim(),
        password,
      },
    );
    const { access, refresh } = response.data;
    await setSecureItem(TOKEN_KEY, access);
    await setSecureItem(REFRESH_KEY, refresh);

    const profile = await api.get<User>("/accounts/api/v1/auth/me/");
    setUser(profile.data);
  }

  async function register(
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    await api.post("/accounts/api/v1/auth/register/", {
      username: username.trim(),
      email: email.trim(),
      password,
      first_name: firstName?.trim() || "",
      last_name: lastName?.trim() || "",
    });
    await login(username, password);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
