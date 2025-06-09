// User profile type
export interface Profile {
  id: string;
  name?: string;  // Maps to full_name in the database
  title?: string;
  bio?: string;
  location?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  avatarUrl?: string;  // Maps to avatar_url in the database
  
  // Database specific fields (necessary for type compatibility)
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
}

// Project type with user association
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

// Skill type with user association
export interface Skill {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  proficiency: number; // 0-100
  iconUrl?: string;
  yearAcquired?: number;
  endorsed?: number;
  created_at?: string;
  updated_at?: string;
}

// Experience type with user association
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

// Blog post type with user association
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

// Username type for vanity URLs
export interface Username {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

// User follow relationship
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Comment type
export interface Comment {
  id: string;
  user_id: string;
  content_type: 'project' | 'blog_post';
  content_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: Profile;
  replies?: Comment[];
}

// Reaction type
export interface Reaction {
  id: string;
  user_id: string;
  content_type: 'project' | 'blog_post' | 'comment';
  content_id: string;
  reaction_type: 'like' | 'love' | 'celebrate' | 'insightful' | 'funny';
  created_at: string;
  user?: Profile;
}

// Activity feed type
export interface ActivityFeed {
  id: string;
  user_id: string;
  actor_id: string;
  activity_type: 'follow' | 'project_create' | 'blog_post_create' | 'comment' | 'reaction';
  content_type?: string;
  content_id?: string;
  metadata: any;
  created_at: string;
  actor?: Profile;
}

// User role type
export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

// Rest of the original types remain the same...
export interface Testimonial {
  id: string;
  name: string;
  position: string;
  company: string;
  text: string;
  date: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  logoUrl?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Resume {
  id: string;
  userId: string;
  name: string;
  template: string;
  content: any;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
}

export interface Analytics {
  pageViews: number;
  uniqueVisitors: number;
  averageTimeOnPage: number;
  bounceRate: number;
  referrers: { [key: string]: number };
  countries: { [key: string]: number };
  devices: { [key: string]: number };
  downloadCounts: { [key: string]: number };
}

export interface Section {
  id: string;
  title: string;
  type: 'about' | 'projects' | 'skills' | 'experience' | 'education' | 'blog' | 'contact' | 'custom';
  content: any;
  order: number;
  visible: boolean;
  customFields?: { [key: string]: any };
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    bodyFont: string;
  };
  layout: 'single-page' | 'multi-page';
  darkMode: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  github: string;
  twitter: string;
  linkedin: string;
  [key: string]: string;
}

export interface SocialLinks {
  github: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  facebook: string;
  [key: string]: string;
}

export interface SiteInfo {
  title: string;
  description: string;
  keywords: string;
  author: string;
  logoUrl: string;
  faviconUrl: string;
  [key: string]: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomSupabaseClient {
  from(table: 'site_settings'): any;
  from(table: 'projects'): any;
  from(table: 'blog_posts'): any;
  from(table: 'experiences'): any;
  from(table: 'skills'): any;
  from(table: 'contact_messages'): any;
  from(table: 'profiles'): any;
  from(table: 'skill_endorsements'): any;
  from(table: 'usernames'): any;
  from(table: 'user_follows'): any;
  from(table: 'comments'): any;
  from(table: 'reactions'): any;
  from(table: 'activity_feed'): any;
  from(table: 'user_roles'): any;
  from(table: string): any;
}

// Adapter functions for converting between database and frontend formats
export const adaptDbProfileToProfile = (dbProfile: any): Profile => {
  if (!dbProfile) return {} as Profile;
  
  return {
    id: dbProfile.id,
    name: dbProfile.full_name || '',
    title: dbProfile.title || '',
    bio: dbProfile.bio || '',
    location: dbProfile.location || '',
    github: dbProfile.github || '',
    linkedin: dbProfile.linkedin || '',
    twitter: dbProfile.twitter || '',
    website: dbProfile.website || '',
    avatarUrl: dbProfile.avatar_url || '',
    
    // Keep original fields for compatibility
    full_name: dbProfile.full_name,
    avatar_url: dbProfile.avatar_url,
    updated_at: dbProfile.updated_at
  };
};

export const adaptDbProfilesToProfiles = (dbProfiles: any[]): Profile[] => {
  if (!dbProfiles || !Array.isArray(dbProfiles)) return [];
  return dbProfiles.map(adaptDbProfileToProfile);
};

// Auth utility functions
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}
