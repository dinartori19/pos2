import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { ProductVariant } from '@/types';

interface ProductVariantDisplayProps {
  variants: ProductVariant[];
  selectedVariant?: ProductVariant | null;
  onVariantSelect?: (variant: ProductVariant) => void;
  showPrice?: boolean;
}

const ProductVariantDisplay = ({ 
  variants, 
  selectedVariant, 
  onVariantSelect, 
  showPrice = true 
}: ProductVariantDisplayProps) => {
  const { t } = useLanguage();
  
  // Only show variants that actually exist for this product
  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">{t('productDetail.selectVariant')}:</h4>
      <div className="space-y-3">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const isOutOfStock = variant.stock === 0;
          
          return (
            <div
              key={variant.id}
              className={`
                flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all
                ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
                ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => {
                if (!isOutOfStock && onVariantSelect) {
                  onVariantSelect(variant);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'}
                `}>
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{variant.name}</div>
                  {isOutOfStock && (
                    <div className="text-sm text-red-500">Stok habis</div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                {showPrice && (
                  <div className="font-bold text-lg">
                    ¥{variant.price.toLocaleString()}
                  </div>
                )}
                {!isOutOfStock && (
                  <div className="text-sm text-gray-500">
                    Stok: {variant.stock}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedVariant && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-900">{t('productDetail.variantSelected')}: </span>
              <span className="text-gray-700">{selectedVariant.name}</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-600">
                ¥{selectedVariant.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {t('products.stock')}: {selectedVariant.stock} {t('productDetail.available')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantDisplay;