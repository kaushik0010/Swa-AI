import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- NEW: Function to convert Data URL to Blob ---
export async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data URL: ${response.statusText}`);
    }
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error converting data URL to Blob:", error);
    return null;
  }
}