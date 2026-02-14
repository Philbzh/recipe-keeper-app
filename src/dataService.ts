// Data service for Supabase operations with offline support and error handling
import { Recipe, ShoppingItem, MealPlan, AppState } from './types';

class RecipeDataService {
  private supabase: any;
  private user: any;
  private onError?: (message: string) => void;
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;

  constructor(supabase: any, user: any, onError?: (message: string) => void) {
    this.supabase = supabase;
    this.user = user;
    this.onError = onError;
  }

  private getKey(baseKey: string): string {
    return this.user ? `user:${this.user.id}:${baseKey}` : baseKey;
  }

  private handleError(context: string, error: any) {
    console.error(`${context}:`, error);
    if (this.onError) {
      this.onError(`Fehler beim ${context}: ${error.message || 'Unbekannter Fehler'}`);
    }
  }

  // Load all data with fallback chain: Supabase -> localStorage
  async loadAll(): Promise<Partial<AppState>> {
    const result: Partial<AppState> = {
      recipes: [],
      shoppingList: [],
      categories: [],
      mealPlans: []
    };

    try {
      // Try Supabase first if configured
      if (this.supabase && this.user) {
        const supabaseData = await this.loadFromSupabase();
        if (supabaseData) {
          return supabaseData;
        }
      }

      // Fallback to localStorage
      return this.loadFromLocalStorage();
    } catch (error) {
      this.handleError('Laden der Daten', error);
      return this.loadFromLocalStorage();
    }
  }

  private async loadFromSupabase(): Promise<Partial<AppState> | null> {
    try {
      const keys = ['recipes', 'shopping-list', 'categories', 'meal-plans'];
      const promises = keys.map(key =>
        this.supabase
          .from('kv')
          .select('value')
          .eq('key', this.getKey(key))
          .single()
      );

      const results = await Promise.all(promises);
      
      return {
        recipes: results[0].data?.value || [],
        shoppingList: results[1].data?.value || [],
        categories: results[2].data?.value || [],
        mealPlans: results[3].data?.value || []
      };
    } catch (error) {
      console.warn('Supabase load failed, using localStorage:', error);
      return null;
    }
  }

  private loadFromLocalStorage(): Partial<AppState> {
    try {
      return {
        recipes: JSON.parse(localStorage.getItem('recipes') || '[]'),
        shoppingList: JSON.parse(localStorage.getItem('shopping-list') || '[]'),
        categories: JSON.parse(localStorage.getItem('categories') || '[]'),
        mealPlans: JSON.parse(localStorage.getItem('meal-plans') || '[]')
      };
    } catch (error) {
      console.error('LocalStorage load failed:', error);
      return {
        recipes: [],
        shoppingList: [],
        categories: [],
        mealPlans: []
      };
    }
  }

  // Save with optimistic updates and sync queue
  async save<T>(key: string, data: T, optimisticUpdate?: () => void): Promise<boolean> {
    // Optimistic update for immediate UI response
    if (optimisticUpdate) {
      optimisticUpdate();
    }

    // Save to localStorage immediately
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      this.handleError(`Speichern in localStorage (${key})`, error);
      return false;
    }

    // Queue Supabase sync
    if (this.supabase && this.user) {
      this.queueSync(async () => {
        await this.supabase.from('kv').upsert({
          key: this.getKey(key),
          value: data
        });
      });
    }

    return true;
  }

  // Queue sync operations to prevent race conditions
  private queueSync(operation: () => Promise<void>) {
    this.syncQueue.push(operation);
    if (!this.isSyncing) {
      this.processSyncQueue();
    }
  }

  private async processSyncQueue() {
    if (this.syncQueue.length === 0) {
      this.isSyncing = false;
      return;
    }

    this.isSyncing = true;
    const operation = this.syncQueue.shift();

    if (operation) {
      try {
        await operation();
      } catch (error) {
        this.handleError('Synchronisierung', error);
        // Re-queue failed operations
        this.syncQueue.push(operation);
      }
    }

    // Process next in queue
    setTimeout(() => this.processSyncQueue(), 100);
  }

  // Specific save methods
  async saveRecipes(recipes: Recipe[]): Promise<boolean> {
    return this.save('recipes', recipes);
  }

  async saveShoppingList(list: ShoppingItem[]): Promise<boolean> {
    return this.save('shopping-list', list);
  }

  async saveCategories(categories: string[]): Promise<boolean> {
    return this.save('categories', categories);
  }

  async saveMealPlans(plans: MealPlan[]): Promise<boolean> {
    return this.save('meal-plans', plans);
  }

  // Batch save for related updates
  async saveBatch(updates: Partial<AppState>): Promise<boolean> {
    const promises: Promise<boolean>[] = [];

    if (updates.recipes) promises.push(this.saveRecipes(updates.recipes));
    if (updates.shoppingList) promises.push(this.saveShoppingList(updates.shoppingList));
    if (updates.categories) promises.push(this.saveCategories(updates.categories));
    if (updates.mealPlans) promises.push(this.saveMealPlans(updates.mealPlans));

    const results = await Promise.all(promises);
    return results.every(r => r);
  }

  // Force sync from Supabase (for manual refresh)
  async forceSync(): Promise<Partial<AppState> | null> {
    if (!this.supabase || !this.user) {
      return null;
    }

    try {
      const data = await this.loadFromSupabase();
      if (data) {
        // Update localStorage with Supabase data
        if (data.recipes) localStorage.setItem('recipes', JSON.stringify(data.recipes));
        if (data.shoppingList) localStorage.setItem('shopping-list', JSON.stringify(data.shoppingList));
        if (data.categories) localStorage.setItem('categories', JSON.stringify(data.categories));
        if (data.mealPlans) localStorage.setItem('meal-plans', JSON.stringify(data.mealPlans));
      }
      return data;
    } catch (error) {
      this.handleError('Synchronisierung', error);
      return null;
    }
  }
}

export default RecipeDataService;
