import { useEffect } from 'react';

/**
 * Actualiza título y meta (descripción, OG) para SEO y compartir en redes.
 * Útil para Instagram: al compartir en Stories o DM se ve el título e imagen correctos.
 */
export function useDocumentHead(
  title: string,
  options?: { description?: string; image?: string }
) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (options?.description) {
      setMeta('description', options.description);
      setMeta('og:description', options.description, true);
    }
    if (options?.image) {
      setMeta('og:image', options.image, true);
      setMeta('twitter:image', options.image);
    }
    setMeta('og:title', title, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);

    return () => {
      document.title = prevTitle;
    };
  }, [title, options?.description, options?.image]);
}
