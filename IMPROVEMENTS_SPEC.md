# Phils Rezepte - Verbesserungs-Spezifikation für Cursor AI

## 🎯 Priorität 1: Kritische UI-Fixes

### 1.1 Kategorien-System überarbeiten
**Problem:** Kategorien sind unübersichtlich, Text umbrüche bei Icons

**Lösung:**
```typescript
// Neue, schlanke Kategoriestruktur - nur 8 Hauptkategorien
const categoryStructure = {
  '🥗 Vorspeisen': [
    'Suppen',
    'Salate', 
    'Fingerfood',
    'Dips'
  ],
  
  '🍖 Hauptgerichte': [
    'Fleisch',
    'Fisch',
    'Vegetarisch',
    'Vegan',
    'Pasta',
    'Pizza'
  ],
  
  '🥔 Beilagen': [
    'Kartoffeln',
    'Gemüse',
    'Reis',
    'Salate'
  ],
  
  '🎂 Kuchen': [
    'Blechkuchen',
    'Torten',
    'Obstkuchen',
    'Käsekuchen'
  ],
  
  '🥐 Gebäck': [
    'Kekse',
    'Muffins',
    'Croissants',
    'Donuts'
  ],
  
  '🍞 Brot': [
    'Weißbrot',
    'Vollkorn',
    'Brötchen',
    'Baguette'
  ],
  
  '🍨 Desserts': [
    'Eis',
    'Cremes',
    'Pudding',
    'Tiramisu'
  ],
  
  '🍳 Frühstück': [
    'Müsli',
    'Pancakes',
    'Waffeln',
    'Eiergerichte'
  ]
};
```

**UI-Anpassungen:**
- Kategorie-Buttons: `flex-nowrap` und `truncate` verwenden
- Emoji OHNE Text in Pill-Buttons (Text nur in Dropdown)
- Max 3 Zeilen für Kategorie-Auswahl
- Zweistufiges System: Erst Hauptkategorie (8 Icons), dann Unterkategorie

**Code-Änderungen in AddRecipeView:**
```typescript
// Schritt 1: Hauptkategorie auswählen
<div className="grid grid-cols-4 gap-2">
  {Object.keys(categoryStructure).map(mainCat => {
    const emoji = mainCat.split(' ')[0]; // Nur Emoji
    return (
      <button
        key={mainCat}
        onClick={() => setSelectedMainCategory(mainCat)}
        className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition ${
          selectedMainCategory === mainCat 
            ? 'bg-orange-500 scale-110' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {emoji}
      </button>
    );
  })}
</div>

// Schritt 2: Unterkategorie auswählen (nur wenn Hauptkategorie gewählt)
{selectedMainCategory && (
  <select
    value={newRecipe.category}
    onChange={(e) => setNewRecipe({...newRecipe, category: e.target.value})}
    className="w-full px-4 py-3 rounded-xl border-2"
  >
    <option value="">Unterkategorie wählen...</option>
    {categoryStructure[selectedMainCategory].map(sub => (
      <option key={sub} value={sub}>{sub}</option>
    ))}
  </select>
)}
```

---

### 1.2 Bilder besser anzeigen
**Problem:** Bilder zu groß, nicht gut sichtbar

**Lösung - 3 verschiedene Ansichten:**

