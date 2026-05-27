export interface BlogPost {
  title: string;
  url: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  readTime: number;
  imageUrl?: string;
  author?: string;
}

export interface ImageBrief {
  dimensions: string;
  concept: string;
  textOverlay: string;
  colorPalette: string;
  moodNotes: string;
  ctaText?: string;
}

export interface VideoScene {
  timeCode: string;
  visual: string;
  voiceover: string;
  textOverlay: string;
}

export interface VideoScript {
  duration: string;
  hook: string;
  scenes: VideoScene[];
  cta: string;
}

export interface LinkedInContent {
  textPost: string;
  hashtags: string[];
  carouselSlides: string[];
  imageBrief: ImageBrief;
  videoScript: VideoScript;
}

export interface TwitterContent {
  thread: string[];
  hashtags: string[];
  imageBrief: ImageBrief;
  videoScript: VideoScript;
}

export interface InstagramContent {
  textPost: string;
  hashtags: string[];
  carouselSlides: string[];
  imageBrief: ImageBrief;
  videoScript: VideoScript;
}

export interface FacebookContent {
  textPost: string;
  hashtags: string[];
  imageBrief: ImageBrief;
  videoScript: VideoScript;
}

export interface MediumContent {
  articleBody: string;
  imageBrief: ImageBrief;
}

export interface SubstackContent {
  newsletterSection: string;
  imageBrief: ImageBrief;
}

export interface RedditContent {
  textPost: string;
  subreddits: string[];
}

export interface GeneratedPlatforms {
  linkedin?: LinkedInContent;
  twitter?: TwitterContent;
  instagram?: InstagramContent;
  facebook?: FacebookContent;
  medium?: MediumContent;
  substack?: SubstackContent;
  reddit?: RedditContent;
}

export interface GeneratedSuite {
  blogTitle: string;
  blogUrl: string;
  generatedAt: string;
  contentPillar: string;
  platforms: GeneratedPlatforms;
}

export interface HistorySession {
  id: string;
  blogTitle: string;
  blogUrl: string;
  generatedAt: string;
  suite: GeneratedSuite;
}

export type PlatformKey = keyof GeneratedPlatforms;
