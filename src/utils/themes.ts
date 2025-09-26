import { Category, CategoryTheme } from '../types';

export const getCategoryTheme = (category: Category): CategoryTheme => {
  const themes: Record<Category, CategoryTheme> = {
    kitchen_recipe: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fed7aa',
      background: '#fff7ed',
      text: '#9a3412'
    },
    travel_planner: {
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#bfdbfe',
      background: '#eff6ff',
      text: '#1e40af'
    },
    project: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#ddd6fe',
      background: '#f5f3ff',
      text: '#6d28d9'
    },
    fitness_planner: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#a7f3d0',
      background: '#ecfdf5',
      text: '#047857'
    },
    subject: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fde68a',
      background: '#fffbeb',
      text: '#92400e'
    }
  };

  return themes[category];
};