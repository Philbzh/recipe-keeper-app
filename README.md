# 🍳 Recipe Keeper App

Eine intuitive Progressive Web App (PWA) für die Verwaltung von Kochrezepten mit integrierter Einkaufsliste, Wochenplaner und Barcode-Scanner.

## ✨ Features

- 📝 **Rezeptverwaltung**: Erstelle, bearbeite und organisiere deine Rezepte
- 🛒 **Einkaufsliste**: Automatisches Hinzufügen von Zutaten aus Rezepten
- 📅 **Wochenplaner**: Plane deine Mahlzeiten für die ganze Woche
- 📷 **Barcode-Scanner**: Scanne Produkte mit OpenFoodFacts API
- 🔍 **Erweiterte Suche**: Filtere nach Kategorie, Zeit, Schwierigkeit, Tags
- ⭐ **Favoriten**: Markiere deine Lieblingsrezepte
- 🏷️ **Tags**: Organisiere Rezepte mit Tags (Vegetarisch, Vegan, Schnell, etc.)
- 📱 **Responsive Design**: Funktioniert auf Desktop, Tablet und Smartphone
- ☁️ **Cloud-Sync**: Synchronisiere deine Daten mit Supabase

## 🚀 Installation

### Voraussetzungen

- Node.js 18+ und npm
- Supabase Account (optional, für Cloud-Sync)

### Lokale Installation

1. Repository klonen:
```bash
git clone https://github.com/Philbzh/recipe-keeper-app.git
cd recipe-keeper-app
```

2. Dependencies installieren:
```bash
npm install
```

3. Environment-Variablen einrichten:
```bash
cp .env.example .env
```

Bearbeite `.env` und füge deine Supabase-Credentials ein:
```
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_ANON_KEY=dein_supabase_anon_key
```

4. Entwicklungsserver starten:
```bash
npm run dev
```

Die App läuft jetzt auf `http://localhost:5173`

## 📦 Build für Production

```bash
npm run build
```

Die gebauten Dateien befinden sich im `dist/` Ordner.

## 🏗️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Supabase** - Backend & Authentication
- **Lucide React** - Icons
- **OpenFoodFacts API** - Produktdaten

## 📁 Projektstruktur

```
src/
├── components/          # React Komponenten
│   └── shopping/        # Einkaufsliste Komponenten
├── services/            # API Services
│   └── openFoodFactsService.ts
├── types.ts             # TypeScript Interfaces
├── utils.ts             # Utility Functions
├── dataService.ts       # Supabase Data Service
├── recipe_keeper_app.tsx # Hauptkomponente
└── main.tsx            # Entry Point
```

## 🔧 Konfiguration

### Supabase Setup

1. Erstelle ein Supabase Projekt auf [supabase.com](https://supabase.com)
2. Führe das SQL-Script aus `supabase/create_kv_table.sql` im SQL Editor aus
3. Setze die Row-Level Security (RLS) Policies (siehe `NEXT_STEPS.md`)

### Environment Variables

Erstelle eine `.env` Datei mit folgenden Variablen:

```env
VITE_SUPABASE_URL=deine_supabase_url
VITE_SUPABASE_ANON_KEY=dein_supabase_anon_key
```

## 📚 Dokumentation

- `HOW_TO_START.md` - Anleitung zum Starten der App
- `NEXT_STEPS.md` - Supabase Setup-Anleitung
- `SUPABASE_DEPLOY.md` - Deployment auf Supabase Hosting
- `BARCODE_SCANNER_IMPLEMENTATION.md` - Barcode-Scanner Dokumentation
- `ARCHITECTURE_PROPOSAL.md` - Architektur-Übersicht

## 🎯 Kategorien-Struktur

Die App verwendet eine detaillierte hierarchische Kategorien-Struktur mit 16 Hauptkategorien:

- Vorspeisen 🥗
- Hauptspeisen 🍖
- Beilagen 🥔
- Kuchen & Torten 🎂
- Tartes & Pies 🥧
- Gebäck & Kleinigkeiten 🥐
- Kekse & Konfekt 🍪
- Hefegebäck & Brioche 🥖
- Waffeln & Pancakes 🧇
- Cremes & Desserts 🍮
- Eis & Gefrorenes 🍨
- Brot & Brötchen 🍞
- Gewürze & Mischungen 🌶️
- Grundrezepte & Basics 📋
- Frühstück & Brunch 🍳
- Snacks 🍿
- Getränke ☕
- Saucen & Condiments 🥫

## 🚢 Deployment

### Vercel

1. Verbinde dein GitHub Repository mit Vercel
2. Füge Environment Variables in Vercel hinzu:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

### Supabase Hosting

Siehe `SUPABASE_DEPLOY.md` für detaillierte Anleitung.

## 📝 License

MIT License

## 🙏 Credits

- Icons: [Lucide React](https://lucide.dev/)
- Produktdaten: [OpenFoodFacts](https://world.openfoodfacts.org/)
- Backend: [Supabase](https://supabase.com/)
