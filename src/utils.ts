import { AppState, Expense, BudgetItem } from './types';

export const getMonthDiff = (start: string, end: string) => {
  const [sY, sM] = start.split('-').map(Number);
  const [eY, eM] = end.split('-').map(Number);
  return (eY - sY) * 12 + (eM - sM);
};

export const getBudgetsForMonth = (month: string, state: AppState) => {
  const sortedMonths = Object.keys(state.months).sort();
  let currentBudgets: Record<string, number> = {};
  let currentBudgetItems: Record<string, BudgetItem[]> = {};
  let currentFixedBudgets: Record<string, boolean> = {};
  let currentFixedCategories: Record<string, boolean> = {};
  
  // Initialize with global fixed state from categories
  state.categories.forEach(cat => {
    currentFixedCategories[cat.id] = cat.isFixed;
  });

  for (const m of sortedMonths) {
    if (m > month) break;
    const monthData = state.months[m];
    if (!monthData) continue;

    state.categories.forEach(cat => {
      // Category fixed state
      if (monthData.fixedCategories && monthData.fixedCategories[cat.id] !== undefined) {
        currentFixedCategories[cat.id] = monthData.fixedCategories[cat.id];
      }

      // Budget
      if (monthData.budgets[cat.id] !== undefined) {
        currentBudgets[cat.id] = monthData.budgets[cat.id];
      } else if (!currentFixedBudgets[cat.id]) {
        currentBudgets[cat.id] = 0;
      }
      
      // Fixed budget flag
      if (monthData.fixedBudgets[cat.id] !== undefined) {
        currentFixedBudgets[cat.id] = monthData.fixedBudgets[cat.id];
      }

      // Items
      if (monthData.budgetItems[cat.id]) {
        currentBudgetItems[cat.id] = monthData.budgetItems[cat.id];
      } else {
        currentBudgetItems[cat.id] = (currentBudgetItems[cat.id] || []).filter(item => item.isFixed);
      }
    });
  }

  // Filter categories that are active for this month
  // A category is active if:
  // 1. It is currently "fixed" (currentFixedCategories[id] is true)
  // 2. OR it was explicitly defined in this month (even if not fixed)
  const activeCategories = state.categories.filter(cat => {
    const isFixed = currentFixedCategories[cat.id];
    const isDefinedInMonth = state.months[month]?.budgets[cat.id] !== undefined;
    return isFixed || isDefinedInMonth;
  });

  return { 
    budgets: currentBudgets, 
    budgetItems: currentBudgetItems, 
    activeCategories,
    fixedBudgets: currentFixedBudgets,
    fixedCategories: currentFixedCategories
  };
};

export const getIncomeForMonth = (month: string, state: AppState): number => {
  if (state.months[month]?.income !== undefined) {
    return state.months[month].income;
  }
  const sortedMonths = Object.keys(state.months).sort().reverse();
  const prevMonth = sortedMonths.find(m => m < month && state.months[m]?.income !== undefined);
  if (prevMonth) {
    return state.months[prevMonth].income;
  }
  return 0;
};

export const getActiveExpenses = (month: string, state: AppState): Expense[] => {
  return state.expenses.filter(e => {
    const diff = getMonthDiff(e.startMonth, month);
    return diff >= 0 && diff < e.duration;
  });
};

export const formatMonth = (monthStr: string) => {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};

export const addMonths = (monthStr: string, months: number) => {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};
