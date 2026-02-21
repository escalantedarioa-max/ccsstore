import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStoreSettings, useUpdateStoreSettings } from '@/hooks/useStoreSettings';
import { supabase } from '@/integrations/supabase/client';
import { StoreTheme } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2, Save, Palette } from 'lucide-react';
import { toast } from 'sonner';

const THEME_OPTIONS: { value: StoreTheme; label: string }[] = [
  { value: 'moderno', label: 'Moderno' },
  { value: 'clasico', label: 'Clásico' },
  { value: 'dama', label: 'Tienda de dama' },
  { value: 'caballero', label: 'Caballero' },
  { value: 'ninos', label: 'Niños' },
  { value: 'mixto', label: 'Mixto' },
  { value: 'lenceria', label: 'Lencería de mujer' },
  { value: 'hogar', label: 'Hogar' },
];

export default function StoreSettingsPage() {
  const navigate = useNavigate();
  const { isMaster, isAdmin } = useAuth();
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();

  const [shopName, setShopName] = useState('');
  const [shopLogoUrl, setShopLogoUrl] = useState('');
  const [bcvRate, setBcvRate] = useState('');
  const [footerCredits, setFooterCredits] = useState('');
  const [developerLogoUrl, setDeveloperLogoUrl] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [theme, setTheme] = useState<StoreTheme>('moderno');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setShopName(settings.shop_name || '');
      setShopLogoUrl(settings.shop_logo_url || '');
      setBcvRate(settings.bcv_rate?.toString() || '');
      setFooterCredits(settings.footer_credits || '');
      setDeveloperLogoUrl(settings.developer_logo_url || '');
      setContactWhatsapp(settings.contact_whatsapp || '');
      setContactInstagram(settings.contact_instagram || '');
      setContactEmail(settings.contact_email || '');
      setTheme((settings.theme as StoreTheme) || 'moderno');
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'shop' | 'developer') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${type}-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      if (type === 'shop') {
        setShopLogoUrl(publicUrl);
      } else {
        setDeveloperLogoUrl(publicUrl);
      }
      toast.success('Logo subido');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir logo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    updateSettings.mutate({
      shop_name: shopName,
      shop_logo_url: shopLogoUrl || null,
      bcv_rate: parseFloat(bcvRate) || 1,
      footer_credits: isMaster ? footerCredits : settings?.footer_credits,
      developer_logo_url: isMaster ? developerLogoUrl : settings?.developer_logo_url,
      contact_whatsapp: contactWhatsapp || null,
      contact_instagram: contactInstagram || null,
      contact_email: contactEmail || null,
      theme,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Skeleton className="h-10 w-32 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Configuración de Tienda</h1>
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24 max-w-2xl mx-auto">
        {/* Apariencia (skin) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Apariencia del catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Estilo / Skin</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as StoreTheme)}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un estilo" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define colores y estilo del catálogo. Se aplica en la página principal (inicio); el panel admin siempre usa estilo neutro. Guarda y abre el catálogo en otra pestaña para ver el cambio.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de la Tienda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Tienda</Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Mi Tienda"
              />
            </div>

            <div className="space-y-2">
              <Label>Logo de la Tienda</Label>
              <div className="flex items-center gap-4">
                {shopLogoUrl && (
                  <img src={shopLogoUrl} alt="Logo" className="h-12 object-contain" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e, 'shop')}
                    disabled={uploading}
                  />
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-sm">Subir Logo</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BCV Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasa de Cambio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tasa BCV (Bs. por USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={bcvRate}
                onChange={(e) => setBcvRate(e.target.value)}
                placeholder="36.50"
              />
              <p className="text-xs text-muted-foreground">
                Esta tasa se usará para mostrar precios en Bolívares
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="+58 412 1234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={contactInstagram}
                onChange={(e) => setContactInstagram(e.target.value)}
                placeholder="@mitienda"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@mitienda.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Master-only settings */}
        {isMaster && (
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-amber-500">★</span>
                Configuración Master
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Créditos del Footer</Label>
                <Textarea
                  value={footerCredits}
                  onChange={(e) => setFooterCredits(e.target.value)}
                  placeholder="Desarrollado con ❤️ por..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo del Desarrollador</Label>
                <div className="flex items-center gap-4">
                  {developerLogoUrl && (
                    <img src={developerLogoUrl} alt="Dev Logo" className="h-8 object-contain" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, 'developer')}
                      disabled={uploading}
                    />
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="text-sm">Subir Logo</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
