import { useEffect } from 'react';

export interface PageMeta {
  title: string;
  description?: string;
  image?: string;
  /** Relative path used for the canonical + og:url tags. */
  path?: string;
  type?: 'website' | 'article' | 'profile';
}

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://portify.dev';

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

/**
 * Keeps document title, description and social cards in sync with the page —
 * portfolio and article pages produce real shareable previews.
 */
export function usePageMeta({ title, description, image, path, type = 'website' }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description);
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    }

    const url = `${ORIGIN}${path ?? window.location.pathname}`;
    const imageUrl = image ? (image.startsWith('http') ? image : `${ORIGIN}${image}`) : undefined;

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    upsertLink('canonical', url);

    if (imageUrl) {
      upsertMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
      upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);
      upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, image, path, type]);
}

export default usePageMeta;
