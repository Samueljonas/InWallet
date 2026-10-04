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
  REFRESH_KEY,
  TOKEN_KEY,
  setUnauthorizedHandler,
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
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
    setUser(null);
  }, []);

  useEffect(() => {
    // Sessão expirou de vez (refresh falhou): volta para o login.
    setUnauthorizedHandler(() => setUser(null));
    loadStoredAuth();
    return () => setUnauthorizedHandler(null);
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        const response = await api.get<User>("/accounts/api/v1/auth/me/");
        setUser(response.data);
      }
    } catch {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const response = await api.post<{ access: string; refresh: string }>(
      "/accounts/api/v1/auth/token/",
      {
        username: username.trim(),
        password,
      },
    );
    const { access, refresh } = response.data;
    await AsyncStorage.setItem(TOKEN_KEY, access);
    await AsyncStorage.setItem(REFRESH_KEY, refresh);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
