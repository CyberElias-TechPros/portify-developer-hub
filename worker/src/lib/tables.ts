/**
 * Table registry with row-level security policies.
 *
 * Every table exposed through the REST layer declares:
 *   - a column allow-list (prevents SQL injection through identifiers)
 *   - a `read` scope expressed as SQL so lists are filtered in the database
 *   - per-row predicates for update/delete
 *   - optional lifecycle hooks (activity feeds, notifications, counters)
 *
 * This is the Cloudflare/D1 equivalent of Postgres RLS policies.
 */
import type { Env, Role } from '../env';
import { HttpError } from './http';
import { uuid } from './crypto';

export interface SessionUser {
  id: string;
  email: string;
  roles: Role[];
}

export interface Scope {
  sql: string;
  params: unknown[];
}

export type Row = Record<string, any>;

export interface DBContext {
  env: Env;
  user: SessionUser | null;
  /** Populated by the auth layer: is the caller an admin? */
  isAdmin: boolean;
}

export interface RelationSpec {
  table: string;
  localKey: string;
  foreignKey: string;
  columns?: string[];
  as?: 'object' | 'array';
}

export interface TablePolicy {
  name: string;
  columns: string[];
  jsonColumns?: string[];
  defaultOrder?: string;
  /** Generated server-side on insert. */
  serverInsert?: (ctx: DBContext, row: Row) => Row;
  /** SQL fragment limiting which rows the caller may see. */
  read?: (ctx: DBContext) => Scope | null;
  canInsert?: (ctx: DBContext, row: Row) => boolean;
  canUpdate?: (ctx: DBContext, row: Row, patch: Row) => boolean;
  canDelete?: (ctx: DBContext, row: Row) => boolean;
  afterInsert?: (ctx: DBContext, row: Row) => Promise<void>;
  afterUpdate?: (ctx: DBContext, row: Row, patch: Row) => Promise<void>;
  afterDelete?: (ctx: DBContext, row: Row) => Promise<void>;
  relations?: Record<string, RelationSpec>;
  /** Hide these columns from reads. */
  privateColumns?: string[];
}

const TRUE: Scope = { sql: '1 = 1', params: [] };

const own = (ctx: DBContext): Scope | null =>
  ctx.user ? { sql: 'user_id = ?', params: [ctx.user.id] } : null;

const publicOrOwn =
  (publicColumn = 'is_public') =>
  (ctx: DBContext): Scope => {
    if (ctx.isAdmin) return TRUE;
    if (!ctx.user) return { sql: `${publicColumn} = 1`, params: [] };
    return { sql: `(${publicColumn} = 1 OR user_id = ?)`, params: [ctx.user.id] };
  };

const publishable = (ctx: DBContext): Scope => {
  if (ctx.isAdmin) return TRUE;
  if (!ctx.user) return { sql: '(published = 1 AND is_public = 1)', params: [] };
  return { sql: '((published = 1 AND is_public = 1) OR user_id = ?)', params: [ctx.user.id] };
};

