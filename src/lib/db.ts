import { supabase } from './supabase';
import { AppState, Category, Expense, BudgetItem } from '../types';

// ─── Default seed data (used if DB is empty) ──────────────────────────────────

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

// ─── Fetch all (called once on app load) ──────────────────────────────────────

export async function fetchAllState(): Promise<AppState> {
  const [
    { data: cats, error: catsErr },
    { data: exps, error: expsErr },
    { data: incomes, error: incomesErr },
    { data: budgets, error: budgetsErr },
    { data: items, error: itemsErr },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('expenses').select('*'),
    supabase.from('month_income').select('*'),
    supabase.from('budgets').select('*'),
    supabase.from('budget_items').select('*'),
  ]);

  if (catsErr) throw catsErr;
  if (expsErr) throw expsErr;
  if (incomesErr) throw incomesErr;
  if (budgetsErr) throw budgetsErr;
  if (itemsErr) throw itemsErr;

  // If DB is empty, seed default categories
  const categories: Category[] = cats && cats.length > 0
    ? cats.map(r => ({ id: r.id, name: r.name, color: r.color, isFixed: r.is_fixed }))
    : defaultCategories;

  if (!cats || cats.length === 0) {
    await seedDefaultCategories(defaultCategories, defaultBudgetItems);
  }

  const expenses: Expense[] = (exps || []).map(r => ({
    id: r.id,
    categoryId: r.category_id,
    budgetItemId: r.budget_item_id ?? undefined,
    name: r.name,
    amount: r.amount,
    date: r.date,
    startMonth: r.start_month,
    duration: r.duration,
    description: r.description ?? undefined,
  }));

  // Build months map from budgets + incomes + budget_items
  const months: AppState['months'] = {};

  for (const row of budgets || []) {
    if (!months[row.month]) {
      months[row.month] = {
        month: row.month,
        income: 0,
        budgets: {},
        budgetItems: {},
        fixedBudgets: {},
        fixedCategories: {},
      };
    }
    months[row.month].budgets[row.category_id] = row.amount;
    months[row.month].fixedBudgets[row.category_id] = row.is_fixed_budget;
    months[row.month].fixedCategories[row.category_id] = row.is_fixed_category;
  }

  for (const row of incomes || []) {
    if (!months[row.month]) {
      months[row.month] = {
        month: row.month,
        income: 0,
        budgets: {},
        budgetItems: {},
        fixedBudgets: {},
        fixedCategories: {},
      };
    }
    months[row.month].income = row.income;
  }

  for (const row of items || []) {
    if (!months[row.month]) {
      months[row.month] = {
        month: row.month,
        income: 0,
        budgets: {},
        budgetItems: {},
        fixedBudgets: {},
        fixedCategories: {},
      };
    }
    if (!months[row.month].budgetItems[row.category_id]) {
      months[row.month].budgetItems[row.category_id] = [];
    }
    months[row.month].budgetItems[row.category_id].push({
      id: row.id,
      name: row.name,
      amount: row.amount,
      isFixed: row.is_fixed,
    });
  }

  return { categories, expenses, months };
}

async function seedDefaultCategories(
  categories: Category[],
  budgetItems: Record<string, BudgetItem[]>
) {
  await supabase.from('categories').insert(
    categories.map(c => ({ id: c.id, name: c.name, color: c.color, is_fixed: c.isFixed }))
  );

  const currentMonth = new Date().toISOString().substring(0, 7);
  await supabase.from('budgets').insert(
    categories.map(c => ({
      month: currentMonth,
      category_id: c.id,
      amount: 0,
      is_fixed_budget: true,
      is_fixed_category: true,
    }))
  );

  const itemRows: object[] = [];
  for (const [catId, items] of Object.entries(budgetItems)) {
    for (const item of items) {
      itemRows.push({
        id: item.id,
        month: currentMonth,
        category_id: catId,
        name: item.name,
        amount: item.amount,
        is_fixed: item.isFixed,
      });
    }
  }
  if (itemRows.length > 0) {
    await supabase.from('budget_items').insert(itemRows);
  }
}

// ─── Individual write operations ───────────────────────────────────────────────

export async function dbUpsertIncome(month: string, income: number) {
  const { error } = await supabase
    .from('month_income')
    .upsert({ month, income }, { onConflict: 'month' });
  if (error) console.error('upsertIncome', error);
}

export async function dbUpsertBudget(
  month: string,
  categoryId: string,
  amount: number,
  items: BudgetItem[],
  isFixedBudget: boolean,
  isFixedCategory: boolean
) {
  const { error: bErr } = await supabase
    .from('budgets')
    .upsert(
      { month, category_id: categoryId, amount, is_fixed_budget: isFixedBudget, is_fixed_category: isFixedCategory },
      { onConflict: 'month,category_id' }
    );
  if (bErr) console.error('upsertBudget', bErr);

  // Replace all budget_items for this month+category
  await supabase
    .from('budget_items')
    .delete()
    .eq('month', month)
    .eq('category_id', categoryId);

  if (items.length > 0) {
    const { error: iErr } = await supabase.from('budget_items').insert(
      items.map(i => ({
        id: i.id,
        month,
        category_id: categoryId,
        name: i.name,
        amount: i.amount,
        is_fixed: i.isFixed,
      }))
    );
    if (iErr) console.error('insertBudgetItems', iErr);
  }
}

export async function dbUpsertFixedCategory(
  month: string,
  categoryId: string,
  isFixed: boolean,
  currentMonths: AppState['months']
) {
  const existing = currentMonths[month]?.budgets[categoryId] ?? 0;
  const isFixedBudget = currentMonths[month]?.fixedBudgets[categoryId] ?? true;
  const { error } = await supabase
    .from('budgets')
    .upsert(
      { month, category_id: categoryId, amount: existing, is_fixed_budget: isFixedBudget, is_fixed_category: isFixed },
      { onConflict: 'month,category_id' }
    );
  if (error) console.error('upsertFixedCategory', error);
}

export async function dbUpsertCategory(category: Category) {
  const { error } = await supabase
    .from('categories')
    .upsert({ id: category.id, name: category.name, color: category.color, is_fixed: category.isFixed });
  if (error) console.error('upsertCategory', error);
}

export async function dbInsertExpense(expense: Expense) {
  const { error } = await supabase.from('expenses').insert({
    id: expense.id,
    category_id: expense.categoryId,
    budget_item_id: expense.budgetItemId ?? null,
    name: expense.name,
    amount: expense.amount,
    date: expense.date,
    start_month: expense.startMonth,
    duration: expense.duration,
    description: expense.description ?? null,
  });
  if (error) console.error('insertExpense', error);
}

export async function dbUpdateExpense(id: string, updates: Partial<Expense>) {
  const row: Record<string, unknown> = {};
  if (updates.categoryId !== undefined) row.category_id = updates.categoryId;
  if (updates.budgetItemId !== undefined) row.budget_item_id = updates.budgetItemId;
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.startMonth !== undefined) row.start_month = updates.startMonth;
  if (updates.duration !== undefined) row.duration = updates.duration;
  if (updates.description !== undefined) row.description = updates.description;
  const { error } = await supabase.from('expenses').update(row).eq('id', id);
  if (error) console.error('updateExpense', error);
}

export async function dbDeleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) console.error('deleteExpense', error);
}
