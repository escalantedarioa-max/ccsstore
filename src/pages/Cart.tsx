import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, X, MessageCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useCartStore } from '@/store/useCartStore';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { toast } from 'sonner';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const { data: storeSettings } = useStoreSettings();
  const shopName = storeSettings?.shop_name || 'Catálogo';
  useDocumentHead(`Tu bolsa${items.length > 0 ? ` (${items.length})` : ''} | ${shopName}`);

  const generateWhatsAppMessage = () => {
    if (items.length === 0) return '';

    let message = '¡Hola! Me gustaría realizar el siguiente pedido:\n\n';

    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      if (item.product.sku) {
        message += `   - Código (SKU): ${item.product.sku}\n`;
      }
      const sizeLabel = item.selectedSize.startsWith('mujer-')
        ? `${item.selectedSize.replace('mujer-', '')} (Mujer)`
        : item.selectedSize.startsWith('hombre-')
          ? `${item.selectedSize.replace('hombre-', '')} (Hombre)`
          : item.selectedSize;
      message += `   - Talla: ${sizeLabel}\n`;
      message += `   - Color: ${item.selectedColor}\n`;
      message += `   - Cantidad: ${item.quantity}\n`;
      message += `   - Precio: $${(item.product.price * item.quantity).toFixed(2)}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `TOTAL: $${getTotalPrice().toFixed(2)} USD\n\n`;
    message += `Por favor, confirmen disponibilidad y forma de pago. ¡Gracias!`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppCheckout = () => {
    const phone = storeSettings?.contact_whatsapp?.replace(/\D/g, '');
    if (!phone) {
      toast.error('No hay número de WhatsApp configurado. Configúralo en el panel de administración.');
      return;
    }
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <div className="sticky top-14 md:top-16 z-30 bg-background border-b border-border">
        <div className="flex items-center px-4 md:px-8 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continuar Comprando</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <h1 className="text-xl md:text-2xl font-normal mb-8">Tu Bolsa ({items.length})</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-foreground mb-2">Tu bolsa está vacía</p>
            <p className="text-sm text-muted-foreground mb-6">
              Añade tus artículos favoritos para comenzar
            </p>
            <button
              onClick={() => navigate('/')}
              className="h-12 px-8 bg-foreground text-background text-sm tracking-wider uppercase"
            >
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-6 mb-8">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex gap-4 pb-6 border-b border-border"
                >
                  {/* Image */}
                  <div className="w-24 md:w-32 flex-shrink-0 bg-secondary">
                    <div className="aspect-product">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-normal">{item.product.name}</h3>
                        <button
                          onClick={() =>
                            removeItem(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor
                            )
                          }
                          className="p-1 text-muted-foreground hover:text-foreground"
                          aria-label="Eliminar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.selectedColor} · {item.selectedSize}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor,
                              item.quantity - 1
                            )
                          }
                          className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 h-10 flex items-center justify-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor,
                              item.quantity + 1
                            )
                          }
                          className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm font-normal">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-secondary p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Envío</span>
                <span>A calcular</span>
              </div>
              <div className="border-t border-border pt-4 flex justify-between text-base font-normal">
                <span>Total</span>
                <span>${getTotalPrice().toFixed(2)} USD</span>
              </div>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              onClick={handleWhatsAppCheckout}
              disabled={!storeSettings?.contact_whatsapp?.replace(/\D/g, '')}
              className="w-full h-14 mt-6 bg-[#25D366] text-white text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-5 h-5" />
              Finalizar Pedido por WhatsApp
            </button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              {storeSettings?.contact_whatsapp
                ? 'Serás redirigido a WhatsApp para confirmar tu pedido con nuestro equipo de ventas.'
                : 'Configura un número de WhatsApp en el panel de administración para activar este botón.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
