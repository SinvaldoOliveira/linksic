import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')                   // separate accents from letters
    .replace(/[\u0300-\u036f]/g, '')    // remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')               // replace spaces with -
    .replace(/[^\w-]+/g, '')            // remove all non-word chars
    .replace(/--+/g, '-');              // replace multiple - with single -
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase();
    if (host === 'www.youtube.com' || host === 'youtube.com') {
      const v = u.searchParams.get('v');
      return v || null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\/+/, '');
      return id || null;
    }
    return null;
  } catch {
    return null;
  }
}
