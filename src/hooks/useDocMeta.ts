import { useEffect } from 'react';

interface DocMeta {
  title?: string;
  description?: string;
}

/**
 * Lightweight replacement for useSeoMeta / UnheadProvider.
 * Sets document.title and the meta description tag.
 */
export function useDocMeta({ title, description }: DocMeta) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (!description) return;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [description]);
}
