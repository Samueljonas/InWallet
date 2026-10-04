export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface Account {
  id: number;
  name: string;
  balance: string;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

export interface Transaction {
  id: number;
  account: number;
  account_name?: string;
  category: number;
  category_name?: string;
  type: "income" | "expense";
  amount: string;
  date: string;
  description?: string;
  payment_method?: string;
  note?: string;
}

export interface DashboardMetrics {
  selected_year: number;
  selected_month: number;
  total_balance: string;
  monthly_income: string;
  monthly_expense: string;
  monthly_net: string;
  expenses_by_category: Array<{ category: string; total: string | number }>;
  monthly_summary: Array<{
    month: string;
    month_number: number | null;
    year: number | null;
    income: number;
    expense: number;
  }>;
}
