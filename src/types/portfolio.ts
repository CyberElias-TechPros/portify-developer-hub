
// User profile type
export interface Profile {
  id: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
  website: string;
  avatarUrl: string;
}

// Project type
export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  tags: string[];
  imageUrl: string;
  repoUrl: string;
  demoUrl?: string;
  featured: boolean;
}

// Skill type
export interface Skill {
  id: string;
  name: string;
  category: 'languages' | 'frameworks' | 'tools' | 'other';
  proficiency: number; // 0-100
  iconUrl?: string;
}

// Experience type
export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
  logoUrl?: string;
  location: string;
}

// Education type
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  logoUrl?: string;
}

// Blog post type
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  publishDate: string;
  tags: string[];
  coverImageUrl?: string;
}

// ContactMessage type
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}
