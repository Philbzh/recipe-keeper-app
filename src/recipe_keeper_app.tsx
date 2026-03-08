import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './Auth';
import RecipeDataService from './dataService';
import { MealPlan, ShoppingCategory, ShoppingItem } from './types';
import { searchRecipes, sortRecipes, generateId, mergeIngredients, groupByCategory, categorizeShoppingItem, parseIngredientInput, compressImage } from './utils';
import VoiceRecipeInput from './VoiceRecipeInput';
import type { VoiceRecipeData } from './VoiceRecipeInput';
import { Plus, Search, ShoppingCart, ChefHat, Users, Clock, ArrowLeft, Trash2, Check, X, Star, Mic, SlidersHorizontal, Share2, Play, Edit2, Settings, Calendar, GripVertical, ScanLine, Copy, Download, Upload, Printer, Moon, Sun, Camera } from 'lucide-react';

// Constants for improved AddRecipeView
const COMMON_UNITS = [
  { value: '', label: '—' },
  { value: 'g', label: 'g (Gramm)' },
  { value: 'kg', label: 'kg (Kilogramm)' },
  { value: 'ml', label: 'ml (Milliliter)' },
  { value: 'l', label: 'l (Liter)' },
  { value: 'TL', label: 'TL (Teelöffel)' },
  { value: 'EL', label: 'EL (Esslöffel)' },
  { value: 'Tasse', label: 'Tasse' },
  { value: 'Prise', label: 'Prise' },
  { value: 'Stück', label: 'Stück' },
  { value: 'Stk', label: 'Stk' },
  { value: 'Bund', label: 'Bund' },
  { value: 'Zweig', label: 'Zweig' },
  { value: 'Zehe', label: 'Zehe' },
  { value: 'Scheibe', label: 'Scheibe' },
  { value: 'Dose', label: 'Dose' },
  { value: 'Glas', label: 'Glas' }
];

const COMMON_INGREDIENTS = [
  'Mehl', 'Zucker', 'Salz', 'Pfeffer', 'Butter', 'Öl', 'Milch', 'Eier', 'Zwiebeln', 'Knoblauch',
  'Tomaten', 'Paprika', 'Karotten', 'Kartoffeln', 'Reis', 'Nudeln', 'Hähnchen', 'Rindfleisch',
  'Käse', 'Joghurt', 'Sahne', 'Essig', 'Zitrone', 'Basilikum', 'Oregano', 'Thymian'
];

const SUGGESTED_TAGS = [
  '🥬 Vegetarisch', '🌱 Vegan', '⚡ Schnell (unter 30 Min)', '🍖 Fleisch', '🐟 Fisch',
  '🇮🇹 Italienisch', '🇨🇳 Asiatisch', '🇩🇪 Deutsch', '🌶️ Scharf', '🍰 Süß',
  '🥗 Gesund', '💪 Low Carb', '🎉 Party-geeignet', '👶 Kinderfreundlich', '🍳 Meal Prep'
];

// Gewünschte Reihenfolge der Hauptkategorien
const MAIN_CATEGORY_ORDER = [
  '🍳 Frühstück',
  '🥗 Vorspeisen',
  '🍖 Hauptgerichte',
  '🥔 Beilagen',
  '🍨 Desserts',
  '🎂 Feine Backwaren',
  '🥐 Gebäck & Süßigkeiten',
  '🍞 Backwaren',
  '🌶️ Gewürze & Mischungen',
  '🥫 Saucen'
];

// Funktion: Sortiert categoryStructure nach der gewünschten Reihenfolge
const sortCategoryStructure = (structure: Record<string, string[]>): Record<string, string[]> => {
  const sorted: Record<string, string[]> = {};
  // Zuerst alle Kategorien in der gewünschten Reihenfolge hinzufügen
  MAIN_CATEGORY_ORDER.forEach(mainCat => {
    if (structure[mainCat]) {
      sorted[mainCat] = Array.isArray(structure[mainCat])
        ? [...structure[mainCat]].sort((a, b) => a.localeCompare(b, 'de'))
        : [];
    }
  });
  // Dann alle anderen Kategorien hinzufügen, die nicht in der Standard-Reihenfolge sind
  Object.keys(structure).forEach(mainCat => {
    if (!MAIN_CATEGORY_ORDER.includes(mainCat)) {
      sorted[mainCat] = Array.isArray(structure[mainCat])
        ? [...structure[mainCat]].sort((a, b) => a.localeCompare(b, 'de'))
        : [];
    }
  });
  return sorted;
};

// Funktion: Gibt die Hauptkategorien in der richtigen Reihenfolge zurück
const getOrderedMainCategories = (structure: Record<string, string[]>): string[] => {
  const ordered: string[] = [];
  // Zuerst alle Kategorien in der gewünschten Reihenfolge hinzufügen
  MAIN_CATEGORY_ORDER.forEach(mainCat => {
    if (structure[mainCat]) {
      ordered.push(mainCat);
    }
  });
  // Dann alle anderen Kategorien hinzufügen, die nicht in der Standard-Reihenfolge sind
  Object.keys(structure).forEach(mainCat => {
    if (!MAIN_CATEGORY_ORDER.includes(mainCat)) {
      ordered.push(mainCat);
    }
  });
  return ordered;
};

