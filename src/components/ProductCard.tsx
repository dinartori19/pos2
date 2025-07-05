import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { formatPrice } from '@/utils/cart';
import { useLanguage } from '@/hooks/useLanguage';
import AddToCartButton from '@/components/AddToCartButton';
import { Badge } from '@/components/ui/badge';
import { getCategoryIcon } from '@/utils/categoryVariants';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, position: { x: number; y: number }) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const handleAddToCart = (position: { x: number; y: number }) => {
    if (onAddToCart) {
      onAddToCart(product, position);
    }
  };

  return (
    <div ref={cardRef} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] h-full flex flex-col w-full">
      <Link to={`/products/${product.id}`} className="block flex-1">
        <div className="relative overflow-hidden rounded-t-xl mb-3 sm:mb-4">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge className="flex items-center space-x-1">
              <span>{getCategoryIcon(product.category)}</span>
              <span>{product.category}</span>
            </Badge>
          </div>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Habis
              </span>
            </div>
          )}
        </div>

        <div className="px-3 sm:px-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base mb-2 line-clamp-2 leading-tight">
            {product.name}
          </h3>
          <p className="text-gray-600 text-xs mb-2 sm:mb-3 line-clamp-2 flex-1 leading-relaxed">
            {product.description}
          </p>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="text-base sm:text-lg md:text-xl font-bold text-red-600">
              {formatPrice(product.price)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ${
                product.stock > 10 
                  ? 'bg-green-100 text-green-700' 
                  : product.stock > 0 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}>
                {product.stock > 0 ? `${t('products.stock')}: ${product.stock}` : t('products.outOfStock')}
              </span>
              
              {product.variants && product.variants.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {product.variants.length} Varian
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Add to Cart Button */}
      <div className="p-3 sm:p-4 pt-0" onClick={(e) => e.stopPropagation()}>
        <AddToCartButton
          product={product}
          className={`w-full py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
            product.stock === 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-[1.02]'
          }`}
          onAddToCart={handleAddToCart}
          disabled={product.stock === 0}
        />
      </div>
    </div>
  );
};

export default ProductCard;