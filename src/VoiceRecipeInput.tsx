/**
 * IMPROVEMENTS_SPEC 2.1: Rezept per Spracheingabe erfassen.
 * Web Speech API (de-DE) + optional Claude API zum Strukturieren.
 */
import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

const API_KEY_STORAGE = 'anthropic_api_key';

export interface VoiceRecipeData {
  title: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: Array<{ amount: string; unit: string; name: string }>;
  steps: string[];
  category?: string;
  tags?: string[];
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

function parseTranscriptLocally(transcript: string): VoiceRecipeData {
  const lines = transcript
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines[0] || 'Rezept';
  const ingredients: Array<{ amount: string; unit: string; name: string }> = [];
  const steps: string[] = [];
  let phase: 'ingredients' | 'steps' | 'none' = 'none';
  const lower = transcript.toLowerCase();

  if (lower.includes('zutat') || lower.includes('zutaten')) phase = 'ingredients';
  if (lower.includes('zubereitung') || lower.includes('schritte') || lower.includes('anleitung')) phase = 'steps';

  // Einfache Mengen-Zeile: "200 g Mehl", "2 EL Öl", "1 Prise Salz"
  const amountUnitName = /^(\d+[\d.,\/]*)\s*(\s*(?:g|kg|ml|l|el|tl|prise|stück|stk|bund|zehe|scheibe|dose|glas|tasse)\s*)?(.+)$/i;
  for (const line of lines.slice(1)) {
    const t = line.trim();
    if (!t) continue;
    if (/^(zutaten?|zubereitung|schritte?|anleitung)/i.test(t)) {
      if (/zutat/i.test(t)) phase = 'ingredients';
      else phase = 'steps';
      continue;
    }
    const match = t.match(amountUnitName);
    if (phase === 'ingredients' && match) {
      ingredients.push({
        amount: match[1].trim(),
        unit: (match[2] || '').trim() || '',
        name: (match[3] || t).trim()
      });
    } else if (phase === 'steps' || (phase === 'none' && ingredients.length === 0 && steps.length > 0)) {
      const stepText = t.replace(/^\d+[.)]\s*/, '').trim();
      if (stepText) steps.push(stepText);
    } else if (phase === 'none' && ingredients.length === 0 && /^\d+[.)]/.test(t)) {
      steps.push(t.replace(/^\d+[.)]\s*/, '').trim());
    }
  }

  if (steps.length === 0 && lines.length > 1) {
    const rest = lines.slice(1).join(' ').split(/(?=[\d.]+\s)/);
    rest.forEach((s) => {
      const t = s.replace(/^\d+[.)]\s*/, '').trim();
      if (t) steps.push(t);
    });
  }
  if (steps.length === 0 && lines.length > 1) steps.push(lines.slice(1).join(' '));

  return {
    title,
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    ingredients: ingredients.length > 0 ? ingredients : [{ amount: '', unit: '', name: transcript.slice(0, 200) || 'Zutat' }],
    steps: steps.length > 0 ? steps : [transcript || 'Schritt 1'],
    tags: []
  };
}

function normalizeApiRecipe(raw: Record<string, unknown>): VoiceRecipeData {
  const arr = (raw.ingredients as Array<{ amount?: string; unit?: string; name?: string }>) || [];
  const ingredients = arr.map((ing) => ({
    amount: String(ing?.amount ?? '').trim(),
    unit: String(ing?.unit ?? '').trim(),
    name: String(ing?.name ?? '').trim()
  })).filter((i) => i.name);
  const instructions = (raw.instructions as string[]) || (raw.steps as string[]) || [];
  const steps = instructions.map((s) => String(s).trim()).filter(Boolean);
  return {
    title: String(raw.title ?? 'Rezept').trim(),
    servings: Math.max(1, parseInt(String(raw.servings ?? 4), 10) || 4),
    prepTime: parseInt(String(raw.prepTime ?? 0), 10) || 0,
    cookTime: parseInt(String(raw.cookTime ?? 0), 10) || 0,
    ingredients: ingredients.length ? ingredients : [{ amount: '', unit: '', name: '' }],
    steps: steps.length ? steps : [''],
    category: raw.category ? String(raw.category).trim() : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]).map(String) : []
  };
}

