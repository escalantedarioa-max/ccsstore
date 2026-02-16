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

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Marrón'];

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
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [stock, setStock] = useState('0');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing product data
  useEffect(() => {
    if (existingProduct) {
      setSku(existingProduct.sku || '');
      setName(existingProduct.name);
      setPrice(existingProduct.price.toString());
      setDescription(existingProduct.description || '');
      setCategory(existingProduct.category);
      setMaterials(existingProduct.materials || '');
      setSelectedSizes(existingProduct.sizes);
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

        {/* Sizes */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label>Tallas Disponibles</Label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
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
          </CardContent>
        </Card>

        {/* Colors - lista seleccionable tipo app */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label>Colores</Label>
            <div className="border border-border rounded-md divide-y divide-border">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                    selectedColors.includes(color) ? 'bg-muted' : ''
                  }`}
                >
                  <span>{color}</span>
                  {selectedColors.includes(color) && (
                    <span className="text-foreground font-medium">✓</span>
                  )}
                </button>
              ))}
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