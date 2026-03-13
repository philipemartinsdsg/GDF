/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, DollarSign, PieChart, TrendingUp, Calendar, Wallet, BarChart2, ChevronDown, ChevronUp, HelpCircle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useFinanceStore } from './store';
import { getBudgetsForMonth, getIncomeForMonth, getActiveExpenses, getMonthDiff, formatMonth, addMonths, generateId } from './utils';
import { Category, Expense, BudgetItem, AppState } from './types';

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-mist flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-midnight">{title}</h3>
          <button onClick={onClose} className="text-silver hover:text-slate text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

function SimplePromptForm({ label, initialValue, onSubmit, onCancel }: { label: string, initialValue: number, onSubmit: (val: number) => void, onCancel: () => void }) {
  const [value, setValue] = useState(initialValue?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(parseFloat(value) || 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate mb-1">{label}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-silver sm:text-sm">R$</span>
          </div>
          <input required type="number" step="0.01" min="0" value={value} onChange={e => setValue(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none" />
        </div>
      </div>
      <div className="pt-4 flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate bg-white border border-silver rounded-lg hover:bg-snow">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark">Salvar</button>
      </div>
    </form>
  );
}

function CategoryForm({ initialData, existingCategories = [], onSubmit, onCancel }: { initialData?: Category, existingCategories?: Category[], onSubmit: (data: Partial<Category>) => void, onCancel: () => void }) {
  const defaultColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1',
    '#84cc16', '#eab308', '#d946ef', '#0ea5e9'
  ];

  const getDistinctColor = () => {
    const usedColors = existingCategories.map(c => c.color.toLowerCase());
    const available = defaultColors.filter(c => !usedColors.includes(c));
    if (available.length > 0) return available[0];
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || getDistinctColor());
  const [isFixed, setIsFixed] = useState(initialData?.isFixed ?? true);

  React.useEffect(() => {
    if (!initialData && name.trim().length > 0) {
      const match = existingCategories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
      if (match) {
        setColor(match.color);
        setIsFixed(match.isFixed);
      }
    }
  }, [name, existingCategories, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, color, isFixed });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Nome da Categoria</label>
        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none" placeholder="ex. Lazer" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Cor</label>
        <input required type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 border border-silver rounded-lg cursor-pointer" />
      </div>
      <div className="bg-snow p-3 rounded-lg border border-mist">
        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            id="isFixed" 
            checked={isFixed} 
            onChange={e => setIsFixed(e.target.checked)}
            className="w-4 h-4 text-teal border-silver rounded focus:ring-teal"
          />
          <label htmlFor="isFixed" className="text-sm font-medium text-midnight cursor-pointer">Tornar fixa</label>
        </div>
        <p className="text-xs text-silver mt-1 ml-6">Categorias marcadas passam a existir em todos os meses futuros.</p>
      </div>
      <div className="pt-4 flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate bg-white border border-silver rounded-lg hover:bg-snow">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark">Salvar</button>
      </div>
    </form>
  );
}

function ExpenseForm({ initialData, categoryId, categories, state, onSubmit, onCancel, onDelete }: { initialData?: Expense, categoryId?: string, currentMonth: string, categories: Category[], state: AppState, onSubmit: (data: Partial<Expense>) => void, onCancel: () => void, onDelete?: () => void }) {
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId || categoryId || (categories.length > 0 ? categories[0].id : ''));
  const [budgetItemId, setBudgetItemId] = useState(initialData?.budgetItemId || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const selectedMonth = date.substring(0, 7);
  const { budgetItems } = useMemo(() => getBudgetsForMonth(selectedMonth, state), [selectedMonth, state]);
  const currentCategoryBudgetItems = budgetItems[selectedCategoryId] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      name: budgetItemId && budgetItemId !== 'custom' 
        ? currentCategoryBudgetItems.find(i => i.id === budgetItemId)?.name || name 
        : name,
      budgetItemId: budgetItemId === 'custom' ? undefined : budgetItemId,
      amount: parseFloat(amount),
      date,
      duration: 1,
      startMonth: date.substring(0, 7),
      categoryId: selectedCategoryId,
      description
    });
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate mb-4">Você precisa criar uma categoria primeiro.</p>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate bg-white border border-silver rounded-lg hover:bg-snow">Fechar</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Categoria</label>
        <select 
          required 
          value={selectedCategoryId} 
          onChange={e => {
            setSelectedCategoryId(e.target.value);
            setBudgetItemId('');
            setName('');
          }} 
          className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none bg-white"
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Nome da Despesa</label>
        {currentCategoryBudgetItems.length > 0 ? (
          <div className="space-y-2">
            <select
              required
              value={budgetItemId}
              onChange={e => {
                const val = e.target.value;
                setBudgetItemId(val);
                if (val !== 'custom' && val !== '') {
                  setName(currentCategoryBudgetItems.find(i => i.id === val)?.name || '');
                } else if (val === '') {
                  setName('');
                }
              }}
              className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none bg-white"
            >
              <option value="" disabled>Selecione um item...</option>
              {currentCategoryBudgetItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
              <option value="custom">Outro...</option>
            </select>
            {budgetItemId === 'custom' && (
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none" 
                placeholder="ex. Supermercado" 
              />
            )}
          </div>
        ) : (
          <input 
            required 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none" 
            placeholder="ex. Supermercado" 
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Valor</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-silver sm:text-sm">R$</span>
          </div>
          <input required type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none" placeholder="0,00" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Data</label>
        <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate mb-1">Descrição (Opcional)</label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none resize-none" 
          placeholder="Detalhes adicionais..."
          rows={2}
        />
      </div>
      <div className="pt-4 flex justify-between">
        {initialData && onDelete ? (
          <button type="button" onClick={onDelete} className="text-amber hover:text-coral text-sm font-medium px-4 py-2">Excluir</button>
        ) : <div></div>}
        <div className="flex space-x-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate bg-white border border-silver rounded-lg hover:bg-snow">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark">Salvar</button>
        </div>
      </div>
    </form>
  );
}

function BudgetForm({ category, initialAmount, initialItems, initialIsFixed, onSubmit, onCancel }: { category: Category, initialAmount: number, initialItems: BudgetItem[], initialIsFixed: boolean, onSubmit: (val: number, items: BudgetItem[], isFixed: boolean) => void, onCancel: () => void }) {
  const [amount, setAmount] = useState(initialAmount?.toString() || '');
  const [items, setItems] = useState<BudgetItem[]>(initialItems || []);
  const [isFixed, setIsFixed] = useState(initialIsFixed);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemIsFixed, setNewItemIsFixed] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  const hasItems = items.length > 0;
  const displayAmount = hasItems ? items.reduce((s, i) => s + i.amount, 0) : (parseFloat(amount) || 0);

  const handleAddItem = () => {
    if (newItemName.trim() && newItemAmount) {
      setItems([...items, { id: generateId(), name: newItemName.trim(), amount: parseFloat(newItemAmount), isFixed: newItemIsFixed }]);
      setNewItemName('');
      setNewItemAmount('');
      setNewItemIsFixed(true);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItemName = (id: string, name: string) => {
    setItems(items.map(i => i.id === id ? { ...i, name } : i));
  };

  const handleUpdateItemAmount = (id: string, amount: string) => {
    setItems(items.map(i => i.id === id ? { ...i, amount: parseFloat(amount) || 0 } : i));
  };

  const handleUpdateItemFixed = (id: string, fixed: boolean) => {
    setItems(items.map(i => i.id === id ? { ...i, isFixed: fixed } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = hasItems ? displayAmount : (parseFloat(amount) || 0);
    
    if (finalAmount !== initialAmount && isFixed) {
      setShowPrompt(true);
    } else {
      onSubmit(finalAmount, items, isFixed);
    }
  };

  if (showPrompt) {
    const finalAmount = hasItems ? displayAmount : (parseFloat(amount) || 0);
    return (
      <div className="space-y-6 py-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-6 h-6 text-teal" />
          </div>
          <h3 className="text-lg font-semibold text-midnight mb-2">Novo valor fixo?</h3>
          <p className="text-sm text-slate">Você alterou o orçamento de {category.name}. Deseja tornar este valor o novo valor fixo desta categoria para os próximos meses?</p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={() => onSubmit(finalAmount, items, true)}
            className="w-full py-3 px-4 bg-teal text-white rounded-xl font-medium hover:bg-teal-dark transition-colors"
          >
            Sim, tornar fixo
          </button>
          <button 
            onClick={() => onSubmit(finalAmount, items, false)}
            className="w-full py-3 px-4 bg-white border border-silver text-slate rounded-xl font-medium hover:bg-snow transition-colors"
          >
            Manter valor anterior como fixo e alterar apenas este mês
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate mb-1">Orçamento Total para {category.name}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-silver sm:text-sm">R$</span>
          </div>
          <input 
            type="number" 
            step="0.01" 
            min="0" 
            value={hasItems ? displayAmount : amount} 
            onChange={e => setAmount(e.target.value)} 
            disabled={hasItems}
            className={`w-full pl-9 pr-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none ${hasItems ? 'bg-mist text-silver' : ''}`} 
          />
        </div>
        {hasItems && <p className="text-xs text-silver mt-1">O total é calculado automaticamente a partir dos itens abaixo.</p>}
        
        <div className="mt-3 bg-snow p-3 rounded-lg border border-mist">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="isFixedBudget" 
              checked={isFixed} 
              onChange={e => setIsFixed(e.target.checked)}
              className="w-4 h-4 text-teal border-silver rounded focus:ring-teal"
            />
            <label htmlFor="isFixedBudget" className="text-sm font-medium text-midnight cursor-pointer">Tornar orçamento fixo</label>
          </div>
          <p className="text-xs text-silver mt-1 ml-6">Este valor será utilizado como base para todos os próximos meses.</p>
        </div>
      </div>

      <div className="border-t border-mist pt-4">
        <label className="block text-sm font-medium text-slate mb-3">Itens de Orçamento (Opcional)</label>
        
        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex flex-col gap-2 bg-snow p-3 rounded-lg border border-mist">
                <div className="flex gap-2 items-center">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={e => handleUpdateItemName(item.id, e.target.value)} 
                      className="w-full px-2 py-1.5 bg-white border border-mist rounded-md focus:ring-1 focus:ring-teal focus:border-teal outline-none text-sm"
                    />
                  </div>
                  <div className="w-1/3 relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <span className="text-silver text-xs">R$</span>
                    </div>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={item.amount || ''} 
                      onChange={e => handleUpdateItemAmount(item.id, e.target.value)} 
                      className="w-full pl-6 pr-2 py-1.5 bg-white border border-mist rounded-md focus:ring-1 focus:ring-teal focus:border-teal outline-none text-sm"
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-amber hover:text-coral p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id={`fixed-${item.id}`}
                    checked={item.isFixed} 
                    onChange={e => handleUpdateItemFixed(item.id, e.target.checked)}
                    className="w-3.5 h-3.5 text-teal border-silver rounded focus:ring-teal"
                  />
                  <label htmlFor={`fixed-${item.id}`} className="text-xs text-slate cursor-pointer">Item fixo para todos os meses</label>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 bg-mist/30 p-3 rounded-lg border border-dashed border-silver">
          <div className="flex gap-2 items-center">
            <div className="flex-grow">
              <input 
                type="text" 
                placeholder="Nome do item (ex: Luz)" 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                className="w-full px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-sm"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
              />
            </div>
            <div className="w-1/3 relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <span className="text-silver text-xs">R$</span>
              </div>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                placeholder="0,00" 
                value={newItemAmount} 
                onChange={e => setNewItemAmount(e.target.value)} 
                className="w-full pl-7 pr-2 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-sm"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddItem}
              disabled={!newItemName.trim() || !newItemAmount}
              className="p-2 bg-teal text-white rounded-lg hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="newItemIsFixed"
              checked={newItemIsFixed} 
              onChange={e => setNewItemIsFixed(e.target.checked)}
              className="w-3.5 h-3.5 text-teal border-silver rounded focus:ring-teal"
            />
            <label htmlFor="newItemIsFixed" className="text-xs text-slate cursor-pointer">Item fixo para todos os meses</label>
          </div>
        </div>
      </div>

      </div>
      <div className="pt-4 mt-2 border-t border-mist flex justify-end space-x-3 flex-shrink-0">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate bg-white border border-silver rounded-lg hover:bg-snow">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark">Salvar</button>
      </div>
    </form>
  );
}

function OverviewTab({ state, currentMonth }: { state: AppState, currentMonth: string }) {
  const [monthsToView, setMonthsToView] = useState(6);
  const [metricView, setMetricView] = useState<'general' | 'categories' | 'expenses'>('general');

  const data = useMemo(() => {
    const result = [];
    for (let i = 0; i < monthsToView; i++) {
      const month = addMonths(currentMonth, i);
      const income = getIncomeForMonth(month, state);
      const { budgets, budgetItems } = getBudgetsForMonth(month, state);
      const activeExpenses = getActiveExpenses(month, state);
      
      let totalBudgeted = 0;
      const categoryBudgets: Record<string, number> = {};
      
      state.categories.forEach(cat => {
        const items = budgetItems[cat.id] || [];
        const catBudget = items.length > 0 ? items.reduce((s, i) => s + i.amount, 0) : (budgets[cat.id] || 0);
        totalBudgeted += catBudget;
        categoryBudgets[cat.name] = catBudget;
      });

      const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Format month to be shorter for the X axis
      const dateObj = new Date(month + '-01T00:00:00');
      const shortMonth = dateObj.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

      result.push({
        name: shortMonth,
        fullName: formatMonth(month),
        month,
        income,
        budgeted: totalBudgeted,
        margin: income - totalBudgeted,
        expenses: totalExpenses,
        budgetBalance: totalBudgeted - totalExpenses,
        ...categoryBudgets
      });
    }
    return result;
  }, [currentMonth, monthsToView, state]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-midnight">Visão Geral</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={metricView} 
            onChange={e => setMetricView(e.target.value as any)}
            className="px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none bg-white text-sm"
          >
            <option value="general">Balanço Geral (Renda vs Orçamento)</option>
            <option value="categories">Composição por Categoria</option>
            <option value="expenses">Orçamento vs Gastos Lançados</option>
          </select>
          <select 
            value={monthsToView} 
            onChange={e => setMonthsToView(Number(e.target.value))}
            className="px-3 py-2 border border-silver rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none bg-white text-sm"
          >
            <option value={3}>Próximos 3 meses</option>
            <option value={6}>Próximos 6 meses</option>
            <option value={9}>Próximos 9 meses</option>
            <option value={12}>Próximos 12 meses</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {metricView === 'general' ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Bar dataKey="income" name="Renda Mensal" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budgeted" name="Orçamento Alocado" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="margin" name="Margem" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : metricView === 'categories' ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                {state.categories.map((cat, index) => (
                  <Bar key={cat.id} dataKey={cat.name} name={cat.name} stackId="a" fill={cat.color || '#3b82f6'} />
                ))}
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Bar dataKey="budgeted" name="Orçamento Total" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Gastos Lançados" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budgetBalance" name="Saldo do Orçamento" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(d => (
          <div key={d.month} className="bg-white rounded-xl p-5 shadow-sm border border-mist">
            <h3 className="font-medium text-midnight mb-3 capitalize">{d.fullName}</h3>
            
            {metricView === 'general' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-silver">Renda Mensal</span>
                  <span className="font-medium text-teal font-mono">R$ {d.income.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-silver">Orçamento Alocado</span>
                  <span className="font-medium text-teal font-mono">R$ {d.budgeted.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="pt-2 border-t border-mist flex justify-between text-sm">
                  <span className="text-silver">Margem</span>
                  <span className={`font-medium ${d.margin >= 0 ? 'text-amber' : 'text-amber'} font-mono`}>R$ {d.margin.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            )}

            {metricView === 'categories' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-slate">Orçamento Total</span>
                  <span className="text-teal font-mono">R$ {d.budgeted.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-mist">
                  {state.categories.slice(0, 4).map(cat => {
                    const val = d[cat.name] as number || 0;
                    if (val === 0) return null;
                    return (
                      <div key={cat.id} className="flex justify-between text-xs">
                        <span className="text-silver truncate pr-2 flex items-center">
                          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: cat.color }}></span>
                          {cat.name}
                        </span>
                        <span className="font-medium text-slate font-mono">R$ {val.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    );
                  })}
                  {state.categories.length > 4 && (
                    <div className="text-xs text-silver italic pt-1">E mais categorias...</div>
                  )}
                </div>
              </div>
            )}

            {metricView === 'expenses' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-silver">Orçamento Total</span>
                  <span className="font-medium text-teal font-mono">R$ {d.budgeted.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-silver">Gastos Lançados</span>
                  <span className="font-medium text-amber font-mono">R$ {d.expenses.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="pt-2 border-t border-mist flex justify-between text-sm">
                  <span className="text-silver">Saldo do Orçamento</span>
                  <span className={`font-medium ${d.budgetBalance >= 0 ? 'text-teal' : 'text-amber'} font-mono`}>R$ {d.budgetBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { state, updateIncome, updateBudget, addCategory, updateCategory, addExpense, updateExpense, deleteExpense, updateCategoryFixedState } = useFinanceStore();
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<'month' | 'overview'>('month');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // Modals state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState<{isOpen: boolean, categoryId?: string}>({ isOpen: false });
  const [categoryModalOpen, setCategoryModalOpen] = useState<{isOpen: boolean, category?: Category}>({ isOpen: false });
  const [expenseModalOpen, setExpenseModalOpen] = useState<{isOpen: boolean, categoryId?: string, expense?: Expense}>({ isOpen: false });

  const income = getIncomeForMonth(currentMonth, state);
  const { budgets, budgetItems, fixedBudgets } = getBudgetsForMonth(currentMonth, state);
  const activeExpenses = getActiveExpenses(currentMonth, state);

  const totalBudgeted = state.categories.reduce((sum, cat) => {
    const items = budgetItems[cat.id] || [];
    const catBudget = items.length > 0 ? items.reduce((s, i) => s + i.amount, 0) : (budgets[cat.id] || 0);
    return sum + catBudget;
  }, 0);
  const totalSpent = activeExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handlePrevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="min-h-screen bg-snow font-sans text-midnight pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-mist sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-2 text-teal">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold hidden sm:block">Finanças pessoais</span>
            </div>
            <div className="flex bg-mist p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('month')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'month' ? 'bg-white text-midnight shadow-sm' : 'text-silver hover:text-slate'}`}
              >
                Mês Atual
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-midnight shadow-sm' : 'text-silver hover:text-slate'}`}
              >
                Visão Geral
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pb-2">
            <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-mist transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate" />
            </button>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-silver" />
              <span className="font-medium text-midnight text-sm">{formatMonth(currentMonth)}</span>
            </div>
            <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-mist transition-colors">
              <ChevronRight className="w-4 h-4 text-slate" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' ? (
          <OverviewTab state={state} currentMonth={currentMonth} />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div 
            onClick={() => setIncomeModalOpen(true)}
            className="bg-white rounded-xl p-6 shadow-sm border border-mist cursor-pointer hover:border-teal hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-cloud rounded-lg text-teal">
                <DollarSign className="w-5 h-5" />
              </div>
              <Edit2 className="w-4 h-4 text-silver group-hover:text-teal transition-colors" />
            </div>
            <div className="text-sm text-silver font-medium mb-1">Renda Mensal</div>
            <div className="text-2xl font-semibold text-midnight font-mono">R$ {income.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-cloud rounded-lg text-teal">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-sm text-silver font-medium mb-1">Orçamento Alocado</div>
            <div className="text-2xl font-semibold text-midnight font-mono">R$ {totalBudgeted.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-xs text-silver mt-2">
              {income > 0 ? `${((totalBudgeted / income) * 100).toFixed(0)}% da renda` : 'Sem renda definida'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-mist">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-amber/10 rounded-lg text-amber">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-sm text-silver font-medium mb-1">Total de Despesas</div>
            <div className="text-2xl font-semibold text-midnight font-mono">R$ {totalSpent.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className="text-xs text-silver mt-2">
              {totalBudgeted > 0 ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}% do orçamento` : 'Sem orçamento definido'}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-midnight">Orçamentos e Despesas</h2>
            <button 
              onClick={() => setCategoryModalOpen({ isOpen: true })} 
              className="text-sm text-teal hover:text-teal-dark font-medium flex items-center bg-cloud px-3 py-1.5 rounded-full hover:bg-sage transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Categoria
            </button>
          </div>
          
          {state.categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-silver">
              <PieChart className="w-12 h-12 text-silver mx-auto mb-3" />
              <h3 className="text-lg font-medium text-midnight mb-1">Nenhuma categoria ainda</h3>
              <p className="text-silver mb-4">Crie uma categoria para começar a acompanhar seu orçamento.</p>
              <button 
                onClick={() => setCategoryModalOpen({ isOpen: true })} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal rounded-lg hover:bg-teal-dark"
              >
                <Plus className="w-4 h-4 mr-2" /> Criar Categoria
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {state.categories.map(category => {
                const items = budgetItems[category.id] || [];
                const catBudget = items.length > 0 ? items.reduce((s, i) => s + i.amount, 0) : (budgets[category.id] || 0);
                const catExpenses = activeExpenses.filter(e => e.categoryId === category.id);
                const catSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
                const progress = catBudget > 0 ? Math.min((catSpent / catBudget) * 100, 100) : 0;
                const overBudget = catSpent > catBudget;

                return (
                  <div key={category.id} className="bg-white rounded-xl p-6 shadow-sm border border-mist flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center cursor-pointer group" onClick={() => setCategoryModalOpen({ isOpen: true, category })}>
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: category.color }} />
                        <h3 className="font-medium text-midnight group-hover:text-teal transition-colors flex items-center">
                          {category.name}
                          <Edit2 className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 text-silver" />
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-silver uppercase tracking-wider font-medium mb-0.5">Orçamento</div>
                        <div 
                          className="font-semibold text-midnight cursor-pointer hover:text-teal flex items-center justify-end group" 
                          onClick={() => setBudgetModalOpen({ isOpen: true, categoryId: category.id })}
                        >
                          R$ {catBudget.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          <Edit2 className="w-3 h-3 ml-1.5 opacity-0 group-hover:opacity-100 text-silver" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-silver">Gasto: R$ {catSpent.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        <span className={overBudget ? 'text-amber font-medium' : 'text-silver'}>
                          Restante: R$ {(catBudget - catSpent).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-mist rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-amber' : ''}`}
                          style={{ width: `${progress}%`, backgroundColor: overBudget ? undefined : category.color }}
                        />
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="mb-4 bg-snow rounded-lg p-3 border border-mist">
                        <div className="flex justify-between text-[10px] text-silver uppercase tracking-wider font-bold mb-2 px-1">
                          <span>Item</span>
                          <div className="flex space-x-12">
                            <span>Gasto</span>
                            <span>Orçamento</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {items.map(item => {
                            const itemSpent = catExpenses
                              .filter(e => e.budgetItemId === item.id)
                              .reduce((sum, e) => sum + e.amount, 0);
                            return (
                              <div key={item.id} className="flex justify-between items-center text-sm px-1">
                                <span className="text-slate truncate pr-2">{item.name}</span>
                                <div className="flex space-x-6 items-center shrink-0">
                                  <span className="text-xs text-silver font-mono">R$ {itemSpent.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                  <span className="font-medium text-midnight font-mono min-w-[80px] text-right">R$ {item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {catExpenses.length > 0 && (
                      <div className="mt-4 flex-grow">
                        <button 
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center justify-between w-full text-sm text-silver hover:text-midnight transition-colors py-2"
                        >
                          <span className="font-medium">Despesas ({catExpenses.length})</span>
                          {expandedCategories[category.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {expandedCategories[category.id] && (
                          <div className="space-y-1 mt-2">
                            {catExpenses.map(expense => (
                              <div key={expense.id} className="flex justify-between items-center p-2 hover:bg-snow rounded-lg group transition-colors">
                                <div>
                                  <div className="text-sm font-medium text-midnight">{expense.name}</div>
                                  <div className="text-[10px] text-silver uppercase tracking-wider">{expense.date ? new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</div>
                                  {expense.description && (
                                    <div className="text-xs text-slate mt-0.5">{expense.description}</div>
                                  )}
                                  {expense.duration > 1 && (
                                    <div className="text-xs text-silver mt-0.5">
                                      Mês {getMonthDiff(expense.startMonth, currentMonth) + 1} de {expense.duration}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-midnight mr-3 font-mono">R$ {expense.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                  <button 
                                    onClick={() => setExpenseModalOpen({ isOpen: true, expense })} 
                                    className="text-silver hover:text-teal opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* Floating Action Button for Adicionar Despesa */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40">
        <button
          onClick={() => setExpenseModalOpen({ isOpen: true })}
          className="flex items-center justify-center w-14 h-14 bg-teal text-white rounded-full shadow-lg hover:bg-teal-dark hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal"
          aria-label="Adicionar Despesa"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      <Modal isOpen={incomeModalOpen} onClose={() => setIncomeModalOpen(false)} title="Definir Renda Mensal">
        <SimplePromptForm 
          label={`Renda de ${formatMonth(currentMonth)}`}
          initialValue={income}
          onSubmit={(val) => {
            updateIncome(currentMonth, val);
            setIncomeModalOpen(false);
          }}
          onCancel={() => setIncomeModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={budgetModalOpen.isOpen} onClose={() => setBudgetModalOpen({ isOpen: false })} title="Definir Orçamento da Categoria">
        {budgetModalOpen.categoryId && (
          <BudgetForm 
            category={state.categories.find(c => c.id === budgetModalOpen.categoryId)!}
            initialAmount={budgets[budgetModalOpen.categoryId] || 0}
            initialItems={budgetItems[budgetModalOpen.categoryId] || []}
            initialIsFixed={fixedBudgets[budgetModalOpen.categoryId] ?? true}
            onSubmit={(val, items, isFixed) => {
              updateBudget(currentMonth, budgetModalOpen.categoryId!, val, items, isFixed);
              setBudgetModalOpen({ isOpen: false });
            }}
            onCancel={() => setBudgetModalOpen({ isOpen: false })}
          />
        )}
      </Modal>

      <Modal isOpen={categoryModalOpen.isOpen} onClose={() => setCategoryModalOpen({ isOpen: false })} title={categoryModalOpen.category ? "Editar Categoria" : "Nova Categoria"}>
        <CategoryForm 
          initialData={categoryModalOpen.category}
          existingCategories={state.categories}
          onSubmit={(data) => {
            if (categoryModalOpen.category) {
              updateCategory(categoryModalOpen.category.id, data);
              // Also update the fixed state for the current month if it changed
              if (data.isFixed !== undefined) {
                updateCategoryFixedState(currentMonth, categoryModalOpen.category.id, data.isFixed);
              }
            } else {
              const newId = generateId();
              addCategory({ id: newId, name: data.name!, color: data.color!, isFixed: data.isFixed ?? true });
              // Initialize fixed state for current month
              updateCategoryFixedState(currentMonth, newId, data.isFixed ?? true);
            }
            setCategoryModalOpen({ isOpen: false });
          }}
          onCancel={() => setCategoryModalOpen({ isOpen: false })}
        />
      </Modal>

      <Modal isOpen={expenseModalOpen.isOpen} onClose={() => setExpenseModalOpen({ isOpen: false })} title={expenseModalOpen.expense ? "Editar Despesa" : "Nova Despesa"}>
        <ExpenseForm 
          initialData={expenseModalOpen.expense}
          categoryId={expenseModalOpen.categoryId}
          currentMonth={currentMonth}
          categories={state.categories}
          state={state}
          onSubmit={(data) => {
            if (expenseModalOpen.expense) {
              updateExpense(expenseModalOpen.expense.id, data);
            } else {
              addExpense({ 
                id: generateId(), 
                categoryId: data.categoryId!, 
                budgetItemId: data.budgetItemId,
                name: data.name!, 
                amount: data.amount!, 
                date: data.date!,
                startMonth: data.startMonth!, 
                duration: data.duration!,
                description: data.description
              });
            }
            setExpenseModalOpen({ isOpen: false });
          }}
          onDelete={() => {
            if (expenseModalOpen.expense) {
              deleteExpense(expenseModalOpen.expense.id);
              setExpenseModalOpen({ isOpen: false });
            }
          }}
          onCancel={() => setExpenseModalOpen({ isOpen: false })}
        />
      </Modal>

    </div>
  );
}

