import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { OpenFoodFactsService, ProductData } from '../../services/openFoodFactsService';
import { ShoppingItem } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (item: ShoppingItem) => void;
  generateId: () => string;
  categorizeShoppingItem: (text: string) => string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  generateId,
  categorizeShoppingItem
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBarcodeInput('');
      setProduct(null);
      setError(null);
      setIsLoading(false);
      setCustomQuantity('');
    }
  }, [isOpen]);

  const handleSearch = async () => {
    const barcode = barcodeInput.trim();
    if (!barcode) {
      setError('Bitte gib einen Barcode ein');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProduct(null);
    setCustomQuantity(''); // Reset custom quantity when searching

    try {
      const productData = await OpenFoodFactsService.getProductByBarcode(barcode);
      
      if (productData) {
        setProduct(productData);
        // Initialize customQuantity with product quantity if available
        setCustomQuantity(productData.quantity || '');
      } else {
        setError('Produkt nicht gefunden. Bitte überprüfe den Barcode oder gib das Produkt manuell ein.');
      }
    } catch (err) {
      setError('Fehler beim Abrufen der Produktdaten. Bitte versuche es erneut.');
      console.error('Error fetching product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToShoppingList = () => {
    if (!product) return;

    // Convert ProductData to ShoppingItem with detailed information
    const parts: string[] = [];
    
    // Marke hinzufügen (wenn vorhanden und nicht bereits im Namen enthalten)
    if (product.brand && 
        product.brand.trim() !== '' && 
        !product.name.toLowerCase().includes(product.brand.toLowerCase()) &&
        product.brand.toLowerCase() !== product.name.toLowerCase()) {
      parts.push(product.brand);
    }
    
    // Produktname hinzufügen
    parts.push(product.name);
    
    // Menge/Größe hinzufügen (wenn vorhanden oder manuell eingegeben)
    const quantity = customQuantity.trim() || product.quantity;
    if (quantity && quantity.trim() !== '') {
      parts.push(`(${quantity})`);
    }
    
    // Verpackung hinzufügen (wenn vorhanden und informativ)
    if (product.packaging && 
        product.packaging.trim() !== '' && 
        product.packaging.length > 0 && 
        product.packaging.length < 30) {
      parts.push(`[${product.packaging}]`);
    }
    
    // Falls nur Name vorhanden, versuche Menge aus Name zu extrahieren
    if (parts.length === 1 && !product.quantity) {
      const quantityMatch = product.name.match(/\b(\d+[\.,]?\d*\s*(ml|cl|l|g|kg|mg|stk|stück|st|pcs?|x))\b/i);
      if (quantityMatch) {
        parts.push(`(${quantityMatch[1]})`);
      }
    }
    
    // Text zusammenfügen
    const text = parts.join(' ').trim();

    const shoppingItem: ShoppingItem = {
      id: generateId(),
      text: text,
      checked: false,
      category: (product.category as any) || categorizeShoppingItem(product.name),
      quantity: product.quantity
    };

    onAddProduct(shoppingItem);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Produkt scannen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Barcode Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Barcode eingeben
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="z.B. 4001234567890"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-lg"
              disabled={isLoading}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !barcodeInput.trim()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Suche...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Suchen
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tipp: Gib den Barcode manuell ein oder nutze die Kamera deines Geräts
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Product Found */}
        {product && (
          <div className="mb-6">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">Produkt gefunden!</p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {product.image && (
                <div className="flex justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-32 w-auto rounded-lg object-contain"
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{product.name}</h3>
                <div className="space-y-1">
                  {product.brand && product.brand.trim() !== '' && product.brand.toLowerCase() !== product.name.toLowerCase() && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Marke:</span> {product.brand}
                    </p>
                  )}
                  {product.quantity && product.quantity.trim() !== '' && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Menge/Größe:</span> {product.quantity}
                    </p>
                  )}
                  {product.packaging && product.packaging.trim() !== '' && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Verpackung:</span> {product.packaging}
                    </p>
                  )}
                  {product.category && product.category !== 'Sonstiges' && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Kategorie:</span> {product.category}
                    </p>
                  )}
                  {product.barcode && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Barcode:</span> {product.barcode}
                    </p>
                  )}
                </div>
                {/* Menge-Eingabe (immer editierbar) */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menge/Größe {product.quantity ? '(bearbeiten)' : '(optional)'}:
                  </label>
                  <input
                    type="text"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    placeholder={product.quantity ? product.quantity : "z.B. 500ml, Medium, 1L"}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-orange-400 focus:outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {product.quantity 
                      ? 'Du kannst die Menge hier ändern oder ergänzen'
                      : 'Falls die API keine Menge liefert, kannst du sie hier manuell eingeben'}
                  </p>
                </div>
                
                {/* Preview: Wie es in der Einkaufsliste erscheinen wird */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs font-medium text-gray-500 mb-1">Wird hinzugefügt als:</p>
                  <p className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    {(() => {
                      const parts: string[] = [];
                      if (product.brand && 
                          product.brand.trim() !== '' && 
                          !product.name.toLowerCase().includes(product.brand.toLowerCase()) &&
                          product.brand.toLowerCase() !== product.name.toLowerCase()) {
                        parts.push(product.brand);
                      }
                      parts.push(product.name);
                      // Verwende customQuantity wenn vorhanden, sonst product.quantity
                      const quantity = customQuantity.trim() || product.quantity;
                      if (quantity && quantity.trim() !== '') {
                        parts.push(`(${quantity})`);
                      } else {
                        // Falls keine Menge vorhanden, versuche aus Name zu extrahieren
                        const quantityMatch = product.name.match(/\b(\d+[\.,]?\d*\s*(ml|cl|l|g|kg|mg|stk|stück|st|pcs?|x))\b/i);
                        if (quantityMatch) {
                          parts.push(`(${quantityMatch[1]})`);
                        }
                      }
                      if (product.packaging && 
                          product.packaging.trim() !== '' && 
                          product.packaging.length > 0 && 
                          product.packaging.length < 30) {
                        parts.push(`[${product.packaging}]`);
                      }
                      return parts.join(' ') || product.name;
                    })()}
                  </p>
                </div>
              </div>

              {product.nutrition && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-2">Nährwerte (pro 100g):</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {product.nutrition.calories && (
                      <div>Kalorien: {product.nutrition.calories} kcal</div>
                    )}
                    {product.nutrition.protein && (
                      <div>Eiweiß: {product.nutrition.protein}g</div>
                    )}
                    {product.nutrition.carbs && (
                      <div>Kohlenhydrate: {product.nutrition.carbs}g</div>
                    )}
                    {product.nutrition.fat && (
                      <div>Fett: {product.nutrition.fat}g</div>
                    )}
                  </div>
                </div>
              )}

              {product.allergens && product.allergens.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Allergene:</p>
                  <p className="text-xs text-gray-700">{product.allergens.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddToShoppingList}
              className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-xl active:scale-95 transition font-bold text-lg shadow-lg"
            >
              ✓ Zur Einkaufsliste hinzufügen
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Daten von <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">OpenFoodFacts</a>
          </p>
        </div>
      </div>
    </div>
  );
};
