import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageCircle, Minus, Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductImageCarousel } from '@/components/catalog/ProductImageCarousel';
import { useCartStore } from '@/store/useCartStore';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { trackEvent } from '@/hooks/useAnalytics';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

const ProductDetail = () => {
  const params = useParams();
  const id = params.id; 
  
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { data: storeSettings } = useStoreSettings();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const shareWhatsAppUrl = product
    ? `https://wa.me/?text=${encodeURIComponent(`${product.name}${product.sku ? ` (REF: ${product.sku})` : ''} – ${window.location.href}`)}`
    : '#';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        if (!id) {
          console.error("No se encontró ID en los parámetros de la ruta");
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error("Error de Supabase:", error.message);
          throw error;
        }

        setProduct(data);
        if (data?.sizes?.length > 0) setSelectedSize(data.sizes[0]);
        if (data?.colors?.length > 0) setSelectedColor(data.colors[0]);
        setQuantity(1);
      } catch (error) {
        console.error('Error general:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Registrar vista de producto (analytics)
  useEffect(() => {
    if (product?.id) trackEvent('product_view', product.id);
  }, [product?.id]);

  const shopName = storeSettings?.shop_name || 'Catálogo';
  useDocumentHead(
    product ? `${product.name} | ${shopName}` : shopName,
    product
      ? {
          description: product.description || `${product.name} – $${Number(product.price).toFixed(2)}`,
          image: product.images?.[0],
        }
      : undefined
  );

  // Precio en Bs solo si hay tasa BCV configurada
  const hasBcvRate = storeSettings?.bcv_rate != null && Number(storeSettings.bcv_rate) > 0;
  const localPrice = product && hasBcvRate && storeSettings
    ? (Number(product.price) * Number(storeSettings.bcv_rate)).toFixed(2)
    : null;

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <p className="text-lg mb-4">Producto no encontrado</p>
          <button onClick={() => navigate('/')} className="underline">Volver al catálogo</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Volver + Título (nombre en mayúsculas) */}
          <div className="px-4 md:px-8 pt-4 pb-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <h1 className="text-xl md:text-2xl font-semibold uppercase mt-2 tracking-wide">
              {product.name}
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-0 md:gap-8">
            {/* Columna izquierda: imagen + compartir + precios + SKU (juntos en alto) */}
            <div className="md:sticky md:top-20 md:self-start space-y-3">
              <ProductImageCarousel 
                images={product.images || []} 
                productName={product.name} 
              />
              {/* Debajo de la imagen, a la derecha: Comparte por WhatsApp */}
              <div className="flex items-center justify-end gap-2 px-4 md:px-0">
                <a
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Comparte este producto por WhatsApp</span>
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </a>
              </div>
              {/* Precio USD, Bs, SKU (todo más junto) */}
              <div className="px-4 md:px-0 space-y-0.5">
                <p className="text-2xl font-semibold">${Number(product.price).toFixed(2)} USD</p>
                {localPrice && storeSettings && (
                  <p className="text-sm text-muted-foreground">
                    Bs. {localPrice} <span className="text-xs">(Tasa: {storeSettings.bcv_rate})</span>
                  </p>
                )}
                {product.sku && (
                  <p className="text-xs text-muted-foreground font-mono pt-1">REF: {product.sku}</p>
                )}
              </div>
            </div>

            {/* Columna derecha: cantidad, stock, talla, colores, botón, descripción */}
            <div className="p-4 md:p-8 space-y-5">

              {/* Cantidad */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Cantidad</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 border border-border flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock ?? q, q + 1))}
                    className="w-10 h-10 border border-border flex items-center justify-center hover:bg-muted/50 transition-colors disabled:opacity-50"
                    disabled={product.stock != null && quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stock */}
              {product.stock !== undefined && (
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                  </span>
                </div>
              )}

              {/* Talla (solo si se cargó en admin); calzado: agrupado Mujer / Hombre */}
              {product.sizes && product.sizes.length > 0 && (() => {
                const mujer: string[] = [];
                const hombre: string[] = [];
                const other: string[] = [];
                for (const s of product.sizes) {
                  if (s.startsWith('mujer-')) mujer.push(s);
                  else if (s.startsWith('hombre-')) hombre.push(s);
                  else other.push(s);
                }
                const hasShoeGroups = mujer.length > 0 || hombre.length > 0;
                const sizeLabel = (key: string) => key.replace(/^(mujer|hombre)-/, '');
                const isShoeSize = (key: string) => sizeLabel(key).includes('.');
                const mujerSuffix = mujer.length > 0 && mujer.some(isShoeSize) ? ' (US)' : ' (cintura)';
                const hombreSuffix = hombre.length > 0 && hombre.some(isShoeSize) ? ' (US)' : ' (cintura)';
                return (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Talla</p>
                    {hasShoeGroups ? (
                      <div className="space-y-3">
                        {mujer.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Mujer{mujerSuffix}</p>
                            <div className="flex flex-wrap gap-2">
                              {mujer.map((key) => (
                                <button
                                  key={key}
                                  onClick={() => setSelectedSize(key)}
                                  className={`px-4 py-2 border text-sm transition-colors ${
                                    selectedSize === key
                                      ? 'border-foreground bg-foreground text-background'
                                      : 'border-border hover:border-foreground'
                                  }`}
                                >
                                  {sizeLabel(key)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {hombre.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">Hombre{hombreSuffix}</p>
                            <div className="flex flex-wrap gap-2">
                              {hombre.map((key) => (
                                <button
                                  key={key}
                                  onClick={() => setSelectedSize(key)}
                                  className={`px-4 py-2 border text-sm transition-colors ${
                                    selectedSize === key
                                      ? 'border-foreground bg-foreground text-background'
                                      : 'border-border hover:border-foreground'
                                  }`}
                                >
                                  {sizeLabel(key)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {other.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {other.map((size) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-2 border text-sm transition-colors ${
                                  selectedSize === size
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border hover:border-foreground'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size: string) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 border text-sm transition-colors ${
                              selectedSize === size
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border hover:border-foreground'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Color (solo si se cargó en admin; debajo de talla) */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border text-sm transition-colors ${
                          selectedColor === color
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border hover:border-foreground'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón agregar al carrito */}
              <button 
                onClick={() => {
                  if (product.stock <= 0) {
                    toast.error('Producto agotado');
                    return;
                  }
                  trackEvent('add_to_cart_click', product.id);
                  addItem({ 
                    product, 
                    quantity, 
                    selectedSize: selectedSize || 'Único', 
                    selectedColor: selectedColor || product.colors?.[0] || 'Único' 
                  });
                  toast.success("Agregado al carrito");
                }}
                disabled={product.stock <= 0}
                className="w-full py-4 bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
              </button>

              {/* Descripción (solo si se cargó en admin) */}
              {product.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Descripción</p>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.materials && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-1">Materiales</p>
                  <p className="text-sm text-muted-foreground">{product.materials}</p>
                </div>
              )}

              {storeSettings?.contact_whatsapp && (
                <a
                  href={`https://wa.me/${storeSettings.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hola, me interesa este artículo:\n${product.name}${product.sku ? ` (REF: ${product.sku})` : ''}\n${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 mt-2 border border-border flex items-center justify-center gap-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