interface VoiceRecipeInputProps {
  onRecipeCreated: (recipe: VoiceRecipeData) => void;
  onClose?: () => void;
}

const VoiceRecipeInput: React.FC<VoiceRecipeInputProps> = ({ onRecipeCreated, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE) || '' : '');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt (Chrome/Safari/Edge).');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + ' ';
      }
      setTranscript(full.trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const saveApiKey = (value: string) => {
    setApiKey(value);
    if (typeof window !== 'undefined') {
      if (value) localStorage.setItem(API_KEY_STORAGE, value);
      else localStorage.removeItem(API_KEY_STORAGE);
    }
  };

  const processWithAI = useCallback(async () => {
    const key = apiKey.trim() || (typeof window !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE) : null);
    setIsProcessing(true);
    try {
      if (key) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: `Extrahiere aus diesem diktierten Text ein strukturiertes Rezept.

Text: "${transcript}"

Antworte NUR mit einem JSON-Objekt (kein Markdown, kein Text davor/danach):
{
  "title": "Rezeptname",
  "prepTime": Zahl Minuten,
  "cookTime": Zahl Minuten,
  "servings": Zahl Portionen,
  "ingredients": [
    {"amount": "Menge", "unit": "Einheit", "name": "Zutat"}
  ],
  "instructions": ["Schritt 1", "Schritt 2"],
  "category": "Kategorie",
  "tags": ["Tag1", "Tag2"]
}`
            }]
          })
        });
        if (!response.ok) {
          const err = await response.text();
          throw new Error(err || response.statusText);
        }
        const data = await response.json();
        const text = data.content?.[0]?.text ?? '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
          onRecipeCreated(normalizeApiRecipe(parsed));
          setTranscript('');
          onClose?.();
          return;
        }
      }
      const local = parseTranscriptLocally(transcript);
      onRecipeCreated(local);
      setTranscript('');
      onClose?.();
    } catch (err) {
      console.error('AI-Verarbeitung fehlgeschlagen:', err);
      const local = parseTranscriptLocally(transcript);
      onRecipeCreated(local);
      setTranscript('');
      onClose?.();
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, apiKey, onRecipeCreated, onClose]);

  const useLocalOnly = useCallback(() => {
    setIsProcessing(true);
    try {
      const local = parseTranscriptLocally(transcript);
      onRecipeCreated(local);
      setTranscript('');
      onClose?.();
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, onRecipeCreated, onClose]);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-4 sm:p-6 border-2 border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Rezept diktieren</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 text-gray-600 dark:text-gray-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Schließen"
          >
            ×
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Sage z.B.: &quot;Spaghetti Carbonara. Für 4 Personen. 25 Minuten. Zutaten: 400 Gramm Spaghetti, 200 Gramm Pancetta, 4 Eier...&quot;
      </p>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API-Schlüssel (optional, für bessere Strukturierung)</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => saveApiKey(e.target.value)}
          placeholder="Anthropic API-Key"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`w-full py-5 rounded-xl font-bold text-lg transition flex items-center justify-center gap-3 min-h-[56px] ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700'
        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
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

      {transcript && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Aufgenommen:</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-40 overflow-y-auto">{transcript}</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={processWithAI}
              disabled={isProcessing}
              className="flex-1 min-w-[140px] bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-60"
            >
              {isProcessing ? 'Verarbeite...' : '✨ Mit AI strukturieren'}
            </button>
            <button
              type="button"
              onClick={useLocalOnly}
              disabled={isProcessing}
              className="flex-1 min-w-[140px] bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition disabled:opacity-60"
            >
              Ohne AI übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecipeInput;
