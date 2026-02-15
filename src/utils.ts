// Utility functions for recipe app
import { Recipe, ShoppingItem, ShoppingCategory, ProductData } from './types';

// Merge duplicate ingredients in shopping list
export const mergeIngredients = (items: ShoppingItem[]): ShoppingItem[] => {
  const merged = new Map<string, ShoppingItem>();

  items.forEach(item => {
    const normalizedText = item.text.toLowerCase().trim();
    
    if (merged.has(normalizedText)) {
      const existing = merged.get(normalizedText)!;
      // Merge recipe titles
      if (item.recipeTitle) {
        existing.recipeTitles = existing.recipeTitles || [];
        if (!existing.recipeTitles.includes(item.recipeTitle)) {
          existing.recipeTitles.push(item.recipeTitle);
        }
      }
    } else {
      merged.set(normalizedText, {
        ...item,
        recipeTitles: item.recipeTitle ? [item.recipeTitle] : []
      });
    }
  });

  return Array.from(merged.values());
};

// Categorize shopping items automatically
export const categorizeShoppingItem = (text: string): ShoppingCategory => {
  const lowerText = text.toLowerCase();
  
  const categories: Record<ShoppingCategory, string[]> = {
    'Obst & Gemüse': ['apfel', 'banane', 'tomate', 'gurke', 'salat', 'kartoffel', 'zwiebel', 'knoblauch', 'paprika', 'karotte', 'möhre'],
    'Fleisch & Fisch': ['fleisch', 'hähnchen', 'huhn', 'rind', 'schwein', 'fisch', 'lachs', 'thunfisch', 'garnele', 'wurst'],
    'Milchprodukte': ['milch', 'käse', 'butter', 'joghurt', 'sahne', 'quark', 'ei', 'eier'],
    'Backwaren': ['brot', 'brötchen', 'mehl', 'zucker', 'hefe', 'backpulver'],
    'Konserven': ['dose', 'konserve', 'tomatenmark', 'passierte'],
    'Gewürze': ['salz', 'pfeffer', 'gewürz', 'curry', 'paprika', 'zimt', 'oregano', 'basilikum'],
    'Getränke': ['wasser', 'saft', 'wein', 'bier', 'tee', 'kaffee'],
    'Sonstiges': []
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category as ShoppingCategory;
    }
  }

  return 'Sonstiges';
};

// Group shopping list by category
export const groupByCategory = (items: ShoppingItem[]): Map<ShoppingCategory, ShoppingItem[]> => {
  const groups = new Map<ShoppingCategory, ShoppingItem[]>();
  
  items.forEach(item => {
    const category = item.category || categorizeShoppingItem(item.text);
    const existing = groups.get(category) || [];
    groups.set(category, [...existing, item]);
  });

  return groups;
};

// Scale recipe ingredients
export const scaleIngredients = (ingredients: string[] | Array<{ amount: string; unit: string; name: string }>, originalServings: number, newServings: number): string[] => {
  const scale = newServings / originalServings;
  
  // Handle both formats
  const ingredientStrings = Array.isArray(ingredients[0]) && typeof ingredients[0] === 'object' && 'name' in ingredients[0]
    ? (ingredients as Array<{ amount: string; unit: string; name: string }>).map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
    : ingredients as string[];
  
  return ingredientStrings.map(ingredient => {
    // Match number patterns (including fractions)
    const numberPattern = /(\d+(?:[.,]\d+)?|\d+\/\d+)/g;
    
    return ingredient.replace(numberPattern, (match) => {
      let value: number;
      
      // Handle fractions
      if (match.includes('/')) {
        const [num, denom] = match.split('/').map(Number);
        value = num / denom;
      } else {
        value = parseFloat(match.replace(',', '.'));
      }
      
      const scaled = value * scale;
      
      // Round to reasonable precision
      if (scaled < 1) {
        return scaled.toFixed(2).replace(/\.?0+$/, '');
      } else {
        return scaled.toFixed(1).replace(/\.0$/, '');
      }
    });
  });
};

// Safe string for search (never call toLowerCase on non-string)
const safeSearchStr = (v: unknown): string =>
  (v == null || v === '') ? '' : (typeof v === 'string' ? v : String(v)).toLowerCase();