export const TABLES: Record<string, TablePolicy> = {
  profiles: {
    name: 'profiles',
    columns: [
      'id', 'username', 'full_name', 'display_name', 'title', 'bio', 'long_bio', 'location', 'timezone',
      'pronouns', 'availability', 'email', 'phone', 'website', 'github', 'linkedin', 'twitter', 'instagram',
      'youtube', 'dribbble', 'resume_url', 'avatar_url', 'cover_url', 'accent', 'is_public', 'is_verified',
      'onboarding_step', 'profile_views', 'created_at', 'updated_at',
    ],
    defaultOrder: 'created_at.desc',
    serverInsert: (ctx, row) => ({
      id: ctx.user?.id ?? row.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return { sql: 'is_public = 1', params: [] };
      return { sql: '(is_public = 1 OR id = ?)', params: [ctx.user.id] };
    },
    canInsert: (ctx, row) => !!ctx.user && row.id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.id === ctx.user.id || ctx.isAdmin),
    relations: {
      roles: { table: 'user_roles', localKey: 'id', foreignKey: 'user_id', as: 'array', columns: ['role'] },
    },
  },

  usernames: {
    name: 'usernames',
    columns: ['id', 'user_id', 'username', 'created_at', 'updated_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), user_id: ctx.user?.id, ...row }),
    read: () => TRUE,
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
  },

  user_roles: {
    name: 'user_roles',
    columns: ['id', 'user_id', 'role', 'created_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), ...row }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return { sql: '1 = 0', params: [] };
      return { sql: 'user_id = ?', params: [ctx.user.id] };
    },
    canInsert: (ctx) => ctx.isAdmin,
    canUpdate: (ctx) => ctx.isAdmin,
    canDelete: (ctx) => ctx.isAdmin,
  },

  projects: {
    name: 'projects',
    columns: [
      'id', 'user_id', 'title', 'slug', 'description', 'long_description', 'tags', 'image_url', 'gallery',
      'repo_url', 'demo_url', 'category', 'status', 'role', 'featured', 'stars', 'forks', 'contributors',
      'views', 'source', 'github_id', 'start_date', 'end_date', 'is_public', 'position', 'created_at', 'updated_at',
    ],
    jsonColumns: ['tags', 'gallery'],
    defaultOrder: 'featured.desc,created_at.desc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: publicOrOwn(),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    afterInsert: async (ctx, row) => {
      await pushActivity(ctx, row.user_id, ctx.user?.id ?? row.user_id, 'project_create', 'project', row.id, {
        title: row.title,
      });
    },
    relations: {
      author: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title'] },
      owner: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title'] },
    },
  },

  skills: {
    name: 'skills',
    columns: [
      'id', 'user_id', 'name', 'category', 'proficiency', 'icon_url', 'year_acquired', 'endorsed',
      'description', 'is_public', 'position', 'created_at', 'updated_at',
    ],
    defaultOrder: 'proficiency.desc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: publicOrOwn(),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
  },

  skill_endorsements: {
    name: 'skill_endorsements',
    columns: ['id', 'skill_id', 'endorser_id', 'comment', 'created_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), endorser_id: ctx.user?.id, ...row }),
    read: () => TRUE,
    canInsert: (ctx, row) => !!ctx.user && row.endorser_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && row.endorser_id === ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && (row.endorser_id === ctx.user.id || ctx.isAdmin),
    relations: {
      endorser: { table: 'profiles', localKey: 'endorser_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url'] },
    },
  },

  experiences: {
    name: 'experiences',
    columns: [
      'id', 'user_id', 'company', 'position', 'employment', 'location', 'start_date', 'end_date', 'description',
      'logo_url', 'company_url', 'technologies', 'projects', 'is_public', 'position_order', 'created_at', 'updated_at',
    ],
    jsonColumns: ['technologies', 'projects'],
    defaultOrder: 'start_date.desc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: publicOrOwn(),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
  },

  education: {
    name: 'education',
    columns: [
      'id', 'user_id', 'institution', 'degree', 'field', 'location', 'start_date', 'end_date', 'description',
      'logo_url', 'is_public', 'position_order', 'created_at', 'updated_at',
    ],
    defaultOrder: 'start_date.desc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: publicOrOwn(),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
  },

  blog_posts: {
    name: 'blog_posts',
    columns: [
      'id', 'user_id', 'title', 'slug', 'excerpt', 'content', 'cover_image_url', 'category', 'series', 'tags',
      'reading_time', 'views', 'likes', 'published', 'is_public', 'featured', 'publish_date', 'created_at', 'updated_at',
    ],
    jsonColumns: ['tags'],
    defaultOrder: 'publish_date.desc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      publish_date: row.published ? (row.publish_date ?? new Date().toISOString()) : row.publish_date,
      ...row,
    }),
    read: publishable,
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    afterInsert: async (ctx, row) => {
      if (!row.published) return;
      await pushActivity(ctx, row.user_id, ctx.user?.id ?? row.user_id, 'blog_post_create', 'blog_post', row.id, {
        title: row.title,
      });
    },
    relations: {
      author: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title', 'bio'] },
      owner: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title', 'bio'] },
    },
  },

  portfolio_sections: {
    name: 'portfolio_sections',
    columns: ['id', 'user_id', 'type', 'title', 'subtitle', 'content', 'visible', 'position_order', 'created_at', 'updated_at'],
    jsonColumns: ['content'],
    defaultOrder: 'position_order.asc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return { sql: 'visible = 1', params: [] };
      return { sql: '(visible = 1 OR user_id = ?)', params: [ctx.user.id] };
    },
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
  },

  themes: {
    name: 'themes',
    columns: ['id', 'user_id', 'name', 'config', 'is_active', 'created_at', 'updated_at'],
    jsonColumns: ['config'],
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return { sql: 'is_active = 1', params: [] };
      return { sql: '(is_active = 1 OR user_id = ?)', params: [ctx.user.id] };
    },
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
  },

  resumes: {
    name: 'resumes',
    columns: ['id', 'user_id', 'name', 'template', 'content', 'is_default', 'created_at', 'updated_at'],
    jsonColumns: ['content'],
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: own,
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
  },

  user_follows: {
    name: 'user_follows',
    columns: ['id', 'follower_id', 'following_id', 'created_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), follower_id: ctx.user?.id, ...row }),
    defaultOrder: 'created_at.desc',
    read: () => TRUE,
    canInsert: (ctx, row) => !!ctx.user && row.follower_id === ctx.user.id && row.follower_id !== row.following_id,
    canUpdate: () => false,
    canDelete: (ctx, row) => !!ctx.user && row.follower_id === ctx.user.id,
    afterInsert: async (ctx, row) => {
      await pushActivity(ctx, row.following_id, row.follower_id, 'follow', 'profile', row.follower_id, {});
      await pushNotification(ctx, row.following_id, row.follower_id, 'follow', 'New follower', 'started following you', `/discover`);
    },
    relations: {
      follower: { table: 'profiles', localKey: 'follower_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title'] },
      following: { table: 'profiles', localKey: 'following_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title'] },
    },
  },

  comments: {
    name: 'comments',
    columns: ['id', 'user_id', 'content_type', 'content_id', 'content', 'parent_id', 'is_edited', 'created_at', 'updated_at'],
    defaultOrder: 'created_at.asc',
    serverInsert: (ctx, row) => ({
      id: uuid(),
      user_id: ctx.user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row,
    }),
    read: () => TRUE,
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || ctx.isAdmin),
    relations: {
      user: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url'] },
      replies: { table: 'comments', localKey: 'id', foreignKey: 'parent_id', as: 'array' },
    },
  },

  reactions: {
    name: 'reactions',
    columns: ['id', 'user_id', 'content_type', 'content_id', 'reaction_type', 'created_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), user_id: ctx.user?.id, created_at: new Date().toISOString(), ...row }),
    read: () => TRUE,
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: () => false,
    canDelete: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
  },

  bookmarks: {
    name: 'bookmarks',
    columns: ['id', 'user_id', 'content_type', 'content_id', 'created_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), user_id: ctx.user?.id, created_at: new Date().toISOString(), ...row }),
    read: (ctx) => (ctx.user ? { sql: 'user_id = ?', params: [ctx.user.id] } : null),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
  },

  activity_feed: {
    name: 'activity_feed',
    columns: ['id', 'user_id', 'actor_id', 'activity_type', 'content_type', 'content_id', 'metadata', 'created_at'],
    jsonColumns: ['metadata'],
    defaultOrder: 'created_at.desc',
    serverInsert: (ctx, row) => ({ id: uuid(), actor_id: ctx.user?.id, created_at: new Date().toISOString(), ...row }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return { sql: 'user_id IS NOT NULL AND 1 = 0', params: [] };
      return { sql: '(user_id = ? OR actor_id = ?)', params: [ctx.user.id, ctx.user.id] };
    },
    canInsert: (ctx, row) => !!ctx.user && row.actor_id === ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && (row.actor_id === ctx.user.id || ctx.isAdmin),
    relations: {
      actor: { table: 'profiles', localKey: 'actor_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title'] },
    },
  },

  notifications: {
    name: 'notifications',
    columns: ['id', 'user_id', 'actor_id', 'type', 'title', 'body', 'link', 'read', 'created_at'],
    defaultOrder: 'created_at.desc',
    serverInsert: (ctx, row) => ({ id: uuid(), created_at: new Date().toISOString(), ...row }),
    read: (ctx) => (ctx.user ? { sql: 'user_id = ?', params: [ctx.user.id] } : null),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    relations: {
      actor: { table: 'profiles', localKey: 'actor_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url'] },
    },
  },

  testimonials: {
    name: 'testimonials',
    columns: [
      'id', 'user_id', 'author_id', 'author_name', 'author_title', 'company', 'text', 'rating', 'approved', 'created_at',
    ],
    serverInsert: (ctx, row: Row) => ({ id: uuid(), author_id: ctx.user?.id, created_at: new Date().toISOString(), ...row }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return { sql: 'approved = 1', params: [] };
      return { sql: '(approved = 1 OR user_id = ? OR author_id = ?)', params: [ctx.user.id, ctx.user.id] };
    },
    canInsert: (ctx, row: Row) => !!ctx.user && row.author_id === ctx.user.id && row.user_id !== ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && (row.user_id === ctx.user.id || row.author_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.author_id === ctx.user.id || ctx.isAdmin),
    relations: {
      author: { table: 'profiles', localKey: 'author_id', foreignKey: 'id', columns: ['id', 'full_name', 'username', 'avatar_url', 'title'] },
    },
  },

  contact_messages: {
    name: 'contact_messages',
    columns: [
      'id', 'name', 'email', 'subject', 'message', 'company', 'budget', 'recipient_id', 'read', 'starred',
      'replied_at', 'ip', 'user_agent', 'created_at',
    ],
    defaultOrder: 'created_at.desc',
    privateColumns: ['ip', 'user_agent'],
    serverInsert: (ctx, row) => ({
      id: uuid(),
      created_at: new Date().toISOString(),
      read: 0,
      starred: 0,
      ...row,
    }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return null;
      return { sql: 'recipient_id = ?', params: [ctx.user.id] };
    },
    canInsert: () => true,
    canUpdate: (ctx, row) => !!ctx.user && (row.recipient_id === ctx.user.id || ctx.isAdmin),
    canDelete: (ctx, row) => !!ctx.user && (row.recipient_id === ctx.user.id || ctx.isAdmin),
  },

  message_threads: {
    name: 'message_threads',
    columns: ['id', 'participant_a', 'participant_b', 'subject', 'last_message_at', 'created_at'],
    defaultOrder: 'last_message_at.desc',
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return null;
      return { sql: '(participant_a = ? OR participant_b = ?)', params: [ctx.user.id, ctx.user.id] };
    },
    canInsert: (ctx, row) => !!ctx.user && (row.participant_a === ctx.user.id || row.participant_b === ctx.user.id),
    canUpdate: (ctx, row) => !!ctx.user && (row.participant_a === ctx.user.id || row.participant_b === ctx.user.id),
    canDelete: (ctx, row) => !!ctx.user && (row.participant_a === ctx.user.id || row.participant_b === ctx.user.id),
  },

  direct_messages: {
    name: 'direct_messages',
    columns: ['id', 'thread_id', 'sender_id', 'body', 'read_at', 'created_at'],
    defaultOrder: 'created_at.asc',
    serverInsert: (ctx, row) => ({ id: uuid(), sender_id: ctx.user?.id, created_at: new Date().toISOString(), ...row }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return null;
      return {
        sql: 'thread_id IN (SELECT id FROM message_threads WHERE participant_a = ? OR participant_b = ?)',
        params: [ctx.user.id, ctx.user.id],
      };
    },
    canInsert: (ctx, row) => !!ctx.user && row.sender_id === ctx.user.id,
    canUpdate: (ctx, row) => !!ctx.user && row.sender_id !== ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && row.sender_id === ctx.user.id,
  },

  newsletter_subscribers: {
    name: 'newsletter_subscribers',
    columns: ['id', 'email', 'source', 'confirmed', 'created_at'],
    serverInsert: (_ctx, row) => ({ id: uuid(), created_at: new Date().toISOString(), ...row }),
    read: (ctx) => (ctx.isAdmin ? TRUE : null),
    canInsert: () => true,
    canDelete: (ctx) => ctx.isAdmin,
  },

  site_settings: {
    name: 'site_settings',
    columns: ['id', 'key', 'value', 'created_at', 'updated_at'],
    jsonColumns: ['value'],
    serverInsert: (_ctx, row) => ({ id: uuid(), updated_at: new Date().toISOString(), ...row }),
    read: () => TRUE,
    canInsert: (ctx) => ctx.isAdmin,
    canUpdate: (ctx) => ctx.isAdmin,
    canDelete: (ctx) => ctx.isAdmin,
  },

  media_uploads: {
    name: 'media_uploads',
    columns: ['id', 'user_id', 'key', 'url', 'filename', 'content_type', 'size', 'created_at'],
    serverInsert: (ctx, row) => ({ id: uuid(), user_id: ctx.user?.id, created_at: new Date().toISOString(), ...row }),
    read: (ctx) => (ctx.user ? { sql: 'user_id = ?', params: [ctx.user.id] } : null),
    canInsert: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
    canDelete: (ctx, row) => !!ctx.user && row.user_id === ctx.user.id,
  },

  analytics_events: {
    name: 'analytics_events',
    columns: [
      'id', 'owner_id', 'viewer_id', 'session_key', 'event_type', 'path', 'referrer', 'country', 'city', 'device',
      'browser', 'os', 'metadata', 'created_at',
    ],
    jsonColumns: ['metadata'],
    defaultOrder: 'created_at.desc',
    serverInsert: (_ctx, row) => ({ id: uuid(), created_at: new Date().toISOString(), ...row }),
    read: (ctx) => {
      if (ctx.isAdmin) return TRUE;
      if (!ctx.user) return null;
      return { sql: 'owner_id = ?', params: [ctx.user.id] };
    },
    canInsert: () => true,
    canDelete: (ctx, row) => !!ctx.user && (row.owner_id === ctx.user.id || ctx.isAdmin),
  },

  audit_log: {
    name: 'audit_log',
    columns: ['id', 'actor_id', 'action', 'target', 'metadata', 'ip', 'created_at'],
    jsonColumns: ['metadata'],
    defaultOrder: 'created_at.desc',
    serverInsert: (_ctx, row) => ({ id: uuid(), created_at: new Date().toISOString(), ...row }),
    read: (ctx) => (ctx.isAdmin ? TRUE : null),
    canInsert: (ctx) => ctx.isAdmin,
  },
};

