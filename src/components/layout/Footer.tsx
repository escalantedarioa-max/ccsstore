import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Instagram, MessageCircle, Mail } from 'lucide-react';

export const Footer = () => {
  const { data: storeSettings } = useStoreSettings();

  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Contact Links */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {storeSettings?.contact_whatsapp && (
            <a
              href={`https://wa.me/${storeSettings.contact_whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {storeSettings?.contact_instagram && (
            <a
              href={`https://instagram.com/${storeSettings.contact_instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          )}
          {storeSettings?.contact_email && (
            <a
              href={`mailto:${storeSettings.contact_email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
          )}
        </div>

        {/* Developer branding and credits */}
        <div className="flex flex-col items-center gap-3 pt-6 border-t border-border">
          {storeSettings?.developer_logo_url && (
            <img
              src={storeSettings.developer_logo_url}
              alt="Developer"
              className="h-6 opacity-50 hover:opacity-100 transition-opacity"
            />
          )}
          {storeSettings?.footer_credits && (
            <p className="text-xs text-muted-foreground text-center">
              {storeSettings.footer_credits}
            </p>
          )}
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} {storeSettings?.shop_name || 'Tienda'}
          </p>
        </div>
      </div>
    </footer>
  );
};