// Search recipes with multiple criteria
export const searchRecipes = (
  recipes: Recipe[],
  searchTerm: string,
  filters: {
    category?: string;
    maxTime?: string;
    difficulty?: string;
    favorite?: boolean;
    tags?: string[];
  }
): Recipe[] => {
  return recipes.filter(recipe => {
    if (!recipe) return false;

    // Search term (title, ingredients, tags, steps) – trim so spaces don't break search
    const term = safeSearchStr(searchTerm).trim();
    if (term) {
      const matchesTitle = safeSearchStr(recipe.title).includes(term);

      // Normalize ingredients to string[] (handle both formats and bad data)
      let ingredientStrings: string[] = [];
      const raw = recipe.ingredients;
      if (Array.isArray(raw) && raw.length > 0) {
        const first = raw[0];
        const isObjFormat = first != null && typeof first === 'object' && 'name' in first;
        ingredientStrings = isObjFormat
          ? (raw as Array<{ amount?: unknown; unit?: unknown; name?: unknown }>).map(ing =>
              [ing?.amount, ing?.unit, ing?.name].map(x => (x != null && typeof x === 'string' ? x : String(x ?? ''))).join(' ')
            )
          : raw.map(ing => (typeof ing === 'string' ? ing : String(ing ?? '')));
      }

      const matchesIngredients = ingredientStrings.some(ing =>
        safeSearchStr(ing).includes(term)
      );
      const matchesTags = Array.isArray(recipe.tags) && recipe.tags.some(tag =>
        safeSearchStr(tag).includes(term)
      );
      const steps: string[] = Array.isArray(recipe.steps) ? recipe.steps : [];
      const matchesSteps = steps.some(step => safeSearchStr(step).includes(term));

      if (!matchesTitle && !matchesIngredients && !matchesTags && !matchesSteps) {
        return false;
      }
    }

    // Category filter
    if (filters.category && recipe.category !== filters.category) {
      return false;
    }

    // Time filter
    if (filters.maxTime) {
      const maxMinutes = parseInt(filters.maxTime);
      const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || parseInt(recipe.time || '0');
      if (totalTime > maxMinutes) {
        return false;
      }
    }

    // Difficulty filter
    if (filters.difficulty && recipe.difficulty !== filters.difficulty) {
      return false;
    }

    // Favorite filter
    if (filters.favorite && !recipe.favorite && !recipe.isFavorite) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => 
        recipe.tags?.includes(tag)
      );
      if (!hasTag) {
        return false;
      }
    }

    return true;
  });
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format time display
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} Min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// Parse ingredient for shopping list
export const parseIngredient = (ingredient: string): { quantity: string; item: string } => {
  // Try to separate quantity from item name
  const match = ingredient.match(/^([\d.,\/\s]+(?:g|kg|ml|l|TL|EL|Prise|Stück)?)\s+(.+)$/i);
  
  if (match) {
    return {
      quantity: match[1].trim(),
      item: match[2].trim()
    };
  }
  
  return {
    quantity: '',
    item: ingredient.trim()
  };
};

// Parse ingredient input string into structured format (e.g., "200g Mehl" -> { amount: "200", unit: "g", name: "Mehl" })
export const parseIngredientInput = (input: string): { amount: string; unit: string; name: string } => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { amount: '', unit: '', name: '' };
  }

  // Pattern: number + optional unit + ingredient name
  // Examples: "200g Mehl", "2 EL Butter", "1/2 TL Salz", "500 ml Milch"
  const patterns = [
    // Pattern: number + unit (g, kg, ml, l, TL, EL, etc.) + name
    /^([\d.,\/]+)\s*(g|kg|ml|l|TL|EL|Stück|Stk|Bund|Zweig|Zehe|Scheibe|Dose|Glas|Prise)\s+(.+)$/i,
    // Pattern: number + space + name (no unit)
    /^([\d.,\/]+)\s+(.+)$/,
    // Pattern: just name (no amount/unit)
    /^(.+)$/
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      if (match[3]) {
        // Has unit
        return {
          amount: match[1].trim(),
          unit: match[2].trim(),
          name: match[3].trim()
        };
      } else if (match[2] && !match[2].match(/^(g|kg|ml|l|TL|EL|Stück|Stk|Bund|Zweig|Zehe|Scheibe|Dose|Glas|Prise)$/i)) {
        // Has amount but no unit (match[2] is the name)
        return {
          amount: match[1].trim(),
          unit: '',
          name: match[2].trim()
        };
      } else {
        // Just name
        return {
          amount: '',
          unit: '',
          name: match[1].trim()
        };
      }
    }
  }

  // Fallback: return as name only
  return {
    amount: '',
    unit: '',
    name: trimmed
  };
};