export function getTable(name: string): TablePolicy {
  const policy = TABLES[name];
  if (!policy) throw HttpError.notFound(`Unknown collection "${name}"`);
  return policy;
}

export function assertColumn(policy: TablePolicy, column: string, allowRelation = false): string {
  if (column === '*' || column.includes('(') || column.includes(':')) return column;
  if (policy.columns.includes(column)) return column;
  if (allowRelation && policy.relations && policy.relations[column]) return column;
  throw HttpError.badRequest(`Unknown column "${column}" on ${policy.name}`);
}

// ---------------------------------------------------------------- helpers --
export async function pushActivity(
  ctx: DBContext,
  recipientId: string | null | undefined,
  actorId: string,
  type: string,
  contentType: string | null,
  contentId: string | null,
  metadata: Row
) {
  if (!recipientId) return;
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO activity_feed (id, user_id, actor_id, activity_type, content_type, content_id, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(uuid(), recipientId, actorId, type, contentType, contentId, JSON.stringify(metadata ?? {}), new Date().toISOString())
      .run();
  } catch (error) {
    console.warn('[activity] failed to record', type, error);
  }
}

export async function pushNotification(
  ctx: DBContext,
  userId: string | null | undefined,
  actorId: string | null,
  type: string,
  title: string,
  body: string,
  link: string | null
) {
  if (!userId || userId === actorId) return;
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO notifications (id, user_id, actor_id, type, title, body, link, read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
    )
      .bind(uuid(), userId, actorId, type, title, body, link, new Date().toISOString())
      .run();
  } catch (error) {
    console.warn('[notification] failed to record', type, error);
  }
}

export async function audit(ctx: DBContext, action: string, target: string, metadata: Row = {}, ip?: string) {
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO audit_log (id, actor_id, action, target, metadata, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(uuid(), ctx.user?.id ?? null, action, target, JSON.stringify(metadata), ip ?? null, new Date().toISOString())
      .run();
  } catch (error) {
    console.warn('[audit] failed', action, error);
  }
}
