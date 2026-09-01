import type { Json } from "@/types/database";

export interface Profile {
  id: string;
  name?: string;
  title?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  avatarUrl?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  imageUrl: string;
  repoUrl: string;
  demoUrl?: string;
  featured: boolean;
  stars?: number;
  forks?: number;
  contributors?: number;
  category?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  proficiency: number;
  iconUrl?: string;
  yearAcquired?: number;
  endorsed?: number;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Experience {
  id: string;
  user_id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
  logoUrl?: string;
  location: string;
  current?: boolean;
  technologies?: string[];
  projects?: string[];
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  publishDate: string;
  tags: string[];
  coverImageUrl?: string;
  category?: string;
  series?: string;
  readingTime?: number;
  published?: boolean;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Username { id: string; user_id: string; username: string; created_at: string; updated_at: string; }
export interface UserFollow { id: string; follower_id: string; following_id: string; created_at: string; }
export interface Comment { id: string; user_id: string; content_type: "project" | "blog_post"; content_id: string; content: string; parent_id?: string | null; created_at: string; updated_at: string; user?: Profile; replies?: Comment[]; }
export interface Reaction { id: string; user_id: string; content_type: "project" | "blog_post" | "comment"; content_id: string; reaction_type: "like" | "love" | "celebrate" | "insightful" | "funny"; created_at: string; user?: Profile; }
export interface ActivityFeed { id: string; user_id: string; actor_id: string; activity_type: "follow" | "project_create" | "blog_post_create" | "comment" | "reaction"; content_type?: string; content_id?: string; metadata: Json; created_at: string; actor?: Profile; }
export interface UserRole { id: string; user_id: string; role: "admin" | "moderator" | "user"; created_at: string; }
export interface Testimonial { id: string; name: string; position: string; company: string; text: string; date: string; }
export interface Education { id: string; institution: string; degree: string; field: string; startDate: string; endDate: string; logoUrl?: string; }
export interface ContactMessage { id: string; name: string; email: string; subject: string; message: string; createdAt: string; read: boolean; }
export interface Resume { id: string; userId: string; name: string; template: string; content: Json; createdAt: string; updatedAt: string; pdfUrl?: string; }
export interface Analytics { pageViews: number; uniqueVisitors: number; averageTimeOnPage: number; bounceRate: number; referrers: Record<string, number>; countries: Record<string, number>; devices: Record<string, number>; downloadCounts: Record<string, number>; }
export interface Section { id: string; title: string; type: "about" | "projects" | "skills" | "experience" | "education" | "blog" | "contact" | "custom"; content: Json; order: number; visible: boolean; customFields?: Record<string, Json>; }
export interface Theme { id: string; name: string; colors: { primary: string; secondary: string; background: string; text: string; accent: string }; typography: { fontFamily: string; headingFont: string; bodyFont: string }; layout: "single-page" | "multi-page"; darkMode: boolean; }
export interface ContactInfo { email: string; phone: string; address: string; github: string; twitter: string; linkedin: string; [key: string]: string; }
export interface SocialLinks { github: string; twitter: string; linkedin: string; instagram: string; youtube: string; facebook: string; [key: string]: string; }
export interface SiteInfo { title: string; description: string; keywords: string; author: string; logoUrl: string; faviconUrl: string; [key: string]: string; }
export interface SiteSetting { id: string; key: string; value: Json; createdAt?: string; updatedAt?: string; }

function record(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }
export const adaptDbProfileToProfile = (dbProfile: unknown): Profile => { const data = record(dbProfile); const id = stringValue(data.id); return { id, name: stringValue(data.full_name), title: stringValue(data.title), bio: stringValue(data.bio), location: stringValue(data.location), email: stringValue(data.email), phone: stringValue(data.phone), github: stringValue(data.github), linkedin: stringValue(data.linkedin), twitter: stringValue(data.twitter), website: stringValue(data.website), avatarUrl: stringValue(data.avatar_url), full_name: stringValue(data.full_name), avatar_url: stringValue(data.avatar_url), updated_at: stringValue(data.updated_at) }; };
export const adaptDbProfilesToProfiles = (dbProfiles: unknown[]): Profile[] => Array.isArray(dbProfiles) ? dbProfiles.map(adaptDbProfileToProfile) : [];