**A) In der Rezept-Liste (HomeView):**
```typescript
// Kompakte Karten mit kleineren Bildern
<div className="grid grid-cols-2 gap-3">
  {filteredRecipes.map(recipe => (
    <div key={recipe.id} className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Bild: 16:9 Format, feste Höhe */}
      <div className="relative w-full h-32 bg-gray-200">
        {recipe.image ? (
          <img 
            src={recipe.image} 
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ChefHat className="w-12 h-12" />
          </div>
        )}
        {/* Favorit-Badge */}
        {recipe.favorite && (
          <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        )}
      </div>
      
      {/* Info kompakt */}
      <div className="p-3">
        <h3 className="font-bold text-sm line-clamp-2 mb-2">{recipe.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{recipe.prepTime} Min</span>
          <Users className="w-3 h-3 ml-2" />
          <span>{recipe.servings}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

**B) In der Detailansicht (DetailView):**
```typescript
// Großes Hero-Bild mit Parallax-Effekt
<div className="relative w-full h-64 -mt-4 -mx-4">
  {selectedRecipe.image ? (
    <img 
      src={selectedRecipe.image} 
      alt={selectedRecipe.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
      <ChefHat className="w-24 h-24 text-white opacity-50" />
    </div>
  )}
  
  {/* Gradient Overlay für bessere Lesbarkeit */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
  
  {/* Titel über dem Bild */}
  <div className="absolute bottom-4 left-4 right-4">
    <h1 className="text-2xl font-bold text-white drop-shadow-lg">
      {selectedRecipe.title}
    </h1>
  </div>
</div>
```

**C) Beim Erstellen/Bearbeiten:**
```typescript
// Bildupload mit Vorschau
<div className="space-y-3">
  <label className="block text-sm font-medium text-gray-700">Foto</label>
  
  {/* Vorschau wenn Bild vorhanden */}
  {newRecipe.image && (
    <div className="relative w-full h-48 rounded-xl overflow-hidden">
      <img 
        src={newRecipe.image} 
        alt="Vorschau"
        className="w-full h-full object-cover"
      />
      <button
        onClick={() => setNewRecipe({...newRecipe, image: ''})}
        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}
  
  {/* Upload Button wenn kein Bild */}
  {!newRecipe.image && (
    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 bg-gray-50">
      <Camera className="w-12 h-12 text-gray-400 mb-2" />
      <span className="text-sm text-gray-500">Foto hinzufügen</span>
      <input 
        type="file" 
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </label>
  )}
</div>
```

---

## 🎯 Priorität 2: AI-Spracheingabe für Rezepte

### 2.1 Mikrofon-Feature für Rezept-Eingabe
**Was:** Rezept diktieren statt tippen

**Technologie:** Web Speech API (funktioniert in Chrome/Safari ohne externe Bibliothek)

**Implementation:**

```typescript
// Neue Komponente: VoiceRecipeInput.tsx
import { useState, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

const VoiceRecipeInput = ({ onRecipeCreated }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef(null);

  // Web Speech API initialisieren
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'de-DE';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      setTranscript(fullTranscript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Claude API aufrufen um Rezept zu strukturieren
  const processWithAI = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'ANTHROPIC_API_KEY_HIER', // Vom User eingeben lassen in Settings
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Extrahiere aus diesem diktierten Text ein strukturiertes Rezept. 
            
Text: "${transcript}"

Bitte gib NUR ein JSON-Objekt zurück mit:
{
  "title": "Rezeptname",
  "prepTime": "Zeit in Minuten (nur Zahl)",
  "servings": "Anzahl Portionen (nur Zahl)",
  "ingredients": [
    {"amount": "Menge", "unit": "Einheit", "name": "Zutat"}
  ],
  "instructions": [
    "Schritt 1",
    "Schritt 2"
  ],
  "category": "Kategorie",
  "tags": ["Tag1", "Tag2"]
}`
          }]
        })
      });

      const data = await response.json();
      const recipeText = data.content[0].text;
      
      // JSON aus der Antwort extrahieren
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const recipe = JSON.parse(jsonMatch[0]);
        onRecipeCreated(recipe);
      }
    } catch (error) {
      console.error('AI-Verarbeitung fehlgeschlagen:', error);
      alert('Fehler bei der AI-Verarbeitung. Bitte manuell eingeben.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-800">Rezept diktieren</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Sage z.B.: "Spaghetti Carbonara. Für 4 Personen. 25 Minuten. 
        Zutaten: 400 Gramm Spaghetti, 200 Gramm Pancetta, 4 Eier..."
      </p>

      {/* Mikrofon Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`w-full py-6 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3 ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
      >
        {isListening ? (
          <>
            <MicOff className="w-6 h-6" />
            Aufnahme beenden
          </>
        ) : (
          <>
            <Mic className="w-6 h-6" />
            Aufnahme starten
          </>
        )}
      </button>

      {/* Transcript Anzeige */}
      {transcript && (
        <div className="mt-4 p-4 bg-white rounded-xl">
          <p className="text-sm text-gray-600 mb-2 font-medium">Aufgenommen:</p>
          <p className="text-sm text-gray-800">{transcript}</p>
          
          <button
            onClick={processWithAI}
            disabled={isProcessing}
            className="mt-4 w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition"
          >
            {isProcessing ? 'AI verarbeitet...' : '✨ Mit AI strukturieren'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecipeInput;
```

**Integration in AddRecipeView:**
```typescript
// In AddRecipeView hinzufügen:
const [showVoiceInput, setShowVoiceInput] = useState(false);

// Button zum Aktivieren (oben in der View):
<button
  onClick={() => setShowVoiceInput(!showVoiceInput)}
  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
>
  <Mic className="w-5 h-5" />
  <span className="font-medium">Mit Sprache eingeben</span>
</button>

// Komponente einbinden:
{showVoiceInput && (
  <VoiceRecipeInput 
    onRecipeCreated={(recipe) => {
      setNewRecipe({...newRecipe, ...recipe});
      setShowVoiceInput(false);
    }}
  />
)}
```

---

## 🎯 Priorität 3: Schnelle Wins für bessere UX

### 3.1 Favoriten prominent anzeigen
```typescript
// In HomeView - Tab für Favoriten hinzufügen
const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

<div className="flex gap-2 mb-4">
  <button
    onClick={() => setActiveTab('all')}
    className={`flex-1 py-2 rounded-lg font-medium ${
      activeTab === 'all' 
        ? 'bg-orange-500 text-white' 
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    Alle Rezepte
  </button>
  <button
    onClick={() => setActiveTab('favorites')}
    className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
      activeTab === 'favorites' 
        ? 'bg-orange-500 text-white' 
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    <Star className="w-4 h-4" />
    Favoriten
  </button>
</div>

// Filter anpassen:
const displayRecipes = activeTab === 'favorites' 
  ? filteredRecipes.filter(r => r.favorite)
  : filteredRecipes;
```

### 3.2 Schnellfilter für Zubereitungszeit
```typescript
// Quick-Filter Chips über der Rezeptliste
<div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
  <button
    onClick={() => setQuickFilter('all')}
    className={`px-4 py-2 rounded-full whitespace-nowrap ${
      quickFilter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100'
    }`}
  >
    Alle
  </button>
  <button
    onClick={() => setQuickFilter('quick')}
    className={`px-4 py-2 rounded-full whitespace-nowrap ${
      quickFilter === 'quick' ? 'bg-orange-500 text-white' : 'bg-gray-100'
    }`}
  >
    ⚡ Unter 30 Min
  </button>
  <button
    onClick={() => setQuickFilter('medium')}
    className={`px-4 py-2 rounded-full whitespace-nowrap ${
      quickFilter === 'medium' ? 'bg-orange-500 text-white' : 'bg-gray-100'
    }`}
  >
    ⏱️ 30-60 Min
  </button>
</div>
```

### 3.3 Zutaten-Mengen beim Shopping automatisch zusammenrechnen
```typescript
// Funktion in utils.ts hinzufügen:
export const consolidateShoppingList = (items: ShoppingItem[]): ShoppingItem[] => {
  const consolidated = new Map<string, ShoppingItem>();
  
  items.forEach(item => {
    const key = `${item.name}-${item.unit}`.toLowerCase();
    
    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      // Mengen addieren wenn gleiche Einheit
      existing.amount = (parseFloat(existing.amount) + parseFloat(item.amount)).toString();
    } else {
      consolidated.set(key, {...item});
    }
  });
  
  return Array.from(consolidated.values());
};

// In ShoppingListView verwenden:
const consolidatedList = useMemo(() => 
  consolidateShoppingList(shoppingList), 
  [shoppingList]
);
```

### 3.4 "Was kann ich kochen?" Feature
```typescript
// Neue View: InventorySearch
const InventorySearchView = () => {
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [matchingRecipes, setMatchingRecipes] = useState([]);

  const findMatchingRecipes = () => {
    const matches = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => 
        i.name.toLowerCase()
      );
      const available = availableIngredients.map(i => i.toLowerCase());
      
      // Mindestens 70% der Zutaten verfügbar
      const matchCount = recipeIngredients.filter(ing => 
        available.some(av => ing.includes(av) || av.includes(ing))
      ).length;
      
      return (matchCount / recipeIngredients.length) >= 0.7;
    });
    
    setMatchingRecipes(matches);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">🔍 Was kann ich kochen?</h1>
        
        {/* Zutat hinzufügen */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <input
            type="text"
            placeholder="Zutat eingeben (z.B. Tomaten)..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                setAvailableIngredients([...availableIngredients, e.target.value]);
                e.target.value = '';
              }
            }}
            className="w-full px-4 py-2 rounded-lg border-2"
          />
          
          {/* Liste der verfügbaren Zutaten */}
          <div className="flex flex-wrap gap-2 mt-3">
            {availableIngredients.map((ing, idx) => (
              <span 
                key={idx}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
              >
                {ing}
                <X 
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setAvailableIngredients(
                    availableIngredients.filter((_, i) => i !== idx)
                  )}
                />
              </span>
            ))}
          </div>
          
          <button
            onClick={findMatchingRecipes}
            disabled={availableIngredients.length === 0}
            className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg font-medium"
          >
            Rezepte finden
          </button>
        </div>
        
        {/* Matching Recipes */}
        <div className="space-y-3">
          {matchingRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-xl p-4">
              <h3 className="font-bold mb-2">{recipe.title}</h3>
              <p className="text-sm text-gray-600">
                ✓ {recipe.ingredients.length} Zutaten
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 🎯 Priorität 4: Performance & Polish

### 4.1 Lazy Loading für Bilder
```typescript
// Bilder erst laden wenn sichtbar
<img 
  src={recipe.image} 
  alt={recipe.title}
  loading="lazy"
  className="w-full h-full object-cover"
/>
```

### 4.2 CSS-Optimierungen für bessere Performance
```css
/* In Tailwind Config oder global.css */

/* Scrolling optimieren */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Smooth Transitions */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Grid Performance */
.recipe-grid {
  contain: layout style paint;
}
```

### 4.3 Offline-Fähigkeit vorbereiten
```typescript
// service-worker.ts erstellen für PWA
// Rezepte im localStorage cachen
const cacheRecipes = () => {
  localStorage.setItem('recipes_cache', JSON.stringify(recipes));
  localStorage.setItem('cache_timestamp', Date.now().toString());
};

const loadCachedRecipes = () => {
  const cached = localStorage.getItem('recipes_cache');
  const timestamp = localStorage.getItem('cache_timestamp');
  
  if (cached && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    // Cache 24h gültig
    if (age < 24 * 60 * 60 * 1000) {
      return JSON.parse(cached);
    }
  }
  return null;
};
```

---

## 📋 Implementierungs-Reihenfolge für Cursor

1. **Sofort (Kritische Fixes):**
   - Kategorien-System vereinfachen und UI fixen
   - Bilder richtig skalieren (3 verschiedene Ansichten)
   - Favoriten-Tab hinzufügen

2. **Phase 2 (Woche 1):**
   - Spracheingabe mit AI implementieren
   - Quick-Filter für Zeit
   - Zutaten zusammenrechnen in Einkaufsliste

3. **Phase 3 (Woche 2):**
   - "Was kann ich kochen?" Feature
   - Performance-Optimierungen
   - Lazy Loading

4. **Optional (später):**
   - Offline-Modus
   - PWA-Features
   - Export/Import

---

## ⚙️ Technische Details für Cursor

### Benötigte Änderungen in bestehenden Dateien:

**recipe_keeper_app.tsx:**
- Zeilen 48-215: Kategorien-Struktur ersetzen
- Zeilen 1200-1350: AddRecipeView Kategorien-UI anpassen
- Zeilen 800-950: HomeView Grid-Layout für Bilder
- Zeilen 1500-1650: DetailView Hero-Bild

**Neue Dateien erstellen:**
- `VoiceRecipeInput.tsx` - Spracheingabe Komponente
- `InventorySearchView.tsx` - "Was kann ich kochen?"
- `ImageUpload.tsx` - Wiederverwendbare Bildupload-Komponente

**utils.ts erweitern:**
- `consolidateShoppingList()` Funktion
- `findRecipesByIngredients()` Funktion

### Dependencies (minimal):
Keine neuen! Nur Web APIs verwenden:
- Web Speech API (nativ)
- Fetch API für Claude (nativ)
- localStorage (nativ)

---

## 🎨 Design-Tokens für Konsistenz

```typescript
// In theme.ts oder direkt in der App
export const THEME = {
  colors: {
    primary: '#F97316', // Orange-500
    primaryHover: '#EA580C', // Orange-600
    secondary: '#DC2626', // Red-600
    accent: '#A855F7', // Purple-500 (für AI Features)
    success: '#10B981', // Green-500
    background: {
      light: '#FFF7ED', // Orange-50
      gradient: 'from-orange-50 to-red-50'
    }
  },
  spacing: {
    cardPadding: 'p-4',
    sectionGap: 'gap-4',
    gridGap: 'gap-3'
  },
  borderRadius: {
    card: 'rounded-xl',
    button: 'rounded-lg',
    pill: 'rounded-full'
  }
};
```

---

## 📱 Responsive Breakpoints

```typescript
// Mobile First - alle Größen in der App
const BREAKPOINTS = {
  sm: '640px',   // Phones
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop (max-width für die App)
};

// Max-width für Container: 4xl = 56rem = 896px
// Perfekt für Tablet/Desktop ohne zu breit zu werden
```

---

## ✅ Testing Checklist für Cursor

Nach jeder Implementierung testen:
- [ ] Mobile Safari (iPhone)
- [ ] Chrome Android
- [ ] Desktop Chrome
- [ ] Bilder laden schnell (<2 Sekunden)
- [ ] Keine horizontalen Scrollbars
- [ ] Touch-Targets mindestens 44x44px
- [ ] Text bricht nicht um wo er nicht soll
- [ ] Kategorien passen in 1-2 Zeilen

---

## 🚀 Performance-Ziele

- **Initial Load:** < 3 Sekunden
- **Time to Interactive:** < 1 Sekunde
- **Bildgröße:** Max 200KB pro Bild (resize bei Upload)
- **Bundle Size:** < 500KB (aktuell messen!)

---

## 💡 Quick Wins (unter 30 Min Implementierung)

1. `loading="lazy"` zu allen Bildern hinzufügen
2. Kategorien auf 8 Hauptkategorien reduzieren
3. Favoriten-Tab in HomeView
4. Grid von 1 auf 2 Spalten (mobile)
5. Image aspect-ratio fixen auf 16:9
