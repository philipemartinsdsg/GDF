import { useState, useEffect } from 'react';
import { AppState, Category, Expense, BudgetItem } from './types';
import {
  fetchAllState,
  dbUpsertIncome,
  dbUpsertBudget,
  dbUpsertFixedCategory,
  dbUpsertCategory,
  dbInsertExpense,
  dbUpdateExpense,
  dbDeleteExpense,
} from './lib/db';

const emptyState: AppState = { categories: [], expenses: [], months: {} };

export function useFinanceStore() {
  const [state, setState] = useState<AppState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllState()
      .then(setState)
      .catch(e => setError(e.message ?? 'Failed to load data'))
      .finally(() => setIsLoading(false));
  }, []);

  const updateIncome = (month: string, income: number) => {
    setState(s => ({
      ...s,
      months: {
        ...s.months,
        [month]: {
          ...(s.months[month] || { month, income: 0, budgets: {}, budgetItems: {}, fixedBudgets: {}, fixedCategories: {} }),
          income,
        }
      }
    }));
    dbUpsertIncome(month, income);
  };

  const updateBudget = (month: string, categoryId: string, amount: number, items: BudgetItem[], isFixedBudget: boolean) => {
    setState(s => {
      const monthData = s.months[month] || { month, income: 0, budgets: {}, budgetItems: {}, fixedBudgets: {}, fixedCategories: {} };
      const isFixedCategory = s.months[month]?.fixedCategories[categoryId] ?? true;
      dbUpsertBudget(month, categoryId, amount, items, isFixedBudget, isFixedCategory);
      return {
        ...s,
        months: {
          ...s.months,
          [month]: {
            ...monthData,
            budgets: { ...monthData.budgets, [categoryId]: amount },
            budgetItems: { ...monthData.budgetItems, [categoryId]: items },
            fixedBudgets: { ...monthData.fixedBudgets, [categoryId]: isFixedBudget },
          }
        }
      };
    });
  };

  const updateCategoryFixedState = (month: string, categoryId: string, isFixed: boolean) => {
    setState(s => {
      const monthData = s.months[month] || { month, income: 0, budgets: {}, budgetItems: {}, fixedBudgets: {}, fixedCategories: {} };
      dbUpsertFixedCategory(month, categoryId, isFixed, s.months);
      return {
        ...s,
        months: {
          ...s.months,
          [month]: {
            ...monthData,
            fixedCategories: { ...monthData.fixedCategories, [categoryId]: isFixed },
          }
        }
      };
    });
  };

  const addCategory = (category: Category) => {
    setState(s => ({ ...s, categories: [...s.categories, category] }));
    dbUpsertCategory(category);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setState(s => {
      const cat = s.categories.find(c => c.id === id);
      if (cat) dbUpsertCategory({ ...cat, ...updates });
      return {
        ...s,
        categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      };
    });
  };

  const addExpense = (expense: Expense) => {
    setState(s => ({ ...s, expenses: [...s.expenses, expense] }));
    dbInsertExpense(expense);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState(s => ({
      ...s,
      expenses: s.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
    dbUpdateExpense(id, updates);
  };

  const deleteExpense = (id: string) => {
    setState(s => ({ ...s, expenses: s.expenses.filter(e => e.id !== id) }));
    dbDeleteExpense(id);
  };

  return {
    state,
    isLoading,
    error,
    updateIncome,
    updateBudget,
    addCategory,
    updateCategory,
    addExpense,
    updateExpense,
    deleteExpense,
    updateCategoryFixedState,
  };
}
