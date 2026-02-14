// OpenFoodFacts API Service für Produktdaten
// Isoliert, keine Abhängigkeiten zur Haupt-App

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

export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org/api/v2';
  private static readonly CACHE_KEY = 'openfoodfacts_cache';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden
  
  // Cache für bereits gescannte Produkte
  private static getCache(): Map<string, { data: ProductData; timestamp: number }> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const map = new Map<string, { data: ProductData; timestamp: number }>();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          map.set(key, value);
        });
        return map;
      }
    } catch (error) {
      console.warn('Cache konnte nicht geladen werden:', error);
    }
    return new Map();
  }
  
  private static setCache(barcode: string, data: ProductData): void {
    try {
      const cache = this.getCache();
      cache.set(barcode, { data, timestamp: Date.now() });
      const obj = Object.fromEntries(cache);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.warn('Cache konnte nicht gespeichert werden:', error);
    }
  }
  
  // Produktdaten anhand Barcode abrufen (mit Cache)
  static async getProductByBarcode(barcode: string): Promise<ProductData | null> {
    // Prüfe Cache zuerst
    const cache = this.getCache();
    const cached = cache.get(barcode);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`✅ Produkt aus Cache: ${cached.data.name}`);
      return cached.data;
    }
    
    try {
      console.log(`🔍 Suche Produkt mit Barcode: ${barcode}`);
      
      const response = await fetch(`${this.BASE_URL}/product/${barcode}.json`);
      
      if (!response.ok) {
        console.log(`❌ Produkt nicht gefunden: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status === 0) {
        console.log('❌ Produkt nicht in Datenbank gefunden');
        return null;
      }
      
      const product = data.product;
      
      // Produktdaten extrahieren und formatieren
      // Verbesserte Extraktion: mehrere Felder für Name, Marke und Menge prüfen
      const productName = product.product_name || 
                          product.product_name_en || 
                          product.product_name_de ||
                          product.abbreviated_product_name ||
                          product.generic_name ||
                          'Unbekanntes Produkt';
      
      // Marke: Prüfe mehrere Quellen und entferne Duplikate
      let brand = product.brands || 
                  product.brand_owner ||
                  product.brand ||
                  product.brands_tags?.[0]?.replace('en:', '') ||
                  undefined;
      
      // Wenn Marke gleich Name ist, entferne Marke (vermeidet Duplikate)
      if (brand && brand.toLowerCase().trim() === productName.toLowerCase().trim()) {
        brand = undefined;
      }
      
      // Menge: Prüfe mehrere Quellen, auch in verschiedenen Formaten
      let quantity = product.quantity || 
                    product.product_quantity ||
                    product.quantity_de ||
                    product.quantity_en ||
                    product.net_weight ||
                    product.net_content ||
                    undefined;
      
      // Falls keine explizite Menge, versuche aus Name zu extrahieren (z.B. "500ml", "1L")
      if (!quantity && productName) {
        const quantityMatch = productName.match(/\b(\d+[\.,]?\d*\s*(ml|cl|l|g|kg|mg|stk|stück|st|pcs?|x))\b/i);
        if (quantityMatch) {
          quantity = quantityMatch[1];
        }
      }
      
      // Verpackung: Prüfe mehrere Quellen
      const packaging = product.packaging || 
                       product.packaging_text ||
                       product.packaging_tags?.[0]?.replace('en:', '') ||
                       product.packaging_text_de ||
                       undefined;
      
      const productData: ProductData = {
        barcode: barcode,
        name: productName.trim(),
        brand: brand ? brand.trim() : undefined,
        category: this.getCategory(product.categories_tags),
        image: product.image_url || product.image_front_url || undefined,
        nutrition: this.extractNutrition(product.nutriments),
        ingredients: this.extractIngredients(product.ingredients_text),
        allergens: this.extractAllergens(product.allergens_tags),
        additives: this.extractAdditives(product.additives_tags),
        packaging: packaging ? packaging.trim() : undefined,
        quantity: quantity ? quantity.trim() : undefined,
        labels: product.labels_tags || [],
        ecoScore: product.ecoscore_grade || undefined,
        novaGroup: product.nova_group || undefined
      };
      
      // In Cache speichern
      this.setCache(barcode, productData);
      
      console.log(`✅ Produkt gefunden: ${productData.name}`);
      return productData;
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Produktdaten:', error);
      return null;
    }
  }
  
  // Kategorie aus Tags extrahieren und zu ShoppingCategory mappen
  private static getCategory(categoriesTags: string[]): string {
    if (!categoriesTags || categoriesTags.length === 0) return 'Sonstiges';
    
    const categoryMap: { [key: string]: string } = {
      'en:meat': 'Fleisch & Fisch',
      'en:fish': 'Fleisch & Fisch',
      'en:dairy': 'Milchprodukte',
      'en:eggs': 'Milchprodukte',
      'en:fruits': 'Obst & Gemüse',
      'en:vegetables': 'Obst & Gemüse',
      'en:cereals': 'Backwaren',
      'en:beverages': 'Getränke',
      'en:snacks': 'Sonstiges',
      'en:sweets': 'Sonstiges',
      'en:condiments': 'Gewürze',
      'en:spices': 'Gewürze',
      'en:oils': 'Gewürze',
      'en:bread': 'Backwaren',
      'en:pasta': 'Backwaren',
      'en:rice': 'Backwaren',
      'en:legumes': 'Obst & Gemüse',
      'en:nuts': 'Sonstiges',
      'en:herbs': 'Gewürze',
      'en:frozen-foods': 'Sonstiges',
      'en:canned-foods': 'Konserven'
    };
    
    for (const tag of categoriesTags) {
      if (categoryMap[tag]) {
        return categoryMap[tag];
      }
    }
    
    return 'Sonstiges';
  }
  
  // Nährwerte extrahieren
  private static extractNutrition(nutriments: any): any {
    if (!nutriments) return {};
    
    return {
      calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || undefined,
      protein: nutriments['proteins_100g'] || nutriments['proteins'] || undefined,
      carbs: nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || undefined,
      fat: nutriments['fat_100g'] || nutriments['fat'] || undefined,
      sugar: nutriments['sugars_100g'] || nutriments['sugars'] || undefined,
      salt: nutriments['sodium_100g'] || nutriments['sodium'] || undefined
    };
  }
  
  // Zutaten extrahieren
  private static extractIngredients(ingredientsText: string): string[] {
    if (!ingredientsText) return [];
    
    return ingredientsText
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0);
  }
  
  // Allergene extrahieren
  private static extractAllergens(allergensTags: string[]): string[] {
    if (!allergensTags) return [];
    
    const allergenMap: { [key: string]: string } = {
      'en:gluten': 'Gluten',
      'en:milk': 'Milch',
      'en:eggs': 'Eier',
      'en:fish': 'Fisch',
      'en:crustaceans': 'Krebstiere',
      'en:molluscs': 'Weichtiere',
      'en:nuts': 'Nüsse',
      'en:peanuts': 'Erdnüsse',
      'en:soybeans': 'Soja',
      'en:sesame-seeds': 'Sesam',
      'en:mustard': 'Senf',
      'en:celery': 'Sellerie',
      'en:lupin': 'Lupinen',
      'en:sulphur-dioxide': 'Schwefeldioxid'
    };
    
    return allergensTags
      .map(tag => allergenMap[tag] || tag.replace('en:', '').replace(/-/g, ' '))
      .filter(allergen => allergen);
  }
  
  // Zusatzstoffe extrahieren
  private static extractAdditives(additivesTags: string[]): string[] {
    if (!additivesTags) return [];
    
    return additivesTags
      .map(tag => tag.replace('en:', '').replace(/-/g, ' '))
      .filter(additive => additive);
  }
  
  // Produktsuche nach Name (für erweiterte Suche)
  static async searchProducts(query: string, page: number = 1): Promise<ProductData[]> {
    try {
      console.log(`🔍 Suche Produkte: ${query}`);
      
      const response = await fetch(
        `${this.BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=20`
      );
      
      if (!response.ok) {
        console.log(`❌ Suche fehlgeschlagen: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      
      if (!data.products || data.products.length === 0) {
        console.log('❌ Keine Produkte gefunden');
        return [];
      }
      
      const products: ProductData[] = data.products
        .filter((product: any) => product.code) // Nur Produkte mit Barcode
        .map((product: any) => ({
          barcode: product.code,
          name: product.product_name || product.product_name_en || 'Unbekanntes Produkt',
          brand: product.brands || undefined,
          category: this.getCategory(product.categories_tags),
          image: product.image_url || product.image_front_url || undefined,
          nutrition: this.extractNutrition(product.nutriments),
          ingredients: this.extractIngredients(product.ingredients_text),
          allergens: this.extractAllergens(product.allergens_tags),
          additives: this.extractAdditives(product.additives_tags),
          packaging: product.packaging || undefined,
          quantity: product.quantity || undefined,
          labels: product.labels_tags || [],
          ecoScore: product.ecoscore_grade || undefined,
          novaGroup: product.nova_group || undefined
        }));
      
      console.log(`✅ ${products.length} Produkte gefunden`);
      return products;
      
    } catch (error) {
      console.error('❌ Fehler bei der Produktsuche:', error);
      return [];
    }
  }
}
