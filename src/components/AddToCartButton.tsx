
import { useState, useRef } from 'react';
import { ShoppingCart, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
  onAddToCart?: (position: { x: number; y: number }) => void;
  disabled?: boolean;
}

const AddToCartButton = ({ 
  product, 
  quantity = 1, 
  className = "",
  onAddToCart,
  disabled = false
}: AddToCartButtonProps) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAddToCart = () => {
    if (product.stock === 0 || disabled) {
      toast({
        title: "Stok Habis",
        description: `${product.name} sedang tidak tersedia`,
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Get button position for animation
    if (buttonRef.current && onAddToCart) {
      const rect = buttonRef.current.getBoundingClientRect();
      onAddToCart({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }

    addToCart(product, quantity);
    
    // Show success state
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    // Show toast with cart link
    toast({
      title: "Berhasil ditambahkan!",
      description: `${quantity}x ${product.name} telah ditambahkan ke keranjang`,
      duration: 3000,
      action: (
        <button 
          className="text-primary hover:text-primary/80 font-medium"
          onClick={() => window.location.href = '/cart'}
        >
          Lihat Keranjang
        </button>
      )
    });
  };

  const isOutOfStock = product.stock === 0;

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleAddToCart}
      disabled={isOutOfStock || disabled}
      className={`
        ${className}
        ${isOutOfStock 
          ? 'bg-gray-400 text-white cursor-not-allowed' 
          : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-xl'
        } 
        transition-all duration-300 ease-in-out relative overflow-hidden rounded-lg font-semibold
        flex items-center justify-center space-x-2 group
      `}
      whileHover={!isOutOfStock ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
      animate={isAdded ? {
        backgroundColor: "#16a34a",
        transition: { duration: 0.3 }
      } : {}}
    >
      {/* Background ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={isAdded ? { scale: 1.5, opacity: [0, 0.3, 0] } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
      
      <motion.div
        className="flex items-center space-x-2 relative z-10"
        animate={isAdded ? { x: 0 } : { x: 0 }}
      >
        {/* Enhanced cart icon with plus indicator - larger logo, smaller plus */}
        <motion.div
          className="relative"
          animate={isAdded ? { rotate: 360, scale: [1, 1.3, 1] } : { rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {isAdded ? (
            <Check className="w-5 h-5" />
          ) : (
            <div className="relative">
              <ShoppingCart className="w-5 h-5 group-hover:animate-bounce" />
              {!isOutOfStock && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Plus className="w-0.5 h-0.5 text-red-600" strokeWidth={4} />
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
        
        <motion.span
          className="font-semibold"
          animate={isAdded ? { 
            color: "#ffffff",
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ duration: 0.3 }}
        >
          {isOutOfStock ? 'Stok Habis' : isAdded ? '✓ Ditambahkan' : 'Tambah ke Keranjang'}
        </motion.span>
      </motion.div>

      {/* Shine effect on hover */}
      {!isOutOfStock && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
};

export default AddToCartButton;
