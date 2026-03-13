import { useState, useEffect } from 'react';
import { AppState, Category, Expense, BudgetItem } from './types';

const STORAGE_KEY = 'finance_app_state_v2';

const defaultCategories: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', color: '#10b981', isFixed: true },
  { id: 'cat-assinaturas', name: 'Assinaturas', color: '#3b82f6', isFixed: true },
  { id: 'cat-carro', name: 'Carro', color: '#f59e0b', isFixed: true },
  { id: 'cat-casa', name: 'Casa', color: '#ef4444', isFixed: true },
  { id: 'cat-consultorio', name: 'Consultório', color: '#8b5cf6', isFixed: true },
  { id: 'cat-eventuais', name: 'Eventuais', color: '#6b7280', isFixed: true },
  { id: 'cat-joca', name: 'Joca', color: '#ec4899', isFixed: true },
  { id: 'cat-lazer', name: 'Lazer', color: '#f97316', isFixed: true },
  { id: 'cat-mesadas', name: 'Mesadas', color: '#06b6d4', isFixed: true },
  { id: 'cat-saude', name: 'Saúde', color: '#14b8a6', isFixed: true },
  { id: 'cat-escape', name: 'Zona de escape', color: '#4b5563', isFixed: true },
];

const defaultBudgetItems: Record<string, BudgetItem[]> = {
  'cat-alimentacao': [
    { id: 'item-supermercado', name: 'Supermercado', amount: 0, isFixed: true },
    { id: 'item-acougue', name: 'Açougue', amount: 0, isFixed: true },
  ],
  'cat-assinaturas': [
    { id: 'item-netflix', name: 'Netflix', amount: 0, isFixed: true },
    { id: 'item-globoplay', name: 'Globoplay', amount: 0, isFixed: true },
    { id: 'item-ia', name: 'IA', amount: 0, isFixed: true },
    { id: 'item-spotify', name: 'Spotify', amount: 0, isFixed: true },
    { id: 'item-apple', name: 'Apple', amount: 0, isFixed: true },
  ],
  'cat-carro': [
    { id: 'item-gasolina', name: 'Gasolina', amount: 0, isFixed: true },
    { id: 'item-seguro', name: 'Seguro', amount: 0, isFixed: true },
  ],
  'cat-casa': [
    { id: 'item-financiamento', name: 'Financiamento', amount: 0, isFixed: true },
    { id: 'item-manutencao', name: 'Manutenção', amount: 0, isFixed: true },
  ],
  'cat-consultorio': [
    { id: 'item-aluguel', name: 'Aluguel', amount: 0, isFixed: true },
    { id: 'item-contabilidade', name: 'Contabilidade', amount: 0, isFixed: true },
  ],
  'cat-lazer': [
    { id: 'item-programas', name: 'Programas', amount: 0, isFixed: true },
    { id: 'item-comida', name: 'Comida', amount: 0, isFixed: true },
  ],
  'cat-mesadas': [
    { id: 'item-fernanda', name: 'Fernanda', amount: 0, isFixed: true },
    { id: 'item-philipe', name: 'Philipe', amount: 0, isFixed: true },
  ],
  'cat-saude': [
    { id: 'item-planos', name: 'Planos de saúde', amount: 0, isFixed: true },
    { id: 'item-farmacia', name: 'Farmácia', amount: 0, isFixed: true },
  ],
};

const currentMonth = new Date().toISOString().substring(0, 7);

const defaultState: AppState = {
  categories: defaultCategories,
  expenses: [],
  months: {
    [currentMonth]: {
      month: currentMonth,
      income: 0,
      budgets: Object.fromEntries(defaultCategories.map(c => [c.id, 0])),
      budgetItems: defaultBudgetItems,
      fixedBudgets: Object.fromEntries(defaultCategories.map(c => [c.id, true])),
      fixedCategories: Object.fromEntries(defaultCategories.map(c => [c.id, true])),
    }
  },
};

export function useFinanceStore() {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateIncome = (month: string, income: number) => {
    setState(s => ({
      ...s,
      months: {
        ...s.months,
        [month]: {
          ...(s.months[month] || { month, income: 0, budgets: {} }),
          income,
        }
      }
    }));
  };

  const updateBudget = (month: string, categoryId: string, amount: number, items: BudgetItem[], isFixedBudget: boolean) => {
    setState(s => {
      const monthData = s.months[month] || { month, income: 0, budgets: {}, budgetItems: {}, fixedBudgets: {}, fixedCategories: {} };
      return {
        ...s,
        months: {
          ...s.months,
          [month]: {
            ...monthData,
            budgets: {
              ...monthData.budgets,
              [categoryId]: amount,
            },
            budgetItems: {
              ...monthData.budgetItems,
              [categoryId]: items,
            },
            fixedBudgets: {
              ...monthData.fixedBudgets,
              [categoryId]: isFixedBudget,
            }
          }
        }
      };
    });
  };

  const updateCategoryFixedState = (month: string, categoryId: string, isFixed: boolean) => {
    setState(s => {
      const monthData = s.months[month] || { month, income: 0, budgets: {}, budgetItems: {}, fixedBudgets: {}, fixedCategories: {} };
      return {
        ...s,
        months: {
          ...s.months,
          [month]: {
            ...monthData,
            fixedCategories: {
              ...monthData.fixedCategories,
              [categoryId]: isFixed,
            }
          }
        }
      };
    });
  };

  const addCategory = (category: Category) => {
    setState(s => ({ ...s, categories: [...s.categories, category] }));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setState(s => ({
      ...s,
      categories: s.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const addExpense = (expense: Expense) => {
    setState(s => ({ ...s, expenses: [...s.expenses, expense] }));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState(s => ({
      ...s,
      expenses: s.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const deleteExpense = (id: string) => {
    setState(s => ({
      ...s,
      expenses: s.expenses.filter(e => e.id !== id)
    }));
  };

  return {
    state,
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
