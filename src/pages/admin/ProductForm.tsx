import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCategories } from '@/hooks/useCategories';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU requerido').max(50, 'SKU muy largo'),
  name: z.string().min(1, 'Nombre requerido').max(200),
  price: z.number().min(0.01, 'Precio debe ser mayor a 0'),
  description: z.string().max(2000).optional(),
  category: z.string().min(1, 'Categoría requerida'),
  materials: z.string().max(500).optional(),
});

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES_WOMEN_US = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'];
const SHOE_SIZES_MEN_US = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'];
const PANT_SIZES = ['26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38'];
const SUGGESTED_COLORS = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Marrón', 'Nude', 'Rosa', 'Amarillo', 'Multicolor'];

function isShoeCategory(categorySlug: string, categories: { slug: string; name: string }[]): boolean {
  const cat = categories?.find((c) => c.slug === categorySlug);
  if (!cat) return false;
  const t = `${cat.slug} ${cat.name}`.toLowerCase();
  return /zapato|calzado|shoe/i.test(t);
}

function isPantCategory(categorySlug: string, categories: { slug: string; name: string }[]): boolean {
  const cat = categories?.find((c) => c.slug === categorySlug);
  if (!cat) return false;
  const t = `${cat.slug} ${cat.name}`.toLowerCase();
  return /pantalon|pantalones|pants|jeans/i.test(t);
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = id && id !== 'new';
  const navigate = useNavigate();

  const { data: existingProduct, isLoading: loadingProduct } = useProduct(id || '');
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [materials, setMaterials] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [stock, setStock] = useState('0');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing product data (calzado: normalizar tallas antiguas a "mujer-X" para compatibilidad)
  useEffect(() => {
    if (existingProduct) {
      setSku(existingProduct.sku || '');
      setName(existingProduct.name);
      setPrice(existingProduct.price.toString());
      setDescription(existingProduct.description || '');
      setCategory(existingProduct.category);
      setMaterials(existingProduct.materials || '');
      const rawSizes = existingProduct.sizes;
      const normalized = rawSizes.map((s) => {
        if (s.startsWith('mujer-') || s.startsWith('hombre-')) return s;
        if (/^\d+(\.5)?$/.test(s)) return `mujer-${s}`;
        return s;
      });
      setSelectedSizes(normalized);
      setSelectedColors(existingProduct.colors);
      setIsNew(existingProduct.is_new);
      setIsPremium(existingProduct.is_premium);
      setStock(existingProduct.stock?.toString() || '0');
      setImages(existingProduct.images);
    }
  }, [existingProduct]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const addCustomColor = () => {
    const value = customColorInput.trim();
    if (value && !selectedColors.includes(value)) {
      setSelectedColors((prev) => [...prev, value]);
      setCustomColorInput('');
    }
  };

  const removeColor = (color: string) => {
    setSelectedColors((prev) => prev.filter((c) => c !== color));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Require SKU before uploading images
    if (!sku.trim()) {
      toast.error('Ingresa el SKU antes de subir imágenes');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        // Use SKU + timestamp for unique filename
        const fileName = `${sku.trim()}_${timestamp}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        setImages((prev) => [...prev, publicUrl]);
      }
      toast.success('Imagen(es) subida(s)');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setErrors({});

    const result = productSchema.safeParse({
      sku,
      name,
      price: parseFloat(price) || 0,
      description,
      category,
      materials,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const stockValue = parseInt(stock) || 0;
    const productData = {
      sku,
      name,
      price: parseFloat(price),
      description,
      category,
      materials,
      sizes: selectedSizes,
      colors: selectedColors,
      is_new: isNew,
      is_premium: isPremium,
      stock: stockValue,
      is_in_stock: stockValue > 0,
      images,
    };

    if (isEditing && id) {
      updateProduct.mutate({ id, ...productData }, {
        onSuccess: () => navigate('/admin/products'),
      });
    } else {
      createProduct.mutate(productData, {
        onSuccess: () => navigate('/admin/products'),
      });
    }
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  // Set default category when categories load and no category selected
  useEffect(() => {
    if (categories?.length && !category && !isEditing) {
      setCategory(categories[0].slug);
    }
  }, [categories, category, isEditing]);

  if ((isEditing && loadingProduct) || loadingCategories) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Skeleton className="h-10 w-32 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {/* Images */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label>Imágenes</Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-[2/3] bg-muted rounded overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className="aspect-[2/3] border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / ID del Artículo *</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Ej: SUD-001"
                className="font-mono"
              />
              {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
              <p className="text-xs text-muted-foreground">
                Código único para identificar el producto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Blazer Lino Premium"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio (USD) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="49.99"
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el producto..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock / Cantidad</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Materiales</Label>
              <Input
                id="materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Ej: 100% Algodón Orgánico"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tallas: ropa (XS–XXL) o calzado mujer/hombre (US) según categoría */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Talla</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {categories && isShoeCategory(category, categories)
                  ? 'Calzado: elige tallas mujer y/o hombre (US). Si no aplica, deja sin seleccionar.'
                  : categories && isPantCategory(category, categories)
                    ? 'Pantalones: elige tallas mujer y/o hombre (cintura). Si no aplica, deja sin seleccionar.'
                    : 'Ropa: tallas estándar. Si no aplica (talla única), deja sin seleccionar.'}
              </p>
            </div>
            {(() => {
              const isShoe = categories && isShoeCategory(category, categories);
              const isPant = categories && isPantCategory(category, categories);
              const toggleMujerHombreSize = (prefix: 'mujer' | 'hombre', size: string) => {
                const key = `${prefix}-${size}`;
                setSelectedSizes((prev) =>
                  prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
                );
              };
              const extraMujerHombre = (validSizes: string[]) =>
                selectedSizes.filter(
                  (s) =>
                    !s.startsWith('mujer-') &&
                    !s.startsWith('hombre-') &&
                    !validSizes.includes(s)
                );

              if (isShoe) {
                const extra = extraMujerHombre([...SHOE_SIZES_WOMEN_US, ...SHOE_SIZES_MEN_US]);
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tallas mujer (US)</p>
                      <div className="flex flex-wrap gap-2">
                        {SHOE_SIZES_WOMEN_US.map((size) => {
                          const key = `mujer-${size}`;
                          return (
                            <Button
                              key={key}
                              type="button"
                              variant={selectedSizes.includes(key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleMujerHombreSize('mujer', size)}
                            >
                              {size}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tallas hombre (US)</p>
                      <div className="flex flex-wrap gap-2">
                        {SHOE_SIZES_MEN_US.map((size) => {
                          const key = `hombre-${size}`;
                          return (
                            <Button
                              key={key}
                              type="button"
                              variant={selectedSizes.includes(key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleMujerHombreSize('hombre', size)}
                            >
                              {size}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    {extra.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-muted-foreground">Otras (guardadas):</span>
                        {extra.map((s) => (
                          <Button
                            key={s}
                            type="button"
                            variant={selectedSizes.includes(s) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSize(s)}
                          >
                            {s.replace(/^(mujer|hombre)-/, '')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (isPant) {
                const extra = extraMujerHombre(PANT_SIZES);
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tallas mujer (cintura)</p>
                      <div className="flex flex-wrap gap-2">
                        {PANT_SIZES.map((size) => {
                          const key = `mujer-${size}`;
                          return (
                            <Button
                              key={key}
                              type="button"
                              variant={selectedSizes.includes(key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleMujerHombreSize('mujer', size)}
                            >
                              {size}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tallas hombre (cintura)</p>
                      <div className="flex flex-wrap gap-2">
                        {PANT_SIZES.map((size) => {
                          const key = `hombre-${size}`;
                          return (
                            <Button
                              key={key}
                              type="button"
                              variant={selectedSizes.includes(key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleMujerHombreSize('hombre', size)}
                            >
                              {size}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    {extra.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-muted-foreground">Otras (guardadas):</span>
                        {extra.map((s) => (
                          <Button
                            key={s}
                            type="button"
                            variant={selectedSizes.includes(s) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSize(s)}
                          >
                            {s.replace(/^(mujer|hombre)-/, '')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              const extraSelected = selectedSizes.filter((s) => !CLOTHING_SIZES.includes(s));
              const sizesToShow = [...CLOTHING_SIZES, ...extraSelected];
              return (
                <div className="flex flex-wrap gap-2">
                  {sizesToShow.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Colores: sugeridos + escribir uno propio */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label>Color</Label>
            <p className="text-xs text-muted-foreground">
              Elige de la lista o escribe un color que no esté. Si no aplica, deja sin seleccionar.
            </p>
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedColors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeColor(c)}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      aria-label={`Quitar ${c}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUGGESTED_COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  variant={selectedColors.includes(color) ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                  onClick={() => toggleColor(color)}
                >
                  {color}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Escribe un color (ej. Turquesa)"
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addCustomColor}>
                Añadir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label>Etiquetas</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Marcar como "Nuevo"</span>
              <Switch checked={isNew} onCheckedChange={setIsNew} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Premium Selection</span>
              <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}