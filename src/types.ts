export type Category = {
  id: string;
  name: string;
  color: string;
  isFixed: boolean;
};

export type Expense = {
  id: string;
  categoryId: string;
  budgetItemId?: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  startMonth: string; // YYYY-MM
  duration: number; // 1+
  description?: string;
};

export type BudgetItem = {
  id: string;
  name: string;
  amount: number;
  isFixed: boolean;
};

export type MonthData = {
  month: string; // YYYY-MM
  income: number;
  budgets: Record<string, number>; // categoryId -> amount
  budgetItems: Record<string, BudgetItem[]>; // categoryId -> items
  fixedBudgets: Record<string, boolean>; // categoryId -> isFixed
  fixedCategories: Record<string, boolean>; // categoryId -> isFixed
};

export type AppState = {
  categories: Category[];
  expenses: Expense[];
  months: Record<string, MonthData>;
};
