import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYoutubeId(url: string): string | null {
  // Handle multiple formats of YouTube URLs
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/, // Standard youtube.com/watch?v=ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // Short youtu.be/ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, // Embed youtube.com/embed/ID
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/ // Legacy youtube.com/v/ID
  ];
  
  // Try each pattern
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If no pattern matched, try last resort extraction
  const lastResort = url.match(/([a-zA-Z0-9_-]{11})/);
  if (lastResort && lastResort[1]) {
    return lastResort[1];
  }
  
  return null;
}
