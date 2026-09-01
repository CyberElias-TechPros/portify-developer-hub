-- Remove rows created by the former illustrative starter migration when this
-- migration is applied to an already-initialized database. No user-created
-- records are targeted.
DELETE FROM blog_posts WHERE user_id = 'demo-user';
DELETE FROM experiences WHERE user_id = 'demo-user';
DELETE FROM skills WHERE user_id = 'demo-user';
DELETE FROM projects WHERE user_id = 'demo-user';
DELETE FROM usernames WHERE user_id = 'demo-user';
DELETE FROM profiles WHERE id = 'demo-user';
DELETE FROM site_settings WHERE id IN ('setting-contact', 'setting-social', 'setting-site', 'setting-theme');
