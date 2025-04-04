
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
  stars?: number;
  forks?: number;
  contributors?: number;
  category?: string;
}

// Skill type
export interface Skill {
  id: string;
  name: string;
  category: 'languages' | 'frameworks' | 'tools' | 'other';
  proficiency: number; // 0-100
  iconUrl?: string;
  yearAcquired?: number;
  endorsed?: number;
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
  current?: boolean;
  technologies?: string[];
  projects?: string[];
  testimonials?: Testimonial[];
}

// Testimonial type
export interface Testimonial {
  id: string;
  name: string;
  position: string;
  company: string;
  text: string;
  date: string;
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
  category?: string;
  series?: string;
  readingTime?: number;
  published?: boolean;
  comments?: Comment[];
  reactions?: Reaction[];
}

// Comment type
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  parentId?: string;
}

// Reaction type
export interface Reaction {
  id: string;
  userId: string;
  type: 'like' | 'love' | 'celebrate' | 'insightful' | 'funny';
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

// User role type
export interface UserRole {
  id: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
}

// Resume type
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

// Analytics type
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

// Section type
export interface Section {
  id: string;
  title: string;
  type: 'about' | 'projects' | 'skills' | 'experience' | 'education' | 'blog' | 'contact' | 'custom';
  content: any;
  order: number;
  visible: boolean;
  customFields?: { [key: string]: any };
}

// Theme type
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