// Convert recipe to shareable text
export const recipeToText = (recipe: Recipe): string => {
  let text = `${recipe.title}\n\n`;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0) || parseInt(recipe.time || '0');
  text += `Portionen: ${recipe.servings} | Zubereitungszeit: ${formatTime(totalTime)}\n`;
  text += `Schwierigkeit: ${recipe.difficulty}\n\n`;
  
  text += `ZUTATEN:\n`;
  const ingredientStrings = Array.isArray(recipe.ingredients[0]) && typeof recipe.ingredients[0] === 'object' && 'name' in recipe.ingredients[0]
    ? (recipe.ingredients as Array<{ amount: string; unit: string; name: string }>).map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
    : recipe.ingredients as string[];
  ingredientStrings.forEach(ing => {
    text += `• ${ing}\n`;
  });
  
  text += `\nZUBEREITUNG:\n`;
  recipe.steps.forEach((step, idx) => {
    text += `${idx + 1}. ${step}\n\n`;
  });
  
  if (recipe.notes) {
    text += `NOTIZEN:\n${recipe.notes}\n`;
  }
  
  return text;
};

// Sort recipes by various criteria
export const sortRecipes = (
  recipes: Recipe[],
  sortBy: 'title' | 'date' | 'rating' | 'time' | 'difficulty',
  order: 'asc' | 'desc' = 'asc'
): Recipe[] => {
  const sorted = [...recipes].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'date':
        comparison = (new Date(a.createdAt || a.date || 0)).getTime() - (new Date(b.createdAt || b.date || 0)).getTime();
        break;
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0);
        break;
      case 'time':
        const timeA = (a.prepTime || 0) + (a.cookTime || 0) || parseInt(a.time || '0');
        const timeB = (b.prepTime || 0) + (b.cookTime || 0) || parseInt(b.time || '0');
        comparison = timeA - timeB;
        break;
      case 'difficulty':
        const difficultyOrder: Record<string, number> = { 'Einfach': 1, 'Mittel': 2, 'Schwer': 3, 'Schwierig': 3 };
        comparison = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
};

// Validate recipe data
export const validateRecipe = (recipe: Partial<Recipe>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!recipe.title?.trim()) {
    errors.push('Titel ist erforderlich');
  }
  
  if (!recipe.category) {
    errors.push('Kategorie ist erforderlich');
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push('Mindestens eine Zutat ist erforderlich');
  }
  
  if (!recipe.steps || recipe.steps.length === 0) {
    errors.push('Mindestens ein Zubereitungsschritt ist erforderlich');
  }
  
  if (!recipe.servings || recipe.servings < 1) {
    errors.push('Anzahl der Portionen muss mindestens 1 sein');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Convert ProductData from OpenFoodFacts to ShoppingItem
export const productToShoppingItem = (product: ProductData, generateIdFn: () => string): ShoppingItem => {
  // Erstelle Text für ShoppingItem mit detaillierten Informationen
  const parts: string[] = [];
  
  // Marke hinzufügen (wenn vorhanden und nicht bereits im Namen enthalten)
  if (product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase())) {
    parts.push(product.brand);
  }
  
  // Produktname hinzufügen
  parts.push(product.name);
  
  // Menge/Größe hinzufügen (wenn vorhanden)
  if (product.quantity) {
    parts.push(`(${product.quantity})`);
  }
  
  // Verpackung hinzufügen (wenn vorhanden und informativ)
  if (product.packaging && product.packaging.length > 0 && product.packaging.length < 30) {
    parts.push(`[${product.packaging}]`);
  }
  
  // Text zusammenfügen
  const text = parts.join(' ').trim();
  
  return {
    id: generateIdFn(),
    text: text,
    checked: false,
    category: (product.category as ShoppingCategory) || categorizeShoppingItem(product.name),
    quantity: product.quantity
  };
};