const RecipeApp = () => {
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  // Standard-Kategorien in gewünschter Reihenfolge (Unterkategorien alphabetisch sortiert)
  const DEFAULT_CATEGORY_STRUCTURE: Record<string, string[]> = {
    '🍳 Frühstück': ['Eiergerichte', 'Müsli', 'Pancakes', 'Waffeln'],
    '🥗 Vorspeisen': ['Dips', 'Fingerfood', 'Salate', 'Suppen'],
    '🍖 Hauptgerichte': ['Fisch', 'Fleisch', 'Pasta', 'Pizza', 'Vegan', 'Vegetarisch'],
    '🥔 Beilagen': ['Gemüse', 'Kartoffeln', 'Reis', 'Salate'],
    '🍨 Desserts': ['Cremes', 'Eis', 'Pudding', 'Tiramisu'],
    '🎂 Feine Backwaren': ['Blechkuchen', 'Käsekuchen', 'Obstkuchen', 'Torten'],
    '🥐 Gebäck & Süßigkeiten': ['Croissants', 'Donuts', 'Kekse', 'Muffins', 'Süßigkeiten'],
    '🍞 Backwaren': ['Baguette', 'Brötchen', 'Vollkorn', 'Weißbrot'],
    '🌶️ Gewürze & Mischungen': ['BBQ-Rubs', 'Curry', 'Gewürzmischungen', 'Kräutermischungen', 'Salz & Zucker'],
    '🥫 Saucen': ['Basis-Saucen', 'Chutneys', 'Grillsaucen', 'Pesto', 'Salsa']
  };

  const [categoryStructure, setCategoryStructure] = useState<Record<string, string[]>>(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('category_structure') : null;
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          // Sortiere nach gewünschter Reihenfolge und Unterkategorien alphabetisch
          const sorted = sortCategoryStructure(parsed);
          console.log('Kategorien aus localStorage geladen und sortiert:', {
            original: Object.keys(parsed),
            sorted: Object.keys(sorted)
          });
          return sorted;
        }
      }
    } catch (e) {
      console.error('Fehler beim Laden der Kategorien aus localStorage:', e);
    }
    // Auch DEFAULT_CATEGORY_STRUCTURE sortieren, falls nötig
    return sortCategoryStructure({ ...DEFAULT_CATEGORY_STRUCTURE });
  });

  // Aus Struktur abgeleitete flache Liste (für Filter-Dropdown)
  const categories = useMemo(() => {
    const flat: string[] = [];
    getOrderedMainCategories(categoryStructure).forEach(main => {
      const subs = categoryStructure[main] || [];
      subs.forEach(sub => flat.push(`${main} > ${sub}`));
    });
    return flat;
  }, [categoryStructure]);
  const [view, setView] = useState<'home' | 'detail' | 'add' | 'edit' | 'shopping' | 'cooking' | 'mealplan'>('home');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', maxTime: '', difficulty: '', favorite: undefined });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'date' | 'rating' | 'time'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [homeActiveTab, setHomeActiveTab] = useState<'all' | 'favorites'>('all');
  const [quickTimeFilter, setQuickTimeFilter] = useState<'all' | 'quick' | 'medium'>('all');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [selectedDateForMealPlan, setSelectedDateForMealPlan] = useState<string | null>(null);
  const [selectedMealTypeForMealPlan, setSelectedMealTypeForMealPlan] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  const [user, setUser] = useState(null);
  const [error, setError] = useState<string | null>(null);

  // Data Service Instance
  const dataService = useMemo(() => {
    if (!supabase) return null;
    return new RecipeDataService(supabase, user, (msg) => setError(msg));
  }, [user]);

  // Beobachte Auth-Status und lade Daten beim User-Wechsel
  useEffect(() => {
    let sub: any = null;

    const init = async () => {
      if (supabase) {
        try {
          const {
            data: { user: currentUser }
          } = await supabase.auth.getUser();
          setUser(currentUser ?? null);
        } catch (e) {
          // ignore
        }

        sub = supabase.auth.onAuthStateChange((_event: any, session: any) => {
          setUser(session?.user ?? null);
        });
      }
      loadData();
    };

    init();

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
    };
  }, []);

  // Reload data when user changes
  useEffect(() => {
    if (dataService && !editingRecipe) {
      loadData();
    }
  }, [user]);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Debug: Zeige aktuelle View (muss vor conditional returns sein!)
  useEffect(() => {
    console.log('Aktuelle View:', view);
    console.log('editingRecipe:', editingRecipe);
  }, [view, editingRecipe]);

  // Stoppe Vorlesen, wenn sich der Schritt ändert
  useEffect(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex]);

  // Stoppe Vorlesen, wenn die Ansicht wechselt (außer cooking/detail)
  useEffect(() => {
    if (isSpeaking && view !== 'cooking' && view !== 'detail') {
      stopSpeaking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Stelle sicher, dass categoryStructure beim ersten Laden sortiert ist
  useEffect(() => {
    if (!loading && Object.keys(categoryStructure).length > 0) {
      const sorted = sortCategoryStructure(categoryStructure);
      const currentKeys = Object.keys(categoryStructure);
      const sortedKeys = Object.keys(sorted);
      
      // Prüfe, ob die Reihenfolge unterschiedlich ist
      if (currentKeys.length !== sortedKeys.length || 
          currentKeys.some((key, idx) => key !== sortedKeys[idx])) {
        console.log('Kategorien-Reihenfolge korrigieren beim ersten Laden...', {
          current: currentKeys,
          sorted: sortedKeys
        });
        // Verwende setTimeout, um sicherzustellen, dass dies nicht während des Renders passiert
        setTimeout(() => {
          setCategoryStructure(sorted);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const kvKey = (baseKey) => (user ? `user:${user.id}:${baseKey}` : baseKey);

  const loadData = async () => {
    setLoading(true);
    try {
      if (dataService) {
        const data = await dataService.loadAll();
        if (data.recipes) setRecipes(data.recipes);
        if (data.shoppingList) setShoppingList(data.shoppingList);
        if (data.categoryStructure && Object.keys(data.categoryStructure).length > 0) {
          setCategoryStructure(sortCategoryStructure(data.categoryStructure));
        } else if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          const built: Record<string, string[]> = {};
          (data.categories as string[]).forEach((cat: string) => {
            if (cat && cat.includes(' > ')) {
              const [main, sub] = cat.split(' > ');
              if (main && sub) {
                if (!built[main]) built[main] = [];
                if (!built[main].includes(sub)) built[main].push(sub);
              }
            }
          });
          if (Object.keys(built).length > 0) {
            const sorted: Record<string, string[]> = {};
            Object.keys(built).forEach(main => {
              sorted[main] = [...built[main]].sort((a, b) => a.localeCompare(b, 'de'));
            });
            setCategoryStructure(sorted);
          }
        }
        if (data.mealPlans) setMealPlans(data.mealPlans);
      } else {
        // Fallback to original method
        if (isSupabaseConfigured && supabase) {
          try {
            const rKey = kvKey('recipes');
            const sKey = kvKey('shopping-list');
            const cKey = kvKey('categories');

            const { data: recipesRow, error: recipesError } = await supabase
              .from('kv')
              .select('value')
              .eq('key', rKey)
              .single();

            if (!recipesError && recipesRow?.value) {
              setRecipes(recipesRow.value);
            }

            const { data: shoppingRow, error: shoppingError } = await supabase
              .from('kv')
              .select('value')
              .eq('key', sKey)
              .single();

            if (!shoppingError && shoppingRow?.value) {
              setShoppingList(shoppingRow.value);
            }

            const { data: categoriesRow } = await supabase.from('kv').select('value').eq('key', cKey).single();
            const { data: structureRow } = await supabase.from('kv').select('value').eq('key', kvKey('category_structure')).single();

            if (structureRow?.value && typeof structureRow.value === 'object') {
              setCategoryStructure(sortCategoryStructure(structureRow.value));
            } else if (categoriesRow?.value && Array.isArray(categoriesRow.value) && categoriesRow.value.length > 0) {
              const built: Record<string, string[]> = {};
              categoriesRow.value.forEach((cat: string) => {
                if (cat && cat.includes(' > ')) {
                  const [main, sub] = cat.split(' > ');
                  if (main && sub) {
                    if (!built[main]) built[main] = [];
                    if (!built[main].includes(sub)) built[main].push(sub);
                  }
                }
              });
              if (Object.keys(built).length > 0) {
                setCategoryStructure(sortCategoryStructure(built));
              }
            }
          } catch (err) {
            console.log('Supabase load failed, falling back to localStorage', err);
          }
        }

        const recipesData = localStorage.getItem('recipes');
        const shoppingData = localStorage.getItem('shopping-list');
        const structureData = localStorage.getItem('category_structure');
        const categoriesData = localStorage.getItem('categories');

        if (recipesData) setRecipes(JSON.parse(recipesData));
        if (shoppingData) setShoppingList(JSON.parse(shoppingData));
        if (structureData) {
          try {
            const parsed = JSON.parse(structureData);
            if (parsed && typeof parsed === 'object') {
              setCategoryStructure(sortCategoryStructure(parsed));
            }
          } catch (_) {}
        } else if (categoriesData) {
          try {
            const flat = JSON.parse(categoriesData);
            if (Array.isArray(flat) && flat.length > 0) {
              const built: Record<string, string[]> = {};
              flat.forEach((cat: string) => {
                if (cat && cat.includes(' > ')) {
                  const [main, sub] = cat.split(' > ');
                  if (main && sub) {
                    if (!built[main]) built[main] = [];
                    if (!built[main].includes(sub)) built[main].push(sub);
                  }
                }
              });
              if (Object.keys(built).length > 0) {
                setCategoryStructure(sortCategoryStructure(built));
              }
            }
          } catch (_) {}
        }
        const mealPlansData = localStorage.getItem('meal-plans');
        if (mealPlansData) {
          setMealPlans(JSON.parse(mealPlansData));
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      setError('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error', err);
    } finally {
      setUser(null);
      // reload fallback data from localStorage
      loadData();
    }
  };

  // Improved save functions with DataService and optimistic updates. Returns true if saved successfully.
  const saveRecipes = useCallback(async (newRecipes): Promise<boolean> => {
    setRecipes(newRecipes); // Optimistic update

    if (dataService) {
      const ok = await dataService.saveRecipes(newRecipes);
      if (!ok) return false;
      return true;
    }
    try {
      localStorage.setItem('recipes', JSON.stringify(newRecipes));
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('kv').upsert({ key: kvKey('recipes'), value: newRecipes });
        } catch (err) {
          console.error('Supabase save error (recipes):', err);
        }
      }
      return true;
    } catch (error: any) {
      console.error('Fehler beim Speichern:', error);
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
        setError('localStorage voll - bitte Rezepte/Bilder löschen oder Cloud-Sync aktivieren');
      } else {
        setError('Fehler beim Speichern der Rezepte');
      }
      return false;
    }
  }, [dataService]);

  const saveShoppingList = useCallback(async (newList) => {
    setShoppingList(newList); // Optimistic update
    
    if (dataService) {
      await dataService.saveShoppingList(newList);
    } else {
      // Fallback to original method
      try {
        localStorage.setItem('shopping-list', JSON.stringify(newList));
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('kv').upsert({ key: kvKey('shopping-list'), value: newList });
          } catch (err) {
            console.error('Supabase save error (shopping-list):', err);
          }
        }
      } catch (error) {
        console.error('Fehler beim Speichern:', error);
        setError('Fehler beim Speichern der Einkaufsliste');
      }
    }
  }, [dataService]);

  const saveCategoryStructure = useCallback(async (newStructure: Record<string, string[]>) => {
    const sorted = sortCategoryStructure(newStructure);
    setCategoryStructure(sorted);
    const flat: string[] = [];
    getOrderedMainCategories(sorted).forEach(main => {
      const subs = sorted[main] || [];
      subs.forEach(sub => flat.push(`${main} > ${sub}`));
    });
    if (dataService) {
      await dataService.saveCategoryStructure(sorted);
      await dataService.saveCategories(flat);
    } else {
      try {
        localStorage.setItem('category_structure', JSON.stringify(sorted));
        localStorage.setItem('categories', JSON.stringify(flat));
        if (isSupabaseConfigured && supabase) {
          await supabase.from('kv').upsert({ key: kvKey('category_structure'), value: sorted });
          await supabase.from('kv').upsert({ key: kvKey('categories'), value: flat });
        }
      } catch (error) {
        console.error('Fehler beim Speichern der Kategorien', error);
      }
    }
  }, [dataService]);

  // Meal Plan functions
  const saveMealPlans = useCallback(async (newMealPlans) => {
    setMealPlans(newMealPlans); // Optimistic update
    
    if (dataService) {
      await dataService.saveMealPlans(newMealPlans);
    } else {
      try {
        localStorage.setItem('meal-plans', JSON.stringify(newMealPlans));
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('kv').upsert({ key: kvKey('meal-plans'), value: newMealPlans });
          } catch (err) {
            console.error('Supabase save error (meal-plans):', err);
          }
        }
      } catch (error) {
        console.error('Fehler beim Speichern der Wochenpläne:', error);
        setError('Fehler beim Speichern der Wochenpläne');
      }
    }
  }, [dataService]);

  const addMealPlan = useCallback((date: string, recipeId: string, mealType: 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snack') => {
    const newPlan = {
      id: generateId(),
      date,
      recipeId,
      mealType
    };
    const updated = [...mealPlans.filter(p => !(p.date === date && p.mealType === mealType)), newPlan];
    saveMealPlans(updated);
  }, [mealPlans, saveMealPlans]);

  const removeMealPlan = useCallback((id: string) => {
    const updated = mealPlans.filter(p => p.id !== id);
    saveMealPlans(updated);
  }, [mealPlans, saveMealPlans]);

  const addWeekToShoppingList = useCallback(() => {
    const weekRecipes = mealPlans.map(plan => {
      const recipe = recipes.find(r => r.id === plan.recipeId);
      return recipe;
    }).filter(Boolean);

    weekRecipes.forEach(recipe => {
      if (recipe) {
        const ingredientStrings = Array.isArray(recipe.ingredients[0]) && typeof recipe.ingredients[0] === 'object' && 'name' in recipe.ingredients[0]
          ? (recipe.ingredients as Array<{ amount: string; unit: string; name: string }>).map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
          : recipe.ingredients as string[];
        
        const newItems = ingredientStrings.map(text => ({
          id: generateId(),
          text,
          checked: false,
          recipeTitle: recipe.title
        }));
        
        const updatedList = [...shoppingList, ...newItems];
        const merged = mergeIngredients(updatedList);
        saveShoppingList(merged);
      }
    });
    
    alert('Alle Zutaten der Woche zur Einkaufsliste hinzugefügt! 🛒');
  }, [mealPlans, recipes, shoppingList, saveShoppingList]);

  // Kategorie-Manager: bearbeitbare Haupt- und Unterkategorien
  const CategoryManager = () => {
    const [newMainName, setNewMainName] = useState('');
    const [editingMain, setEditingMain] = useState<string | null>(null);
    const [editingMainValue, setEditingMainValue] = useState('');
    const [editingSub, setEditingSub] = useState<{ main: string; sub: string } | null>(null);
    const [editingSubValue, setEditingSubValue] = useState('');
    const [newSubByMain, setNewSubByMain] = useState<Record<string, string>>({});

    const applySave = (next: Record<string, string[]>) => {
      saveCategoryStructure(next);
    };

    const addMain = () => {
      const name = newMainName.trim();
      if (!name) return;
      if (categoryStructure[name]) return;
      applySave({ ...categoryStructure, [name]: [] });
      setNewMainName('');
    };

    const renameMain = (oldName: string) => {
      const newName = editingMainValue.trim();
      if (!newName || newName === oldName) {
        setEditingMain(null);
        return;
      }
      const next = { ...categoryStructure };
      next[newName] = next[oldName] || [];
      delete next[oldName];
      applySave(next);
      setEditingMain(null);
    };

    const deleteMain = (mainName: string) => {
      if (!confirm(`Hauptkategorie "${mainName}" und alle Unterkategorien löschen?`)) return;
      const next = { ...categoryStructure };
      delete next[mainName];
      applySave(next);
    };

    const addSub = (mainName: string) => {
      const name = (newSubByMain[mainName] || '').trim();
      if (!name) return;
      const subs = categoryStructure[mainName] || [];
      if (subs.includes(name)) return;
      const updated = [...subs, name].sort((a, b) => a.localeCompare(b, 'de'));
      applySave({ ...categoryStructure, [mainName]: updated });
      setNewSubByMain({ ...newSubByMain, [mainName]: '' });
    };

    const renameSub = (mainName: string, oldSub: string) => {
      const newName = editingSubValue.trim();
      if (!newName || newName === oldSub) {
        setEditingSub(null);
        return;
      }
      const subs = (categoryStructure[mainName] || []).map(s => s === oldSub ? newName : s).sort((a, b) => a.localeCompare(b, 'de'));
      applySave({ ...categoryStructure, [mainName]: subs });
      setEditingSub(null);
    };

    const deleteSub = (mainName: string, subName: string) => {
      const subs = (categoryStructure[mainName] || []).filter(s => s !== subName);
      applySave({ ...categoryStructure, [mainName]: subs });
    };

    return (
      <div className="mt-3 sm:mt-4 bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-lg dark:border dark:border-gray-700">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">Kategorien verwalten</h3>
          <button type="button" onClick={() => setShowCategoryManager(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newMainName}
            onChange={(e) => setNewMainName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMain()}
            placeholder="Neue Hauptkategorie (z.B. 🍹 Getränke)"
            className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
          />
          <button type="button" onClick={addMain} className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium text-sm whitespace-nowrap">
            Hinzufügen
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {getOrderedMainCategories(categoryStructure).map((mainCat) => {
            const subCats = categoryStructure[mainCat] || [];
            return (
            <div key={mainCat} className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-0">
              {editingMain === mainCat ? (
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="text"
                    value={editingMainValue}
                    onChange={(e) => setEditingMainValue(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    autoFocus
                  />
                  <button type="button" onClick={() => renameMain(mainCat)} className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm">Speichern</button>
                  <button type="button" onClick={() => setEditingMain(null)} className="px-3 py-2 bg-gray-400 text-white rounded-lg text-sm">Abbrechen</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base flex-1">{mainCat}</span>
                  <button type="button" onClick={() => { setEditingMain(mainCat); setEditingMainValue(mainCat); }} className="text-blue-600 dark:text-blue-400 text-xs font-medium">Bearbeiten</button>
                  <button type="button" onClick={() => deleteMain(mainCat)} className="text-red-500 text-xs font-medium">Löschen</button>
                </div>
              )}
              <div className="pl-2 space-y-1">
                {(subCats || []).slice().sort((a, b) => a.localeCompare(b, 'de')).map((subCat) => (
                  editingSub?.main === mainCat && editingSub?.sub === subCat ? (
                    <div key={subCat} className="flex gap-2 items-center py-1">
                      <input
                        type="text"
                        value={editingSubValue}
                        onChange={(e) => setEditingSubValue(e.target.value)}
                        className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xs"
                        autoFocus
                      />
                      <button type="button" onClick={() => renameSub(mainCat, subCat)} className="px-2 py-1 bg-green-500 text-white rounded text-xs">OK</button>
                      <button type="button" onClick={() => setEditingSub(null)} className="px-2 py-1 bg-gray-400 text-white rounded text-xs">Abbr.</button>
                    </div>
                  ) : (
                    <div key={subCat} className="flex items-center gap-2 py-0.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex-1">• {subCat}</span>
                      <button type="button" onClick={() => { setEditingSub({ main: mainCat, sub: subCat }); setEditingSubValue(subCat); }} className="text-blue-600 dark:text-blue-400 font-medium">Bearb.</button>
                      <button type="button" onClick={() => deleteSub(mainCat, subCat)} className="text-red-500 font-medium">Löschen</button>
                    </div>
                  )
                ))}
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSubByMain[mainCat] || ''}
                    onChange={(e) => setNewSubByMain({ ...newSubByMain, [mainCat]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && addSub(mainCat)}
                    placeholder="Neue Unterkategorie"
                    className="flex-1 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-xs"
                  />
                  <button type="button" onClick={() => addSub(mainCat)} className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs whitespace-nowrap">+ Unterkategorie</button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Use improved mergeIngredients from utils (already imported)

  const addToShoppingList = (recipe, customServings) => {
    const factor = customServings / recipe.servings;
    const newItems = recipe.ingredients.map(ing => ({
      id: Date.now() + Math.random(),
      text: `${parseFloat((parseFloat(ing.amount) * factor).toFixed(1))} ${ing.unit} ${ing.name}`,
      checked: false,
      recipeTitle: recipe.title
    }));
    
    const updatedList = [...shoppingList, ...newItems];
    const merged = mergeIngredients(updatedList);
    saveShoppingList(merged);
    alert('Zutaten zur Einkaufsliste hinzugefügt! 🛒');
  };

  const toggleShoppingItem = (id) => {
    const updated = shoppingList.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveShoppingList(updated);
  };

  const deleteShoppingItem = (id) => {
    const updated = shoppingList.filter(item => item.id !== id);
    saveShoppingList(updated);
  };

  const updateShoppingItem = (id: string, newText: string) => {
    const updated = shoppingList.map(item => 
      item.id === id ? { ...item, text: newText } : item
    );
    saveShoppingList(updated);
  };

  const clearCheckedItems = () => {
    const updated = shoppingList.filter(item => !item.checked);
    saveShoppingList(updated);
  };

  const shareShoppingList = () => {
    const uncheckedItems = shoppingList.filter(item => !item.checked);
    if (uncheckedItems.length === 0) {
      alert('Die Einkaufsliste ist leer oder alle Items sind bereits abgehakt!');
      return;
    }
    
    const listText = uncheckedItems.map(item => `• ${item.text}`).join('\n');
    const shareText = `🛒 Einkaufsliste\n\n${listText}`;
    
    // Versuche Web Share API, sonst Fallback
    if (navigator.share) {
      navigator.share({
        title: 'Einkaufsliste',
        text: shareText
      }).catch(err => {
        // Fallback zu WhatsApp/Text
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      });
    } else {
      // Fallback: WhatsApp Link
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const deleteRecipe = (id) => {
    if (confirm('Rezept wirklich löschen?')) {
      const updated = recipes.filter(r => r.id !== id);
      saveRecipes(updated);
      setView('home');
    }
  };

  // Duplicate Recipe
  const duplicateRecipe = (recipe: any) => {
    const newRecipe = {
      ...recipe,
      id: Date.now(),
      title: `${recipe.title} (Kopie)`,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      rating: 0,
      isFavorite: false,
      favorite: false
    };
    const updated = [...recipes, newRecipe];
    saveRecipes(updated);
    setSelectedRecipe(newRecipe);
    setEditingRecipe(newRecipe);
    setView('edit');
  };

  // Export Recipes
  const exportRecipes = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phils-rezepte-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import Recipes
  const importRecipes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              if (confirm(`Möchtest du ${imported.length} Rezepte importieren?`)) {
                // Merge with existing recipes (avoid duplicates by ID)
                const existingIds = new Set(recipes.map((r: any) => r.id));
                const newRecipes = imported.filter((r: any) => !existingIds.has(r.id));
                const updated = [...recipes, ...newRecipes];
                saveRecipes(updated);
                alert(`${newRecipes.length} neue Rezepte importiert!`);
              }
            } else {
              alert('Ungültiges Dateiformat!');
            }
          } catch (err) {
            alert('Fehler beim Importieren der Datei!');
            console.error(err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Print Recipe
  const printRecipe = (recipe: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const factor = servings / recipe.servings;
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${recipe.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #ea580c; border-bottom: 3px solid #ea580c; padding-bottom: 10px; }
            .info { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
            .section { margin: 30px 0; }
            h2 { color: #ea580c; margin-top: 30px; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #eee; }
            .step { margin: 15px 0; padding-left: 30px; position: relative; }
            .step-number { position: absolute; left: 0; font-weight: bold; color: #ea580c; }
            img { max-width: 100%; height: auto; border-radius: 10px; margin: 20px 0; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" />` : ''}
          <h1>${recipe.title}</h1>
          <div class="info">
            ${recipe.servings ? `<div><strong>Portionen:</strong> ${servings}</div>` : ''}
            ${recipe.prepTime || recipe.cookTime ? `<div><strong>Zeit:</strong> ${(recipe.prepTime || 0) + (recipe.cookTime || 0)} Min</div>` : ''}
            ${recipe.difficulty ? `<div><strong>Schwierigkeit:</strong> ${recipe.difficulty}</div>` : ''}
            ${recipe.category ? `<div><strong>Kategorie:</strong> ${recipe.category}</div>` : ''}
          </div>
          ${recipe.tags && recipe.tags.length > 0 ? `<div><strong>Tags:</strong> ${recipe.tags.join(', ')}</div>` : ''}
          
          <div class="section">
            <h2>Zutaten</h2>
            <ul>
              ${recipe.ingredients.map((ing: any) => {
                const amount = typeof ing === 'string' ? ing : `${parseFloat((parseFloat(ing.amount || '0') * factor).toFixed(1))} ${ing.unit || ''} ${ing.name || ing}`;
                return `<li>${amount.trim()}</li>`;
              }).join('')}
            </ul>
          </div>
          
          <div class="section">
            <h2>Zubereitung</h2>
            ${recipe.steps.map((step: string, idx: number) => 
              `<div class="step"><span class="step-number">${idx + 1}.</span> ${step}</div>`
            ).join('')}
          </div>
          
          ${recipe.notes ? `<div class="section"><h2>Notizen</h2><p>${recipe.notes}</p></div>` : ''}
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Share Recipe
  const shareRecipe = (recipe: any) => {
    const factor = servings / recipe.servings;
    const ingredientsText = recipe.ingredients.map((ing: any) => {
      if (typeof ing === 'string') return `• ${ing}`;
      const amount = parseFloat((parseFloat(ing.amount || '0') * factor).toFixed(1));
      return `• ${amount} ${ing.unit || ''} ${ing.name || ing}`;
    }).join('\n');
    
    const stepsText = recipe.steps.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n');
    
    const shareText = `🍳 ${recipe.title}\n\n` +
      `${recipe.servings ? `Portionen: ${servings}\n` : ''}` +
      `${recipe.prepTime || recipe.cookTime ? `Zeit: ${(recipe.prepTime || 0) + (recipe.cookTime || 0)} Min\n` : ''}` +
      `${recipe.difficulty ? `Schwierigkeit: ${recipe.difficulty}\n` : ''}\n` +
      `ZUTATEN:\n${ingredientsText}\n\n` +
      `ZUBEREITUNG:\n${stepsText}` +
      `${recipe.notes ? `\n\nNOTIZEN:\n${recipe.notes}` : ''}`;
    
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: shareText
      }).catch(() => {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Rezept in Zwischenablage kopiert!');
        });
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Rezept in Zwischenablage kopiert!');
      });
    }
  };

  // Bulk Operations
  const toggleRecipeSelection = (id: string) => {
    setSelectedRecipes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const deleteSelectedRecipes = () => {
    if (selectedRecipes.size === 0) return;
    if (confirm(`Möchtest du ${selectedRecipes.size} Rezept(e) wirklich löschen?`)) {
      const updated = recipes.filter((r: any) => !selectedRecipes.has(r.id));
      saveRecipes(updated);
      setSelectedRecipes(new Set());
      setBulkMode(false);
    }
  };

  const toggleFavoriteSelected = () => {
    if (selectedRecipes.size === 0) return;
    const updated = recipes.map((r: any) => 
      selectedRecipes.has(r.id) 
        ? { ...r, isFavorite: !r.isFavorite, favorite: !r.isFavorite }
        : r
    );
    saveRecipes(updated);
    setSelectedRecipes(new Set());
    setBulkMode(false);
  };

  // Improved favorite toggle with useCallback
  const toggleFavorite = useCallback((id) => {
    const updated = recipes.map(r => {
      if (r.id === id) {
        const newFavorite = !(r.favorite || r.isFavorite);
        return { ...r, favorite: newFavorite, isFavorite: newFavorite };
      }
      return r;
    });
    saveRecipes(updated);
    if (selectedRecipe?.id === id) {
      const newFavorite = !(selectedRecipe.favorite || selectedRecipe.isFavorite);
      setSelectedRecipe({ ...selectedRecipe, favorite: newFavorite, isFavorite: newFavorite });
    }
  }, [recipes, selectedRecipe]);

  // Improved rating update with useCallback
  const updateRecipeRating = useCallback((id, rating) => {
    const updated = recipes.map(r => 
      r.id === id ? { ...r, rating } : r
    );
    saveRecipes(updated);
    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, rating });
    }
  }, [recipes, selectedRecipe]);

  const updateRecipeNotes = (id, notes) => {
    const updated = recipes.map(r => 
      r.id === id ? { ...r, notes } : r
    );
    saveRecipes(updated);
    if (selectedRecipe?.id === id) {
      setSelectedRecipe({ ...selectedRecipe, notes });
    }
  };

  // Sprachsteuerung
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false); // Reset vor dem Start
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      
      // Event-Handler für Speech-Events
      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('✅ Vorlesen gestartet - isSpeaking = true');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('✅ Vorlesen beendet - isSpeaking = false');
      };
      
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        console.error('❌ Vorlesen Fehler:', event);
      };
      
      // Sofort setzen, damit der Button sofort wechselt
      setIsSpeaking(true);
      console.log('🎤 Vorlesen wird gestartet - isSpeaking auf true gesetzt');
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('⚠️ Speech Synthesis nicht verfügbar');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      console.log('🛑 Vorlesen gestoppt - isSpeaking = false');
    }
  };

  const startVoiceControl = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Spracherkennung wird in deinem Browser nicht unterstützt.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      
      if (transcript.includes('nächster schritt') || transcript.includes('weiter')) {
        if (selectedRecipe && currentStepIndex < selectedRecipe.steps.length - 1) {
          const newIndex = currentStepIndex + 1;
          setCurrentStepIndex(newIndex);
          speakText(`Schritt ${newIndex + 1}: ${selectedRecipe.steps[newIndex]}`);
        } else {
          speakText('Das war der letzte Schritt.');
        }
      } else if (transcript.includes('vorheriger schritt') || transcript.includes('zurück')) {
        if (currentStepIndex > 0) {
          const newIndex = currentStepIndex - 1;
          setCurrentStepIndex(newIndex);
          speakText(`Schritt ${newIndex + 1}: ${selectedRecipe.steps[newIndex]}`);
        }
      } else if (transcript.includes('wiederholen') || transcript.includes('nochmal')) {
        speakText(`Schritt ${currentStepIndex + 1}: ${selectedRecipe.steps[currentStepIndex]}`);
      } else if (transcript.includes('stopp') || transcript.includes('stop')) {
        recognition.stop();
      }
    };

    recognition.start();
  };

  // Improved filtering and sorting with utility functions and memoization
  const filteredRecipes = useMemo(() => {
    const effectiveMaxTime = quickTimeFilter === 'quick' ? '30' : quickTimeFilter === 'medium' ? '60' : filters.maxTime;
    const effectiveFavorite = homeActiveTab === 'favorites' ? true : filters.favorite;
    const filtered = searchRecipes(recipes, searchTerm, {
      category: filters.category,
      maxTime: effectiveMaxTime,
      difficulty: filters.difficulty,
      favorite: effectiveFavorite
    });
    return sortRecipes(filtered, sortBy, sortOrder);
  }, [recipes, searchTerm, filters, sortBy, sortOrder, quickTimeFilter, homeActiveTab]);

  // Home view: function so it's evaluated at render time (BottomNav in scope) and returns JSX, not a component — search input keeps focus
  const getHomeViewContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
        <header className="mb-6 sm:mb-8 pt-4 sm:pt-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Phils Rezepte</h1>
            </div>

            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition min-h-[44px]"
                title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium min-h-[44px]"
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm hidden sm:inline">{user.email?.split('@')[0]}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                      <div className="p-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-all">{user.email}</div>
                      <div className="border-t dark:border-gray-700" />
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px] text-sm text-gray-700 dark:text-gray-300"
                      >
                        Abmelden
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Rezepte durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px] dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Tabs: Alle Rezepte / Favoriten (IMPROVEMENTS_SPEC 3.1) */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setHomeActiveTab('all')}
              className={`flex-1 py-2.5 rounded-xl font-medium transition min-h-[44px] ${
                homeActiveTab === 'all'
                  ? 'bg-orange-500 text-white dark:bg-orange-600'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Alle Rezepte
            </button>
            <button
              type="button"
              onClick={() => setHomeActiveTab('favorites')}
              className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition min-h-[44px] ${
                homeActiveTab === 'favorites'
                  ? 'bg-orange-500 text-white dark:bg-orange-600'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Star className={`w-4 h-4 ${homeActiveTab === 'favorites' ? 'fill-current' : ''}`} />
              Favoriten
            </button>
          </div>

          {/* Quick-Filter Zeit (IMPROVEMENTS_SPEC 3.2) */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
            <button
              type="button"
              onClick={() => setQuickTimeFilter('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition min-h-[40px] ${
                quickTimeFilter === 'all'
                  ? 'bg-orange-500 text-white dark:bg-orange-600'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => setQuickTimeFilter('quick')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition min-h-[40px] ${
                quickTimeFilter === 'quick'
                  ? 'bg-orange-500 text-white dark:bg-orange-600'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              ⚡ Unter 30 Min
            </button>
            <button
              type="button"
              onClick={() => setQuickTimeFilter('medium')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition min-h-[40px] ${
                quickTimeFilter === 'medium'
                  ? 'bg-orange-500 text-white dark:bg-orange-600'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              ⏱️ Bis 60 Min
            </button>
          </div>

          <div className="flex gap-2 mb-3 sm:mb-4 flex-wrap">
            {bulkMode && (
              <div className="w-full flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl mb-2">
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {selectedRecipes.size} ausgewählt
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFavoriteSelected}
                    className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium min-h-[36px]"
                  >
                    <Star className="w-4 h-4 inline mr-1" />
                    Favorit
                  </button>
                  <button
                    onClick={deleteSelectedRecipes}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium min-h-[36px]"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Löschen
                  </button>
                  <button
                    onClick={() => {
                      setBulkMode(false);
                      setSelectedRecipes(new Set());
                    }}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium min-h-[36px]"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium active:scale-95 transition min-h-[44px] text-sm sm:text-base"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              Filter
              {(filters.category || filters.maxTime || filters.difficulty || filters.favorite) && (
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 min-h-[44px]">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">Sortieren:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border-0 focus:outline-none text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer min-h-[32px]"
              >
                <option value="date">Datum</option>
                <option value="title">Titel</option>
                <option value="rating">Bewertung</option>
                <option value="time">Zeit</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 min-w-[32px] min-h-[32px] flex items-center justify-center text-lg"
                title={sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium active:scale-95 transition min-h-[44px] text-sm sm:text-base"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Kategorien</span>
              <span className="sm:hidden">Kat.</span>
            </button>
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl border-2 font-medium active:scale-95 transition min-h-[44px] text-sm sm:text-base ${
                bulkMode 
                  ? 'bg-orange-500 text-white border-orange-500' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Auswahl</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={exportRecipes}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-green-500 text-white rounded-xl font-medium active:scale-95 transition shadow-lg hover:bg-green-600 min-h-[44px] text-xs sm:text-sm"
                title="Rezepte exportieren"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={importRecipes}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-blue-500 text-white rounded-xl font-medium active:scale-95 transition shadow-lg hover:bg-blue-600 min-h-[44px] text-xs sm:text-sm"
                title="Rezepte importieren"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            </div>
          </div>

          {showCategoryManager && <CategoryManager />}

          {showFilters && (
            <div className="mt-3 sm:mt-4 bg-white rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Kategorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-sm min-h-[44px]"
                >
                  <option value="">Alle</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Max. Zubereitungszeit</label>
                <select
                  value={filters.maxTime}
                  onChange={(e) => setFilters({ ...filters, maxTime: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-sm min-h-[44px]"
                >
                  <option value="">Egal</option>
                  <option value="15">Bis 15 Min</option>
                  <option value="30">Bis 30 Min</option>
                  <option value="60">Bis 60 Min</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Schwierigkeit</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-sm min-h-[44px]"
                >
                  <option value="">Alle</option>
                  <option value="Einfach">Einfach</option>
                  <option value="Mittel">Mittel</option>
                  <option value="Schwer">Schwer</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 mb-2 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={filters.favorite || false}
                    onChange={(e) => setFilters({ ...filters, favorite: e.target.checked || undefined })}
                    className="w-5 h-5 sm:w-4 sm:h-4 text-orange-500 rounded"
                  />
                  Nur Favoriten
                </label>
              </div>
              <button
                onClick={() => setFilters({ category: '', maxTime: '', difficulty: '', favorite: undefined })}
                className="w-full py-3 sm:py-2 text-orange-600 font-medium min-h-[44px] text-sm sm:text-base"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </header>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <ChefHat className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg mb-2">Keine Rezepte gefunden</p>
            <p className="text-gray-400 text-sm sm:text-base">{recipes.length === 0 ? 'Füge dein erstes Rezept hinzu!' : 'Versuche andere Filter'}</p>
          </div>
        ) : (
          <div className="recipe-grid grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                onClick={() => {
                  if (bulkMode) {
                    toggleRecipeSelection(recipe.id);
                  } else {
                    setSelectedRecipe(recipe);
                    setServings(recipe.servings);
                    setCurrentStepIndex(0);
                    setView('detail');
                  }
                }}
                className={`bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden transform transition relative ${
                  bulkMode 
                    ? 'cursor-pointer' 
                    : 'cursor-pointer hover:scale-105 active:scale-95'
                } ${
                  selectedRecipes.has(recipe.id) 
                    ? 'ring-4 ring-orange-500 dark:ring-orange-400' 
                    : ''
                }`}
              >
                {bulkMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedRecipes.has(recipe.id)
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedRecipes.has(recipe.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                )}
                {(recipe.isFavorite || recipe.favorite) && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
                {/* Bild: 16:9, feste Höhe, immer Container (IMPROVEMENTS_SPEC 1.2 A), lazy loading (4.1) */}
                <div className="relative w-full aspect-[16/9] max-h-32 sm:max-h-36 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  {recipe.image || recipe.imageUrl ? (
                    <img
                      src={recipe.image || recipe.imageUrl}
                      alt={recipe.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                      <ChefHat className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3 line-clamp-2">{recipe.title}</h3>
                  <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{recipe.servings} Portionen</span>
                    </div>
                    {(recipe.time || (recipe.prepTime !== undefined && recipe.cookTime !== undefined && (recipe.prepTime + recipe.cookTime) > 0)) && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{recipe.time || (recipe.prepTime || 0) + (recipe.cookTime || 0)} Min</span>
                      </div>
                    )}
                    {recipe.difficulty && (
                      <div className="flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{recipe.difficulty}</span>
                      </div>
                    )}
                  </div>
                  {recipe.rating > 0 && (
                    <div className="flex gap-1 mb-2 sm:mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${star <= recipe.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
                    {recipe.category && (
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {recipe.category.length > 20 ? recipe.category.substring(0, 20) + '...' : recipe.category}
                      </span>
                    )}
                    {recipe.date && (
                      <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(recipe.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {recipe.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {tag.length > 15 ? tag.substring(0, 15) + '...' : tag}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{recipe.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav currentView="home" />
    </div>
  );

  // Detail View
  const DetailView = () => {
    if (!selectedRecipe) return null;
    
    const factor = servings / selectedRecipe.servings;
    const [showNotes, setShowNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState(selectedRecipe.notes || '');

    const detailImage = selectedRecipe.image || selectedRecipe.imageUrl;
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 pb-24">
        <div className="max-w-3xl mx-auto">
          {/* Hero-Bild mit Gradient und Titel (IMPROVEMENTS_SPEC 1.2 B), lazy (4.1) */}
          <div className="relative w-full h-56 sm:h-64 -mt-4 -mx-4 sm:mx-0 sm:rounded-t-3xl overflow-hidden">
            {detailImage ? (
              <img
                src={detailImage}
                alt={selectedRecipe.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center">
                <ChefHat className="w-20 h-20 sm:w-24 sm:h-24 text-white opacity-50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">{selectedRecipe.title}</h1>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <button
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium text-base sm:text-lg min-h-[44px] px-2 -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Zurück</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => duplicateRecipe(selectedRecipe)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-green-500 text-white rounded-xl font-medium active:scale-95 transition shadow-lg hover:bg-green-600 min-h-[44px] text-xs sm:text-sm"
                  title="Rezept duplizieren"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Duplizieren</span>
                </button>
                <button
                  onClick={() => printRecipe(selectedRecipe)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-purple-500 text-white rounded-xl font-medium active:scale-95 transition shadow-lg hover:bg-purple-600 min-h-[44px] text-xs sm:text-sm"
                  title="Rezept drucken"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Drucken</span>
                </button>
                <button
                  onClick={() => shareRecipe(selectedRecipe)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-indigo-500 text-white rounded-xl font-medium active:scale-95 transition shadow-lg hover:bg-indigo-600 min-h-[44px] text-xs sm:text-sm"
                  title="Rezept teilen"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Teilen</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedRecipe) {
                      setEditingRecipe(selectedRecipe);
                      setView('edit');
                    } else {
                      alert('Fehler: Rezept nicht gefunden');
                    }
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-blue-500 text-white rounded-xl font-medium active:scale-95 transition shadow-lg hover:bg-blue-600 min-h-[44px] text-xs sm:text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Bearbeiten</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end items-start mb-4 gap-2">
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleFavorite(selectedRecipe.id)}
                  className={`p-2.5 sm:p-3 rounded-full transition min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    selectedRecipe.isFavorite 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Star className={`w-5 h-5 ${selectedRecipe.isFavorite ? 'fill-yellow-400' : ''}`} />
                </button>
                <button
                  onClick={() => deleteRecipe(selectedRecipe.id)}
                  className="p-2.5 sm:p-3 text-red-500 hover:bg-red-50 rounded-full transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateRecipeRating(selectedRecipe.id, star)}
                  className="transition active:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Star
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${
                      star <= (selectedRecipe.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              {selectedRecipe.category && (
                <span className="px-2.5 sm:px-3 py-1.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                  {selectedRecipe.category}
                </span>
              )}
              {selectedRecipe.difficulty && (
                <span className="px-2.5 sm:px-3 py-1.5 sm:py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-medium">
                  {selectedRecipe.difficulty}
                </span>
              )}
              {selectedRecipe.date && (
                <span className="px-2.5 sm:px-3 py-1.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {new Date(selectedRecipe.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              )}
              {selectedRecipe.tags && selectedRecipe.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 sm:px-3 py-1.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full mb-4 sm:mb-6 px-4 py-3 bg-white rounded-2xl shadow-md text-left font-medium text-gray-700 flex items-center justify-between text-base sm:text-lg min-h-[52px]"
            >
              <span>📝 Eigene Notizen {selectedRecipe.notes && '✓'}</span>
              <span className="text-lg">{showNotes ? '▲' : '▼'}</span>
            </button>

            {showNotes && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="z.B. 'mehr Salz', '10 Min länger backen'..."
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none resize-none mb-3 text-base sm:text-lg min-h-[100px]"
                />
                <button
                  onClick={() => {
                    updateRecipeNotes(selectedRecipe.id, editedNotes);
                    setShowNotes(false);
                  }}
                  className="w-full bg-orange-500 text-white py-3 sm:py-3 rounded-xl font-medium active:scale-95 transition text-base sm:text-lg min-h-[52px]"
                >
                  Notizen speichern
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Portionen</h2>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-2xl flex items-center justify-center active:scale-95 min-w-[48px] min-h-[48px]"
                  >
                    -
                  </button>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-800 w-12 sm:w-16 text-center">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-orange-100 text-orange-600 font-bold text-2xl flex items-center justify-center active:scale-95 min-w-[48px] min-h-[48px]"
                  >
                    +
                  </button>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Zutaten</h3>
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 sm:py-3 border-b border-gray-100">
                    <span className="text-gray-700 text-base sm:text-lg pr-2">{ing.name}</span>
                    <span className="font-semibold text-gray-800 text-base sm:text-lg flex-shrink-0">
                      {parseFloat((parseFloat(ing.amount) * factor).toFixed(1))} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setCurrentStepIndex(0);
                    setView('cooking');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-lg min-h-[52px]"
                >
                  <Play className="w-5 h-5" />
                  <span className="hidden sm:inline">Kochansicht</span>
                  <span className="sm:hidden">Kochen</span>
                </button>
                <button
                  onClick={() => addToShoppingList(selectedRecipe, servings)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-lg min-h-[52px]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Zur Einkaufsliste</span>
                  <span className="sm:hidden">Einkauf</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Zubereitung</h3>
                <button
                  onClick={startVoiceControl}
                  className={`p-2.5 sm:p-3 rounded-full transition min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-orange-100 text-orange-600'
                  }`}
                  title="Sprachsteuerung aktivieren"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
              {isListening && (
                <div className="mb-3 sm:mb-4 p-3 bg-orange-50 rounded-xl text-xs sm:text-sm text-orange-800">
                  🎤 Sage: "Nächster Schritt", "Zurück", "Wiederholen" oder "Stopp"
                </div>
              )}
              <div className="space-y-3 sm:space-y-4">
                {selectedRecipe.steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition ${
                      idx === currentStepIndex 
                        ? 'bg-orange-50 border-2 border-orange-300' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
                      idx === currentStepIndex 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 pt-1 flex-1 text-base sm:text-lg leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  className="flex-1 py-3 sm:py-4 bg-gray-200 text-gray-700 rounded-xl font-medium disabled:opacity-50 active:scale-95 transition text-base sm:text-lg min-h-[52px]"
                >
                  ← Zurück
                </button>
                <button
                  onClick={() => {
                    speakText(`Schritt ${currentStepIndex + 1}: ${selectedRecipe.steps[currentStepIndex]}`);
                  }}
                  className="flex-1 py-3 sm:py-4 bg-blue-500 text-white rounded-xl font-medium active:scale-95 transition flex items-center justify-center gap-2 text-base sm:text-lg min-h-[52px]"
                >
                  <Mic className="w-4 h-4" />
                  Vorlesen
                </button>
                <button
                  onClick={stopSpeaking}
                  disabled={!isSpeaking}
                  className={`px-4 py-3 sm:py-4 rounded-xl font-medium active:scale-95 transition flex items-center justify-center gap-2 text-base sm:text-lg min-h-[52px] ${
                    isSpeaking 
                      ? 'bg-red-500 text-white cursor-pointer hover:bg-red-600' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                  title={isSpeaking ? "Vorlesen stoppen" : "Kein Vorlesen aktiv"}
                >
                  <X className="w-4 h-4" />
                  <span>Stoppen</span>
                </button>
                <button
                  onClick={() => setCurrentStepIndex(Math.min(selectedRecipe.steps.length - 1, currentStepIndex + 1))}
                  disabled={currentStepIndex === selectedRecipe.steps.length - 1}
                  className="flex-1 py-3 sm:py-4 bg-orange-500 text-white rounded-xl font-medium disabled:opacity-50 active:scale-95 transition text-base sm:text-lg min-h-[52px]"
                >
                  Weiter →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Cooking View - Große, mobile-optimierte Kochansicht
  const CookingView = () => {
    if (!selectedRecipe) return null;
    
    const factor = servings / selectedRecipe.servings;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-24">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-8">
          <button
            onClick={() => setView('detail')}
            className="flex items-center gap-2 text-orange-600 mb-4 font-medium text-base sm:text-lg min-h-[44px] px-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück zur Übersicht</span>
          </button>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">{selectedRecipe.title}</h1>
            
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">{servings}</div>
                <div className="text-xs sm:text-sm text-gray-600">Portionen</div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-100 text-orange-600 font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 min-w-[48px] min-h-[48px]"
                >
                  -
                </button>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-100 text-orange-600 font-bold text-xl sm:text-2xl flex items-center justify-center active:scale-95 min-w-[48px] min-h-[48px]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Zutaten</h2>
              <div className="space-y-2 sm:space-y-3">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 sm:py-3 px-3 sm:px-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-700 text-base sm:text-lg pr-2">{ing.name}</span>
                    <span className="font-bold text-gray-800 text-base sm:text-xl flex-shrink-0">
                      {parseFloat((parseFloat(ing.amount) * factor).toFixed(1))} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => addToShoppingList(selectedRecipe, servings)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-lg mb-4 min-h-[52px]"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Zur Einkaufsliste</span>
              <span className="sm:hidden">Einkauf</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-6xl font-bold text-orange-500 mb-2">
                {currentStepIndex + 1} / {selectedRecipe.steps.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Schritt</div>
            </div>

            <div className="bg-orange-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-4 sm:mb-6 min-h-[200px] sm:min-h-[300px] flex items-center justify-center">
              <p className="text-xl sm:text-2xl md:text-3xl text-gray-800 leading-relaxed text-center">
                {selectedRecipe.steps[currentStepIndex]}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={() => {
                  if (currentStepIndex > 0) {
                    setCurrentStepIndex(currentStepIndex - 1);
                  }
                }}
                disabled={currentStepIndex === 0}
                className="flex-1 py-4 sm:py-5 bg-gray-200 text-gray-700 rounded-2xl font-bold disabled:opacity-50 active:scale-95 transition text-base sm:text-xl min-h-[52px]"
              >
                ← Zurück
              </button>
              <button
                onClick={() => {
                  speakText(`Schritt ${currentStepIndex + 1}: ${selectedRecipe.steps[currentStepIndex]}`);
                }}
                className="px-6 py-4 sm:py-5 bg-blue-500 text-white rounded-2xl font-bold active:scale-95 transition min-h-[52px] flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm sm:text-base">Vorlesen</span>
              </button>
              <button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                className={`px-4 py-4 sm:py-5 rounded-2xl font-bold active:scale-95 transition min-h-[52px] flex items-center justify-center gap-2 ${
                  isSpeaking 
                    ? 'bg-red-500 text-white cursor-pointer hover:bg-red-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                }`}
                title={isSpeaking ? "Vorlesen stoppen" : "Kein Vorlesen aktiv"}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-sm sm:text-base">Stoppen</span>
              </button>
              <button
                onClick={() => {
                  if (currentStepIndex < selectedRecipe.steps.length - 1) {
                    setCurrentStepIndex(currentStepIndex + 1);
                  }
                }}
                disabled={currentStepIndex === selectedRecipe.steps.length - 1}
                className="flex-1 py-4 sm:py-5 bg-orange-500 text-white rounded-2xl font-bold disabled:opacity-50 active:scale-95 transition text-base sm:text-xl min-h-[52px]"
              >
                Weiter →
              </button>
            </div>

            {currentStepIndex === selectedRecipe.steps.length - 1 && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-2xl text-center">
                <p className="text-lg sm:text-xl font-bold text-green-700">🎉 Fertig! Guten Appetit!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Add/Edit Recipe View - Improved Version
  const AddRecipeView = () => {
    const isEditing = editingRecipe !== null;
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [recipeServings, setRecipeServings] = useState(4);
    const [prepTime, setPrepTime] = useState(0);
    const [cookTime, setCookTime] = useState(0);
    const [difficulty, setDifficulty] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [ingredients, setIngredients] = useState([{ amount: '', unit: '', name: '' }]);
    const [steps, setSteps] = useState(['']);
    const [recipeDate, setRecipeDate] = useState(new Date().toISOString().split('T')[0]);
    const [quickIngredientInput, setQuickIngredientInput] = useState('');
    const [newTagInput, setNewTagInput] = useState('');
    const [showVoiceInput, setShowVoiceInput] = useState(false);

    // Aktualisiere States wenn editingRecipe sich ändert
    useEffect(() => {
      if (editingRecipe) {
        setTitle(editingRecipe.title || '');
        setImage(editingRecipe.image || '');
        setRecipeServings(editingRecipe.servings || 4);
        const timeValue = editingRecipe.time ? parseInt(editingRecipe.time) : 0;
        const prep = editingRecipe.prepTime || 0;
        const cook = editingRecipe.cookTime || 0;
        setPrepTime(prep || (timeValue && !prep && !cook ? Math.floor(timeValue / 2) : 0));
        setCookTime(cook || (timeValue && !prep && !cook ? Math.ceil(timeValue / 2) : 0));
        setSelectedTags(editingRecipe.tags || []);
        setIngredients(editingRecipe.ingredients && editingRecipe.ingredients.length > 0 ? editingRecipe.ingredients : [{ amount: '', unit: '', name: '' }]);
        setSteps(editingRecipe.steps && editingRecipe.steps.length > 0 ? editingRecipe.steps : ['']);
        const existingCategory = editingRecipe.category || '';
        // Parse existing category (format: "Main > Sub" or just "Sub")
        if (existingCategory.includes(' > ')) {
          const [mainOld, sub] = existingCategory.split(' > ');
          // Zu neuer Struktur zuordnen: Hauptkategorie finden, die diese Unterkategorie hat
          let matched = false;
          for (const [main, subs] of Object.entries(categoryStructure)) {
            if (subs.includes(sub)) {
              setMainCategory(main);
              setSubCategory(sub);
              matched = true;
              break;
            }
          }
          if (!matched) {
            setMainCategory(mainOld);
            setSubCategory(sub);
          }
        } else {
          // Try to find which main category this belongs to
          let found = false;
          for (const [main, subs] of Object.entries(categoryStructure)) {
            if (subs.includes(existingCategory)) {
              setMainCategory(main);
              setSubCategory(existingCategory);
              found = true;
              break;
            }
          }
          if (!found) {
            setMainCategory('');
            setSubCategory(existingCategory);
          }
        }
        setDifficulty(editingRecipe.difficulty || '');
        setRecipeDate(editingRecipe.date || new Date().toISOString().split('T')[0]);
      } else {
        // Reset für neues Rezept
        setTitle('');
        setImage('');
        setRecipeServings(4);
        setPrepTime(0);
        setCookTime(0);
        setSelectedTags([]);
        setIngredients([{ amount: '', unit: '', name: '' }]);
        setSteps(['']);
        setMainCategory('');
        setSubCategory('');
        setDifficulty('');
        setRecipeDate(new Date().toISOString().split('T')[0]);
        setQuickIngredientInput('');
        setNewTagInput('');
      }
    }, [editingRecipe]);

    const handleImageUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 3) {
        if (!confirm(`Das Bild ist groß (${fileSizeMB.toFixed(1)} MB). Es wird stark komprimiert (~180 KB), um Speicher zu sparen. Fortfahren?`)) {
          return;
        }
      }

      try {
        // Starke Komprimierung: max 400x400, Qualität 0.6, Ziel max. 180 KB
        const compressed = await compressImage(file, 400, 400, 0.6, 180);
        setImage(compressed);
        e.target.value = '';
      } catch (error) {
        console.error('Fehler beim Komprimieren:', error);
        alert('Fehler beim Verarbeiten des Bildes. Bitte versuche ein kleineres Bild oder ein anderes Format.');
      }
    };

    const addIngredient = () => {
      setIngredients([...ingredients, { amount: '', unit: '', name: '' }]);
    };

    const updateIngredient = (index, field, value) => {
      const updated = [...ingredients];
      updated[index][field] = value;
      setIngredients(updated);
    };

    const removeIngredient = (index) => {
      setIngredients(ingredients.filter((_, i) => i !== index));
    };

    // Quick ingredient add with smart parsing
    const handleQuickIngredientAdd = () => {
      if (!quickIngredientInput.trim()) return;
      const parsed = parseIngredientInput(quickIngredientInput);
      setIngredients([...ingredients, parsed]);
      setQuickIngredientInput('');
    };

    const addStep = () => {
      setSteps([...steps, '']);
    };

    const updateStep = (index, value) => {
      const updated = [...steps];
      updated[index] = value;
      setSteps(updated);
    };

    const removeStep = (index) => {
      setSteps(steps.filter((_, i) => i !== index));
    };

    // Drag and drop for steps
    const handleStepDragStart = (e: any, index: number) => {
      e.dataTransfer.setData('stepIndex', index.toString());
    };

    const handleStepDrop = (e: any, dropIndex: number) => {
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData('stepIndex'));
      const newSteps = [...steps];
      const [movedStep] = newSteps.splice(dragIndex, 1);
      newSteps.splice(dropIndex, 0, movedStep);
      setSteps(newSteps);
    };

    // Tag management
    const addTag = (tag: string) => {
      if (tag && !selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
      }
    };

    const removeTag = (tag: string) => {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const handleNewTag = () => {
      if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
        setSelectedTags([...selectedTags, newTagInput.trim()]);
        setNewTagInput('');
      }
    };

    const saveRecipe = () => {
      if (!title.trim() || ingredients.some(i => !i.name.trim()) || steps.some(s => !s.trim())) {
        alert('Bitte fülle alle Pflichtfelder aus!');
        return;
      }

      // Combine main and sub category
      const finalCategory = mainCategory && subCategory 
        ? `${mainCategory} > ${subCategory}` 
        : subCategory || mainCategory || '';

      const totalTime = prepTime + cookTime;
      const recipeData = {
        id: isEditing ? editingRecipe.id : Date.now(),
        title: title.trim(),
        image,
        servings: recipeServings || 1,
        prepTime,
        cookTime,
        time: totalTime > 0 ? totalTime.toString() : '', // backward compatibility
        category: finalCategory,
        difficulty,
        tags: selectedTags,
        ingredients: ingredients.filter(i => i.name.trim()),
        steps: steps.filter(s => s.trim()),
        date: recipeDate || new Date().toISOString().split('T')[0],
        createdAt: isEditing ? editingRecipe.createdAt : new Date().toISOString(),
        rating: isEditing ? (editingRecipe.rating || 0) : 0,
        isFavorite: isEditing ? (editingRecipe.isFavorite || false) : false,
        favorite: isEditing ? (editingRecipe.favorite || false) : false,
        notes: isEditing ? (editingRecipe.notes || '') : ''
      };

      let updated;
      if (isEditing) {
        updated = recipes.map(r => r.id === editingRecipe.id ? recipeData : r);
      } else {
        updated = [...recipes, recipeData];
      }
      
      saveRecipes(updated);
      
      if (isEditing) {
        // Aktualisiere selectedRecipe mit den neuen Daten
        setSelectedRecipe(recipeData);
        setEditingRecipe(null);
        setView('detail');
      } else {
        setEditingRecipe(null);
        setView('home');
      }
    };

    const totalTime = prepTime + cookTime;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-24">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="grid lg:grid-cols-[1fr_300px] gap-4 sm:gap-6">
            {/* Main Form */}
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-orange-600 mb-4 sm:mb-6 font-medium text-base sm:text-lg hover:text-orange-700 transition min-h-[44px] px-2 -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Zurück</span>
              </button>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6">
                {isEditing ? `Bearbeiten: ${editingRecipe?.title || ''}` : 'Neues Rezept'}
              </h1>
              {isEditing && !editingRecipe && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  Fehler: Rezept-Daten konnten nicht geladen werden. Bitte versuche es erneut.
                </div>
              )}

              {/* IMPROVEMENTS_SPEC 2.1: Rezept diktieren */}
              {!isEditing && (
                <div className="mb-4 sm:mb-6">
                  {showVoiceInput ? (
                    <VoiceRecipeInput
                      onRecipeCreated={(recipe: VoiceRecipeData) => {
                        setTitle(recipe.title);
                        setRecipeServings(recipe.servings);
                        setPrepTime(recipe.prepTime);
                        setCookTime(recipe.cookTime);
                        setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ amount: '', unit: '', name: '' }]);
                        setSteps(recipe.steps.length > 0 ? recipe.steps : ['']);
                        setSelectedTags(recipe.tags || []);
                        if (recipe.category) {
                          let matched = false;
                          for (const [main, subs] of Object.entries(categoryStructure)) {
                            if (subs.includes(recipe.category!)) {
                              setMainCategory(main);
                              setSubCategory(recipe.category);
                              matched = true;
                              break;
                            }
                          }
                          if (!matched) {
                            setMainCategory('');
                            setSubCategory(recipe.category);
                          }
                        }
                        setShowVoiceInput(false);
                      }}
                      onClose={() => setShowVoiceInput(false)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowVoiceInput(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 rounded-xl font-medium hover:bg-purple-200 dark:hover:bg-purple-800/60 transition min-h-[48px] w-full sm:w-auto"
                    >
                      <Mic className="w-5 h-5" />
                      <span>Mit Sprache eingeben</span>
                    </button>
                  )}
                </div>
              )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Titel*</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Spaghetti Carbonara"
                className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px] dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Bildupload mit Vorschau (IMPROVEMENTS_SPEC 1.2 C) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Rezeptfoto</label>
              {image ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img src={image} alt="Vorschau" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Foto entfernen"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-orange-400 dark:hover:border-orange-500 bg-gray-50 dark:bg-gray-700/50 transition">
                  <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Foto hinzufügen</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kategorie</label>
              {/* Kompakte Pill-Buttons: Emoji + Name, nicht überdimensioniert */}
              <div className="flex flex-wrap gap-2 mb-3">
                {getOrderedMainCategories(categoryStructure).map((mainCat) => (
                  <button
                    key={mainCat}
                    type="button"
                    onClick={() => {
                      setMainCategory(mainCat);
                      setSubCategory('');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      mainCategory === mainCat
                        ? 'bg-orange-500 text-white ring-2 ring-orange-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-base leading-none">{mainCat.split(' ')[0]}</span>
                    <span>{mainCat.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
              {/* Schritt 2: Unterkategorie */}
              {(mainCategory || subCategory) && (
                <div className="mt-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Unterkategorie</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-4 py-3 sm:py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-orange-400 focus:outline-none text-base dark:bg-gray-800 dark:text-gray-100 min-h-[44px]"
                  >
                    <option value="">Bitte wählen</option>
                    {mainCategory && (categoryStructure[mainCategory] || []).slice().sort((a, b) => a.localeCompare(b, 'de')).map((subCat) => (
                      <option key={subCat} value={subCat}>{subCat}</option>
                    ))}
                    {/* Bestehende/andere Kategorie anzeigen (z. B. von alten Rezepten) */}
                    {subCategory && mainCategory && !(categoryStructure[mainCategory] || []).includes(subCategory) && (
                      <option value={subCategory}>{subCategory}</option>
                    )}
                    {!mainCategory && subCategory && (
                      <option value={subCategory}>{subCategory}</option>
                    )}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datum
                </label>
                <input
                  type="date"
                  value={recipeDate}
                  onChange={(e) => setRecipeDate(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Portionen*</label>
                <input
                  type="number"
                  min={1}
                  value={recipeServings === 0 ? '' : recipeServings}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setRecipeServings(0);
                    } else {
                      const n = parseInt(raw, 10);
                      if (!isNaN(n)) setRecipeServings(Math.max(1, Math.min(999, n)));
                    }
                  }}
                  onBlur={() => {
                    if (recipeServings === 0) setRecipeServings(1);
                  }}
                  placeholder="z.B. 4"
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Vorbereitungszeit (Min)
                </label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="15"
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Kochzeit (Min)
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="30"
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px]"
                />
              </div>
              {(prepTime > 0 || cookTime > 0) && (
                <div className="col-span-2">
                  <div className="text-center py-3 bg-orange-50 rounded-xl">
                    <span className="text-sm text-gray-600">
                      Gesamtzeit: <strong className="text-orange-600 text-lg">{prepTime + cookTime} Min</strong>
                    </span>
                  </div>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Schwierigkeit</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-lg min-h-[48px]"
                >
                  <option value="">Keine Angabe</option>
                  <option value="Einfach">Einfach</option>
                  <option value="Mittel">Mittel</option>
                  <option value="Schwer">Schwer</option>
                </select>
              </div>
            </div>

            {/* Tags with Chips */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
              <label className="block text-sm font-bold text-gray-700 mb-3">Tags</label>
              
              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTags.map((tag, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition min-h-[36px]"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:bg-orange-200 rounded-full p-1 transition min-w-[28px] min-h-[28px] flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Suggested Tags */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Vorschläge:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS
                    .filter(tag => !selectedTags.includes(tag))
                    .map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => addTag(tag)}
                        className="px-3 py-2 sm:py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm hover:bg-orange-100 hover:text-orange-600 transition shadow-sm min-h-[36px]"
                      >
                        {tag}
                      </button>
                    ))
                  }
                </div>
              </div>
              
              {/* Custom Tag Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNewTag();
                    }
                  }}
                  placeholder="Eigenes Tag hinzufügen..."
                  className="flex-1 px-4 py-3 sm:py-2 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-base sm:text-sm min-h-[44px]"
                />
                <button
                  onClick={handleNewTag}
                  className="px-4 sm:px-5 py-3 sm:py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium min-w-[52px] min-h-[44px] flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ingredients Section with Smart Input */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Zutaten*</h3>
                <button
                  onClick={addIngredient}
                  className="px-4 py-2.5 sm:py-2 bg-orange-100 text-orange-600 rounded-full font-medium flex items-center gap-2 hover:bg-orange-200 active:scale-95 transition min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Zutat</span>
                </button>
              </div>

              {/* Quick Add */}
              <div className="mb-4 p-3 sm:p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                <label className="text-xs sm:text-sm font-medium text-blue-900 mb-2 block">
                  ⚡ Schnell-Eingabe (z.B. "200g Mehl", "2 EL Butter")
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickIngredientInput}
                    onChange={(e) => setQuickIngredientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickIngredientAdd();
                      }
                    }}
                    placeholder="200g Mehl"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-base min-h-[44px]"
                  />
                  <button
                    onClick={handleQuickIngredientAdd}
                    className="px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium min-h-[44px] whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Hinzufügen</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3 sm:p-4 border-2 border-gray-200 hover:border-orange-300 transition">
                    {/* Mobile: Stack layout, Desktop: Grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-[100px_130px_1fr_auto] gap-3 items-center">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Menge</label>
                        <input
                          type="text"
                          value={ing.amount}
                          onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                          placeholder="200"
                          className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 focus:border-orange-400 focus:outline-none text-center font-medium text-base min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Einheit</label>
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                          className="w-full px-3 sm:px-2 py-3 sm:py-2.5 rounded-lg border border-gray-300 focus:border-orange-400 focus:outline-none text-base sm:text-sm min-h-[44px]"
                        >
                          {COMMON_UNITS.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Zutat</label>
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                          placeholder="z.B. Mehl"
                          list={`ingredient-suggestions-${idx}`}
                          className="w-full px-3 py-3 sm:py-2.5 rounded-lg border border-gray-300 focus:border-orange-400 focus:outline-none text-base min-h-[44px]"
                        />
                        <datalist id={`ingredient-suggestions-${idx}`}>
                          {COMMON_INGREDIENTS.map(item => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                      </div>
                      {ingredients.length > 1 && (
                        <button
                          onClick={() => removeIngredient(idx)}
                          className="p-2.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition self-end sm:self-center min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps with Drag & Drop */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Zubereitung*</h3>
                <button
                  onClick={addStep}
                  className="px-4 py-2.5 sm:py-2 bg-orange-100 text-orange-600 rounded-full font-medium flex items-center gap-2 hover:bg-orange-200 active:scale-95 transition min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Schritt</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4 hidden sm:block">💡 Tipp: Ziehe Schritte zum Umsortieren</p>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="flex gap-2 sm:gap-3 cursor-move hover:bg-gray-50 p-2 rounded-lg transition"
                    draggable
                    onDragStart={(e) => handleStepDragStart(e, idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleStepDrop(e, idx)}
                  >
                    <div className="flex items-start gap-2 pt-2 flex-shrink-0">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing hidden sm:block" />
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
                        {idx + 1}
                      </div>
                    </div>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      placeholder="Beschreibe diesen Schritt..."
                      rows="4"
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none resize-none text-base min-h-[100px]"
                    />
                    {steps.length > 1 && (
                      <button
                        onClick={() => removeStep(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit mt-2 transition min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-3 sticky bottom-4 sm:bottom-20 bg-white p-3 sm:p-4 rounded-2xl shadow-2xl border-2 border-gray-200 z-10">
              {isEditing && (
                <button
                  onClick={() => {
                    setEditingRecipe(null);
                    // Aktualisiere selectedRecipe mit den neuesten Daten
                    const updatedRecipe = recipes.find(r => r.id === editingRecipe.id);
                    if (updatedRecipe) {
                      setSelectedRecipe(updatedRecipe);
                    }
                    setView('detail');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-4 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-300 active:scale-95 transition min-h-[52px]"
                >
                  Abbrechen
                </button>
              )}
              <button
                onClick={saveRecipe}
                className={`${isEditing ? 'flex-1' : 'w-full'} bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl font-bold text-base sm:text-lg hover:shadow-xl active:scale-95 transition shadow-lg min-h-[52px]`}
              >
                <span className="hidden sm:inline">{isEditing ? '✓ Änderungen speichern' : '✓ Rezept speichern'}</span>
                <span className="sm:hidden">{isEditing ? '✓ Speichern' : '✓ Speichern'}</span>
              </button>
            </div>
          </div>

          {/* Preview Sidebar (Desktop only) */}
          <div className="hidden lg:block sticky top-4 h-fit">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="text-sm font-bold text-gray-500 mb-4">VORSCHAU</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 space-y-4">
                {image && (
                  <img src={image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  {title || 'Rezepttitel...'}
                </h2>
                <div className="flex gap-4 text-sm text-gray-600">
                  {(recipeServings || 1) > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipeServings || 1}
                    </span>
                  )}
                  {totalTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {totalTime} Min
                    </span>
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {ingredients.filter(i => i.name).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">ZUTATEN</p>
                    {ingredients.filter(i => i.name).slice(0, 3).map((ing, i) => (
                      <p key={i} className="text-sm text-gray-700 truncate">
                        • {ing.amount} {ing.unit} {ing.name}
                      </p>
                    ))}
                    {ingredients.filter(i => i.name).length > 3 && (
                      <p className="text-xs text-gray-400 mt-1">
                        +{ingredients.filter(i => i.name).length - 3} weitere
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  // Shopping List Item Component (with edit functionality)
  const ShoppingListItemComponent = ({ item, onToggle, onUpdate, onDelete }: {
    item: ShoppingItem;
    onToggle: () => void;
    onUpdate: (newText: string) => void;
    onDelete: () => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.text);

    useEffect(() => {
      setEditText(item.text);
    }, [item.text]);

    const handleSave = () => {
      if (editText.trim()) {
        onUpdate(editText.trim());
        setIsEditing(false);
      }
    };

    const handleCancel = () => {
      setEditText(item.text);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 sm:gap-4 p-3 bg-orange-50 rounded-xl border-2 border-orange-300 shadow-md">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            className="flex-1 px-3 sm:px-4 py-3 rounded-lg border-2 border-orange-400 focus:border-orange-500 focus:outline-none text-base sm:text-lg font-medium bg-white min-h-[44px]"
            autoFocus
            placeholder="Produktname und Menge eingeben..."
          />
          <button
            onClick={handleSave}
            className="p-2.5 sm:p-2.5 text-green-600 hover:bg-green-100 rounded-full transition hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Speichern (Enter)"
          >
            <Check className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2.5 sm:p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Abbrechen (Escape)"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 sm:gap-3">
        <button
          onClick={onToggle}
          className={`flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition mt-0.5 min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] ${
            item.checked
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-orange-400 bg-white'
          }`}
        >
          {item.checked && <Check className="w-5 h-5 sm:w-5 sm:h-5 text-white" />}
        </button>
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onDoubleClick={() => setIsEditing(true)}
          onClick={() => {
            // On mobile, single tap can also trigger edit (optional)
            if (window.innerWidth < 768) {
              // Only on mobile, but keep double-tap as primary
            }
          }}
          title="Doppelklick zum Bearbeiten"
        >
          <p className={`font-medium text-base sm:text-base leading-relaxed ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.text}
          </p>
          {item.recipeTitles && item.recipeTitles.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5">
              {item.recipeTitles.map((title, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200"
                  title={`Aus Rezept: ${title}`}
                >
                  📋 <span className="hidden sm:inline">{title}</span><span className="sm:hidden">{title.length > 15 ? title.substring(0, 15) + '...' : title}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1 flex-shrink-0">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 sm:p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            title="Bearbeiten (oder Doppelklick auf Text)"
          >
            <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 sm:p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            title="Löschen"
          >
            <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Shopping List View with grouped categories
  const ShoppingListView = () => {
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [BarcodeScannerModal, setBarcodeScannerModal] = useState<React.ComponentType<any> | null>(null);
    
    // Lazy load BarcodeScannerModal
    useEffect(() => {
      if (showBarcodeScanner && !BarcodeScannerModal) {
        import('./components/shopping/BarcodeScannerModal').then((module) => {
          setBarcodeScannerModal(() => module.BarcodeScannerModal);
        });
      }
    }, [showBarcodeScanner, BarcodeScannerModal]);
    
    const handleAddProductFromScanner = useCallback((item: ShoppingItem) => {
      const updatedList = [...shoppingList, item];
      const merged = mergeIngredients(updatedList);
      saveShoppingList(merged);
      setShowBarcodeScanner(false);
    }, [shoppingList, saveShoppingList]);
    
    const mergedList = useMemo(() => mergeIngredients(shoppingList), [shoppingList]);
    const groupedList = useMemo(() => {
      // Add categories to items if not present
      const itemsWithCategories = mergedList.map(item => ({
        ...item,
        category: item.category || categorizeShoppingItem(item.text)
      }));
      return groupByCategory(itemsWithCategories);
    }, [mergedList]);
    
    const categoryOrder: ShoppingCategory[] = [
      'Obst & Gemüse',
      'Fleisch & Fisch',
      'Milchprodukte',
      'Backwaren',
      'Konserven',
      'Gewürze',
      'Getränke',
      'Sonstiges'
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-24">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Einkaufsliste</h1>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {/* Barcode Scanner Button */}
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-blue-100 text-blue-600 rounded-full font-medium text-sm active:scale-95 flex items-center justify-center gap-2 hover:bg-blue-200 transition min-h-[44px]"
                title="Produkt scannen"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scannen</span>
              </button>
              {mergedList.length > 0 && (
                <button
                  onClick={shareShoppingList}
                  className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-green-100 text-green-600 rounded-full font-medium text-sm active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Teilen</span>
                </button>
              )}
              {shoppingList.some(item => item.checked) && (
                <button
                  onClick={clearCheckedItems}
                  className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-red-100 text-red-600 rounded-full font-medium text-sm active:scale-95 min-h-[44px]"
                >
                  Erledigte löschen
                </button>
              )}
            </div>
          </div>

          {mergedList.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 sm:w-20 h-16 sm:h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-base sm:text-lg mb-2">Einkaufsliste ist leer</p>
              <p className="text-gray-400 text-sm sm:text-base">Füge Zutaten aus deinen Rezepten hinzu!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {categoryOrder.map((category) => {
                const items = groupedList.get(category);
                if (!items || items.length === 0) return null;
                
                return (
                  <div key={category} className="bg-white rounded-2xl p-4 sm:p-5 shadow-md">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b-2 border-gray-200">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                        {category}
                      </h2>
                      <span className="text-xs sm:text-sm font-medium text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                        {items.length} {items.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div 
                          key={item.id}
                          className={`p-3 sm:p-3 rounded-xl transition ${
                            item.checked 
                              ? 'bg-gray-50 opacity-60' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <ShoppingListItemComponent
                            item={item}
                            onToggle={() => toggleShoppingItem(item.id)}
                            onUpdate={(newText) => updateShoppingItem(item.id, newText)}
                            onDelete={() => deleteShoppingItem(item.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && BarcodeScannerModal && (
          <BarcodeScannerModal
            isOpen={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            onAddProduct={handleAddProductFromScanner}
            generateId={generateId}
            categorizeShoppingItem={categorizeShoppingItem}
          />
        )}
        
        <BottomNav currentView="shopping" />
      </div>
    );
  };

  // Meal Plan View
  const MealPlanView = () => {
    const mealTypes: Array<'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snack'> = ['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const getMealPlanForDay = (date: string, mealType: string) => {
      return mealPlans.find(p => p.date === date && p.mealType === mealType);
    };

    const getRecipeForPlan = (plan: any) => {
      return recipes.find(r => r.id === plan.recipeId);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-24">
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Wochenplaner</h1>
            <button
              onClick={addWeekToShoppingList}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-green-500 text-white rounded-xl font-medium active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Zur Einkaufsliste</span>
            </button>
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 font-bold text-gray-800">Tag</th>
                  {mealTypes.map(type => (
                    <th key={type} className="text-left p-3 font-bold text-gray-800 min-w-[150px]">
                      {type}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDays.map((date) => {
                  const dayDate = new Date(date);
                  const dayName = dayDate.toLocaleDateString('de-DE', { weekday: 'short' });
                  const dayNumber = dayDate.getDate();
                  
                  return (
                    <tr key={date} className="border-b border-gray-200">
                      <td className="p-3 font-medium text-gray-700">
                        <div>{dayName}</div>
                        <div className="text-sm text-gray-500">{dayNumber}.{dayDate.getMonth() + 1}</div>
                      </td>
                      {mealTypes.map(mealType => {
                        const plan = getMealPlanForDay(date, mealType);
                        const recipe = plan ? getRecipeForPlan(plan) : null;
                        
                        return (
                          <td key={mealType} className="p-3">
                            {plan && recipe ? (
                              <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-sm text-gray-800">{recipe.title}</span>
                                  <button
                                    onClick={() => removeMealPlan(plan.id)}
                                    className="text-red-500 hover:text-red-700 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedRecipe(recipe);
                                    setView('detail');
                                  }}
                                  className="text-xs text-orange-600 hover:underline min-h-[32px]"
                                >
                                  Details →
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDateForMealPlan(date);
                                  setSelectedMealTypeForMealPlan(mealType);
                                  setShowRecipeSelector(true);
                                }}
                                className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-orange-400 hover:text-orange-400 transition text-sm min-h-[64px]"
                              >
                                + Rezept
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Card View */}
          <div className="md:hidden space-y-4">
            {weekDays.map((date) => {
              const dayDate = new Date(date);
              const dayName = dayDate.toLocaleDateString('de-DE', { weekday: 'long' });
              const dayNumber = dayDate.getDate();
              const month = dayDate.getMonth() + 1;
              const isToday = date === new Date().toISOString().split('T')[0];
              
              return (
                <div key={date} className="bg-white rounded-2xl p-4 shadow-lg">
                  <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${isToday ? 'border-orange-400' : 'border-gray-200'}`}>
                    <div>
                      <div className="font-bold text-lg text-gray-800">{dayName}</div>
                      <div className="text-sm text-gray-500">{dayNumber}.{month}</div>
                    </div>
                    {isToday && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                        Heute
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {mealTypes.map(mealType => {
                      const plan = getMealPlanForDay(date, mealType);
                      const recipe = plan ? getRecipeForPlan(plan) : null;
                      
                      return (
                        <div key={mealType} className="border-2 border-gray-100 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase">{mealType}</span>
                            {plan && (
                              <button
                                onClick={() => removeMealPlan(plan.id)}
                                className="text-red-500 hover:text-red-700 min-w-[32px] min-h-[32px] flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {plan && recipe ? (
                            <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-200">
                              <div className="font-medium text-sm text-gray-800 mb-2">{recipe.title}</div>
                              <button
                                onClick={() => {
                                  setSelectedRecipe(recipe);
                                  setView('detail');
                                }}
                                className="text-xs text-orange-600 hover:underline font-medium min-h-[32px]"
                              >
                                Details anzeigen →
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDateForMealPlan(date);
                                setSelectedMealTypeForMealPlan(mealType);
                                setShowRecipeSelector(true);
                              }}
                              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-orange-400 hover:text-orange-400 transition text-sm font-medium min-h-[52px]"
                            >
                              + Rezept hinzufügen
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-6 bg-blue-50 rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-800">
              <strong>Tipp:</strong> Klicke auf "+ Rezept" um ein Rezept für einen Tag und eine Mahlzeit hinzuzufügen. 
              Nutze "Zur Einkaufsliste" um alle Zutaten der Woche auf einmal hinzuzufügen.
            </p>
          </div>

          {/* Recipe Selector Modal */}
          {showRecipeSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Rezept auswählen</h2>
                  <button
                    onClick={() => {
                      setShowRecipeSelector(false);
                      setSelectedDateForMealPlan(null);
                      setSelectedMealTypeForMealPlan(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recipes.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        if (selectedDateForMealPlan && selectedMealTypeForMealPlan) {
                          addMealPlan(selectedDateForMealPlan, recipe.id, selectedMealTypeForMealPlan as 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snack');
                          setShowRecipeSelector(false);
                          setSelectedDateForMealPlan(null);
                          setSelectedMealTypeForMealPlan(null);
                        }
                      }}
                      className="text-left p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition border-2 border-transparent hover:border-orange-200 min-h-[64px] flex flex-col justify-center"
                    >
                      <div className="font-medium text-base sm:text-sm text-gray-800">{recipe.title}</div>
                      {recipe.category && (
                        <div className="text-xs text-gray-500 mt-1">{recipe.category}</div>
                      )}
                    </button>
                  ))}
                </div>
                {recipes.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                    Keine Rezepte vorhanden. Erstelle zuerst ein Rezept!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <BottomNav currentView="mealplan" />
      </div>
    );
  };

  // Bottom Navigation
  const BottomNav = ({ currentView }: { currentView: string }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
      <div className="max-w-4xl mx-auto flex justify-around py-2 sm:py-3">
        <button
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-xl transition min-h-[60px] min-w-[60px] justify-center ${
            currentView === 'home' ? 'text-orange-600 bg-orange-50' : 'text-gray-500'
          }`}
        >
          <ChefHat className="w-5 h-5" />
          <span className="text-xs font-medium">Rezepte</span>
        </button>
        <button
          onClick={() => setView('mealplan')}
          className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-xl transition min-h-[60px] min-w-[60px] justify-center ${
            currentView === 'mealplan' ? 'text-orange-600 bg-orange-50' : 'text-gray-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-xs font-medium">Plan</span>
        </button>
        <button
          onClick={() => setView('add')}
          className="flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg active:scale-95 transition min-h-[60px] min-w-[60px] justify-center"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs font-bold">Neu</span>
        </button>
        <button
          onClick={() => setView('shopping')}
          className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-2 rounded-xl transition relative min-h-[60px] min-w-[60px] justify-center ${
            currentView === 'shopping' ? 'text-orange-600 bg-orange-50' : 'text-gray-500'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs font-medium">Einkauf</span>
          {shoppingList.length > 0 && (
            <span className="absolute top-1 right-1 sm:right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {shoppingList.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <ChefHat className="w-16 h-16 text-orange-500 animate-pulse" />
      </div>
    );
  }

  if (isSupabaseConfigured && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Auth onSignIn={(u: any) => setUser(u)} />
      </div>
    );
  }

  return (
    <>
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <X className="w-5 h-5 cursor-pointer" onClick={() => setError(null)} />
          <span>{error}</span>
        </div>
      )}
      
      {view === 'home' && getHomeViewContent()}
      {view === 'detail' && <DetailView />}
      {view === 'cooking' && <CookingView />}
      {(view === 'add' || view === 'edit') && <AddRecipeView />}
      {view === 'shopping' && <ShoppingListView />}
      {view === 'mealplan' && <MealPlanView />}
    </>
  );
};

export default RecipeApp;
