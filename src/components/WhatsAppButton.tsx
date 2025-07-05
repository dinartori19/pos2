
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const WhatsAppButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  const handleWhatsAppClick = () => {
    const phoneNumber = '6281234567890'; // Replace with your WhatsApp number
    const message = encodeURIComponent(
      `Hi! Saya tertarik dengan produk di Injapan Food. Bisa bantu saya?`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded && (
        <div className="mb-4 bg-white rounded-lg shadow-lg p-4 max-w-xs animate-fade-in">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800">
              {t('whatsapp.title')}
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {t('whatsapp.message')}
          </p>
          <button
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
          >
            {t('whatsapp.startChat')}
          </button>
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
        aria-label="WhatsApp Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

export default WhatsAppButton;
