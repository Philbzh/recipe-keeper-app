// Type definitions for Recipe Keeper App

export interface Recipe {
  id: string;
  title: string;
  category: string;
  image?: string;
  imageUrl?: string;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  time?: string; // Legacy support
  difficulty: 'Einfach' | 'Mittel' | 'Schwer' | 'Schwierig';
  rating?: number;
  favorite?: boolean;
  isFavorite?: boolean; // Legacy support
  ingredients: Array<{ amount: string; unit: string; name: string }> | string[]; // Support both formats
  steps: string[];
  tags?: string[];
  notes?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  recipeId?: string;
  recipeTitle?: string;
  recipeTitles?: string[];
  quantity?: string;
  category?: ShoppingCategory;
}

export type ShoppingCategory = 
  | 'Obst & Gemüse'
  | 'Fleisch & Fisch'
  | 'Milchprodukte'
  | 'Backwaren'
  | 'Konserven'
  | 'Gewürze'
  | 'Getränke'
  | 'Sonstiges';

export interface CategoryStructure {
  [mainCategory: string]: string[];
}

export interface Filters {
  category: string;
  maxTime: string;
  difficulty: string;
  favorite?: boolean;
  tags?: string[];
}

export interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

export interface MealPlan {
  id: string;
  date: string;
  recipeId: string;
  mealType: 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snack';
}

export interface AppState {
  recipes: Recipe[];
  shoppingList: ShoppingItem[];
  categories: string[];
  mealPlans: MealPlan[];
}

// OpenFoodFacts Product Data (optional feature)
export interface ProductData {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  image?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
    salt?: number;
  };
  ingredients?: string[];
  allergens?: string[];
  additives?: string[];
  packaging?: string;
  quantity?: string;
  labels?: string[];
  ecoScore?: string;
  novaGroup?: number;
}
