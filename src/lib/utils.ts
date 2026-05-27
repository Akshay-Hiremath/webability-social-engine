import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PlatformKey } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + "…";
}

export const PLATFORM_META: Record<
  PlatformKey,
  { label: string; color: string; bgColor: string; description: string }
> = {
  linkedin: {
    label: "LinkedIn",
    color: "#0077B5",
    bgColor: "#e8f4fc",
    description: "Thought leadership post + carousel",
  },
  twitter: {
    label: "X / Twitter",
    color: "#000000",
    bgColor: "#f0f0f0",
    description: "Thread + quote card",
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    bgColor: "#fce8f0",
    description: "Caption + Reel script + carousel",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    bgColor: "#e8f0fe",
    description: "Community post + native video",
  },
  medium: {
    label: "Medium",
    color: "#00AB6C",
    bgColor: "#e8f8f2",
    description: "Full repurposed article",
  },
  substack: {
    label: "Substack",
    color: "#FF6719",
    bgColor: "#fff0e8",
    description: "Newsletter section",
  },
  reddit: {
    label: "Reddit",
    color: "#FF4500",
    bgColor: "#fff0eb",
    description: "Community post (organic tone)",
  },
};

export const PLATFORM_ORDER: PlatformKey[] = [
  "linkedin",
  "twitter",
  "instagram",
  "facebook",
  "medium",
  "substack",
  "reddit",
];

export function parseCarouselSlide(slide: string): {
  headline: string;
  body: string;
} {
  const parts = slide.split("|");
  return {
    headline: parts[0]?.trim() ?? "",
    body: parts[1]?.trim() ?? "",
  };
}
