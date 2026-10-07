import { Alert, Platform } from "react-native";

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MONTH_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

/** 1234.5 -> "R$ 1.234,50" */
export function formatCurrency(
  value: string | number | null | undefined,
): string {
  const n = typeof value === "number" ? value : parseFloat(value ?? "0");
  const safe = Number.isFinite(n) ? n : 0;
  const [int, dec] = Math.abs(safe).toFixed(2).split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${safe < 0 ? "-" : ""}R$ ${withDots},${dec}`;
}

/** Aceita "12,50", "1.234,56", "12.5". Retorna null se inválido. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/R\$|\s/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Formata digitação de moeda em tempo real (ex: digita "15" -> "0,15", digita "1500" -> "15,00") */
export function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  const [int, dec] = num.toFixed(2).split(".");
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots},${dec}`;
}

/** Data local (não UTC) no formato YYYY-MM-DD. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "2026-10-04" -> "04/10/2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** "04/10/2026" -> "2026-10-04" (ou null se inválida) */
export function brDateToIso(input: string): string | null {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() !== Number(mm) - 1 ||
    d.getDate() !== Number(dd)
  ) {
    return null;
  }
  return toIsoDate(d);
}

/** Extrai a primeira mensagem útil de um erro do axios/DRF. */
export function extractErrorMessage(
  err: any,
  fallback = "Algo deu errado. Tente novamente.",
): string {
  if (!err?.response) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está rodando.";
  }
  const data = err.response.data;
  const dig = (v: any): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.length ? dig(v[0]) : null;
    if (typeof v === "object") {
      if (v.detail) return dig(v.detail);
      for (const key of Object.keys(v)) {
        const found = dig(v[key]);
        if (found) return found;
      }
    }
    return null;
  };
  return dig(data) ?? fallback;
}

/** Mensagens de erro por campo (para mostrar embaixo de cada input). */
export function extractFieldErrors(err: any): Record<string, string> {
  const out: Record<string, string> = {};
  const data = err?.response?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const key of Object.keys(data)) {
      const v = data[key];
      out[key] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }
  return out;
}

/** Confirmação que funciona no celular e na web (Alert não tem botões na web). */
export function confirmAction(
  title: string,
  message: string,
  confirmText = "Excluir",
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmText,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
