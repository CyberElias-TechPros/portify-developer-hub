import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Send,
  Sparkles,
  Star,
  Twitter,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EmptyState, GhostButton, GlowButton, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Reveal, RevealGroup, RevealItem } from '@/components/experience/Reveal';
import TiltCard from '@/components/experience/TiltCard';
import FollowButton from '@/components/community/FollowButton';
import EndorseButton from '@/components/community/EndorseButton';
import TestimonialForm from '@/components/community/TestimonialForm';
import Reactions from '@/components/community/Reactions';
import { usePortfolio } from '@/hooks/useUserContent';
import usePageMeta from '@/hooks/usePageMeta';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';

const SECTION_LABELS: Record<string, string> = {
  about: 'About',
  projects: 'Work',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  blog: 'Writing',
  contact: 'Contact',
  custom: 'More',
};

export default function UserPortfolio() {
  const { username } = useParams();
  const { bundle, loading, error, refetch } = usePortfolio(username);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('about');

  usePageMeta({
    title: bundle?.profile
      ? `${bundle.profile.full_name || bundle.profile.username} — ${bundle.profile.title || 'Developer'}`
      : 'Portfolio · Portify',
    description: bundle?.profile?.bio ?? undefined,
    image: bundle?.profile?.username ? `/api/og/${bundle.profile.username}` : undefined,
    path: `/${username ?? ''}`,
    type: 'profile',
  });

  const sections = useMemo(
    () => (bundle?.sections ?? []).filter((section: any) => section.visible !== false),
    [bundle?.sections]
  );

  useEffect(() => {
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((section: any) => {
      const node = document.getElementById(`section-${section.type}-${section.id}`);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [sections]);

  if (loading) {
    return (
      <Layout hideAnimation>
        <div className="mx-auto max-w-5xl space-y-6 px-6 py-20">
          <div className="h-64 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
          <div className="h-40 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
        </div>
      </Layout>
    );
  }

  if (error || !bundle) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <EmptyState
            icon={Sparkles}
            title={error?.includes('private') ? 'This portfolio is private' : 'No portfolio at this address'}
            description={
              error ?? 'Check the handle, or discover someone else doing interesting work.'
            }
            action={
              <Link to="/discover">
                <GlowButton>Discover developers</GlowButton>
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const { profile, stats, projects, skills, experiences, education, posts, testimonials, isOwner } = bundle;
  const name = profile.full_name || profile.display_name || profile.username;
  const accent = profile.accent || 'hsl(var(--violet))';

  const startConversation = async (targetId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const { data, error } = await api.post<{ thread: { id: string } }>('/api/dm/threads', { userId: targetId });
    if (error || !data?.thread) {
      toast.error(error?.message ?? 'Could not open that conversation');
      return;
    }
    navigate(`/messages?thread=${data.thread.id}`);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Layout hideAnimation bare>
      {/* ------------------------------------------------------------- hero -- */}
      <section className="relative overflow-hidden pb-16 pt-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(70% 90% at 20% 0%, ${accent}22, transparent 60%), radial-gradient(60% 80% at 85% 10%, hsl(var(--cyan) / .16), transparent 65%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal mode="blur">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-white/10">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] font-display text-3xl font-bold text-[hsl(240_30%_4%)]">
                      {(name || 'P').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {profile.availability && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                      available
                    </span>
                  )}
                </div>

                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    portify.dev/{profile.username}
                  </p>
                  <h1 className="display-lg mt-3">{name}</h1>
                  <p className="mt-3 max-w-xl text-base text-secondary">
                    {profile.title || 'Developer building on the web'}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {profile.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {profile.location}
                      </span>
                    )}
                    {profile.pronouns && <span>{profile.pronouns}</span>}
                    {bundle.profile.email && isOwner && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {bundle.profile.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isOwner ? (
                  <>
                    <Link to="/profile">
                      <GhostButton>
                        <Pencil className="h-4 w-4" /> Edit profile
                      </GhostButton>
                    </Link>
                    <Link to="/sections">
                      <GhostButton>
                        <Sparkles className="h-4 w-4" /> Studio
                      </GhostButton>
                    </Link>
                  </>
                ) : (
                  <>
                    <FollowButton targetUserId={profile.id} />
                    <GhostButton onClick={() => void startConversation(profile.id)}>
                      <MessageSquare className="h-4 w-4" /> Message
                    </GhostButton>
                    <GhostButton onClick={share}>
                      <Copy className="h-4 w-4" /> Share
                    </GhostButton>
                    <a href={`#section-contact`}>
                      <GlowButton>
                        <Send className="h-4 w-4" /> Get in touch
                      </GlowButton>
                    </a>
                  </>
                )}
              </div>
            </div>
          </Reveal>

          {/* socials + stats */}
          <Reveal delay={0.15} className="mt-10">
            <div className="flex flex-col gap-6 border-t border-white/[0.08] pt-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { key: 'github', icon: Github, prefix: 'github.com/' },
                  { key: 'linkedin', icon: Linkedin, prefix: 'linkedin.com/in/' },
                  { key: 'twitter', icon: Twitter, prefix: 'x.com/' },
                  { key: 'website', icon: Globe, prefix: '' },
                ]
                  .filter((item) => profile[item.key])
                  .map(({ key, icon: Icon, prefix }) => (
                    <a
                      key={key}
                      href={profile[key]?.startsWith('http') ? profile[key] : `https://${prefix}${profile[key]}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {profile[key]?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  ))}
                {profile.resume_url && (
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Résumé
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {[
                  { label: 'projects', value: stats.projects },
                  { label: 'skills', value: skills.length },
                  { label: 'followers', value: stats.followers },
                  { label: 'endorsements', value: stats.endorsements },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="font-display text-xl font-semibold">{item.value}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
                <Reactions contentType="profile" contentId={profile.id} compact />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------------- nav -- */}
      {sections.length > 0 && (
        <div className="sticky top-[68px] z-30 border-y border-white/[0.07] bg-[hsl(240_30%_4%/.72)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-6 py-3 scrollbar-none">
            {sections.map((section: any) => {
              const id = `section-${section.type}-${section.id}`;
              const active = activeSection === id;
              return (
                <a
                  key={section.id}
                  href={`#${id}`}
                  className={`relative whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="portfolio-nav"
                      className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.07]"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative">{section.title || SECTION_LABELS[section.type] || section.type}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- sections -- */}
      <div className="mx-auto max-w-6xl px-6 py-20">
        {sections.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title={isOwner ? 'Your portfolio structure is empty' : 'This portfolio is still being composed'}
            description={
              isOwner
                ? 'Open the studio to switch sections on and order your story.'
                : 'Check back soon — the author is assembling their sections.'
            }
            action={isOwner ? <Link to="/sections"><GlowButton>Open studio</GlowButton></Link> : undefined}
          />
        )}

        <div className="space-y-24">
          {sections.map((section: any) => (
            <section key={section.id} id={`section-${section.type}-${section.id}`} className="scroll-mt-32">
              {section.type === 'about' && (
                <AboutSection section={section} profile={profile} stats={stats} />
              )}
              {section.type === 'projects' && <ProjectsSection projects={projects} username={profile.username} />}
              {section.type === 'skills' && (
                <SkillsSection skills={skills} isOwner={isOwner} viewerId={user?.id} />
              )}
              {section.type === 'experience' && <ExperienceSection experiences={experiences} />}
              {section.type === 'education' && <EducationSection education={education} />}
              {section.type === 'blog' && <WritingSection posts={posts} />}
              {section.type === 'contact' && (
                <ContactSection profile={profile} section={section} isOwner={isOwner} />
              )}
              {section.type === 'custom' && (
                <CustomSection section={section} />
              )}
            </section>
          ))}

          {(testimonials.length > 0 || !isOwner) && (
            <section className="scroll-mt-32">
              <SectionHeading
                eyebrow="Testimonials"
                title="What collaborators say"
                action={
                  !isOwner ? (
                    <TestimonialForm targetUserId={profile.id} targetName={profile.full_name || profile.username} />
                  ) : undefined
                }
              />
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial: any) => (
                  <Panel key={testimonial.id} className="p-6">
                    <Star className="h-4 w-4 text-amber-300" />
                    <p className="mt-4 text-sm leading-relaxed text-foreground/85">“{testimonial.text}”</p>
                    <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={testimonial.author_avatar ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(testimonial.author_name || 'A').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">{testimonial.author_name || testimonial.author_full_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {[testimonial.author_title, testimonial.company].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                  </Panel>
                ))}
                {testimonials.length === 0 && !isOwner && (
                  <Panel className="p-8 md:col-span-2 lg:col-span-3">
                    <p className="text-sm text-muted-foreground">
                      No testimonials yet. If you have worked with {profile.full_name || profile.username}, be the
                      first to vouch for them — recommendations are reviewed before they appear.
                    </p>
                  </Panel>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ------------------------------------------------------------------ pieces -- */

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <Reveal mode="blur" className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="display-md">{title}</h2>
      </div>
      {action}
    </Reveal>
  );
}

function AboutSection({ section, profile, stats }: { section: any; profile: any; stats: any }) {
  const body = section.content?.body || section.content?.text || profile.long_bio || profile.bio;
  return (
    <div>
      <SectionHeading eyebrow="About" title={section.title || 'The short version'} />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <Reveal mode="blur">
          <div className="prose-cinematic whitespace-pre-wrap">{body || 'This developer has not written an introduction yet.'}</div>
        </Reveal>
        <Reveal mode="right" delay={0.15}>
          <Panel className="p-6">
            <p className="eyebrow mb-4">At a glance</p>
            <dl className="space-y-4 text-sm">
              {[
                { label: 'Based in', value: profile.location || 'Remote' },
                { label: 'Time zone', value: profile.timezone || '—' },
                { label: 'Availability', value: profile.availability || 'Not specified' },
                { label: 'Profile views', value: stats.views?.toLocaleString() ?? '0' },
                { label: 'Reactions', value: stats.reactions?.toLocaleString() ?? '0' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </Reveal>
      </div>
    </div>
  );
}

function ProjectsSection({ projects, username }: { projects: any[]; username: string }) {
  return (
    <div>
      <SectionHeading eyebrow="Selected work" title="Projects" />
      {projects.length === 0 ? (
        <EmptyState className="mt-10" icon={Zap} title="No public projects yet" />
      ) : (
        <RevealGroup className="mt-10 grid gap-5 md:grid-cols-2" stagger={0.08}>
          {projects.map((project: any) => (
            <RevealItem key={project.id}>
              <TiltCard intensity={5}>
                <article className="panel group h-full overflow-hidden">
                  {project.image_url ? (
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-cinematic group-hover:scale-[1.06]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240_30%_4%)] via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="h-32 bg-[radial-gradient(80%_120%_at_20%_0%,hsl(var(--violet)/.28),transparent_60%)]" />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-lg font-semibold tracking-tight">{project.title}</h3>
                      {project.featured && <Tag tone="warm">featured</Tag>}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(project.tags ?? []).slice(0, 5).map((tag: string) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>★ {project.stars ?? 0}</span>
                        <span>⑂ {project.forks ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {project.repo_url && (
                          <a
                            href={project.repo_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        {project.demo_url && (
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                          >
                            Live <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <Link
                          to={`/${username}#projects`}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                    <Reactions contentType="project" contentId={project.id} compact className="mt-4" />
                  </div>
                </article>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}

function SkillsSection({
  skills,
  isOwner,
  viewerId,
}: {
  skills: any[];
  isOwner: boolean;
  viewerId?: string | null;
}) {
  return (
    <div>
      <SectionHeading
        eyebrow="Capabilities"
        title="Skills & technologies"
        action={
          isOwner ? (
            <Link to="/skills">
              <GhostButton>Manage skills</GhostButton>
            </Link>
          ) : undefined
        }
      />
      {skills.length === 0 ? (
        <EmptyState className="mt-10" icon={Zap} title="No skills listed yet" />
      ) : (
        <RevealGroup className="mt-10 grid gap-4 md:grid-cols-2" stagger={0.06}>
          {skills.map((skill: any) => (
            <RevealItem key={skill.id}>
              <div className="panel group p-5 transition-colors duration-500 hover:border-white/15">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{skill.name}</p>
                  <Tag>{skill.category || 'skill'}</Tag>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))]"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.proficiency ?? 0}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span className="mono">{skill.proficiency}%</span>
                  {isOwner || viewerId === undefined ? (
                    <span>{skill.endorsed ?? 0} endorsements</span>
                  ) : (
                    <EndorseButton skillId={skill.id} initialCount={skill.endorsed ?? 0} />
                  )}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}

function ExperienceSection({ experiences }: { experiences: any[] }) {
  return (
    <div>
      <SectionHeading eyebrow="Track record" title="Experience" />
      {experiences.length === 0 ? (
        <EmptyState className="mt-10" icon={Briefcase} title="No experience added yet" />
      ) : (
        <div className="mt-12 space-y-8">
          {experiences.map((experience: any, index: number) => (
            <Reveal key={experience.id} mode="left" delay={index * 0.05}>
              <div className="relative grid gap-6 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-6 md:grid-cols-[180px_1fr]">
                <div>
                  <p className="mono text-xs text-primary">
                    {experience.start_date?.slice(0, 7)} — {experience.end_date?.slice(0, 7) ?? 'present'}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {experience.employment || 'Full-time'}
                  </p>
                  {experience.location && <p className="mt-1 text-xs text-muted-foreground">{experience.location}</p>}
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight">{experience.position}</h3>
                  <p className="mt-1 text-sm text-secondary">
                    {experience.company_url ? (
                      <a href={experience.company_url} target="_blank" rel="noreferrer noopener" className="hover:underline">
                        {experience.company}
                      </a>
                    ) : (
                      experience.company
                    )}
                  </p>
                  {experience.description && (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {experience.description}
                    </p>
                  )}
                  {(experience.technologies ?? []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {experience.technologies.map((tech: string) => (
                        <Tag key={tech}>{tech}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function EducationSection({ education }: { education: any[] }) {
  return (
    <div>
      <SectionHeading eyebrow="Foundations" title="Education" />
      {education.length === 0 ? (
        <EmptyState className="mt-10" icon={GraduationCap} title="No education added yet" />
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {education.map((entry: any) => (
            <Reveal key={entry.id} mode="rise">
              <Panel className="p-6">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h3 className="mt-4 font-display text-lg font-semibold">{entry.degree}</h3>
                <p className="text-sm text-secondary">{entry.institution}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {entry.start_date?.slice(0, 4)} — {entry.end_date?.slice(0, 4) ?? 'present'}
                  {entry.field ? ` · ${entry.field}` : ''}
                </p>
                {entry.description && (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
                )}
              </Panel>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function WritingSection({ posts }: { posts: any[] }) {
  return (
    <div>
      <SectionHeading eyebrow="Writing" title="Notes & case studies" />
      {posts.length === 0 ? (
        <EmptyState className="mt-10" icon={BookOpen} title="Nothing published yet" />
      ) : (
        <div className="mt-10 divide-y divide-white/[0.07]">
          {posts.map((post: any) => (
            <Reveal key={post.id} mode="rise">
              <Link
                to={`/blog/${post.slug}`}
                className="group grid gap-4 py-7 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {post.category || 'article'} · {post.reading_time ?? 5} min read
                  </p>
                  <h3 className="mt-3 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(post.publish_date || post.created_at).toLocaleDateString()}</span>
                  <ExternalLink className="h-4 w-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactSection({ profile, section, isOwner }: { profile: any; section: any; isOwner: boolean }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const reduceMotion = useReducedMotion();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    const { error } = await api.post('/api/contact', {
      ...form,
      recipient: profile.username || profile.id,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('Message sent — they will see it in their inbox');
  };

  return (
    <div>
      <SectionHeading eyebrow="Contact" title={section.title || 'Start a conversation'} />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Reveal mode="left">
          <Panel className="h-full p-7">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.content?.note ||
                'Interested in working together, hiring, or just talking shop? Send a message and it lands straight in the inbox.'}
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {profile.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" /> {profile.email}
                </p>
              )}
              {profile.location && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" /> {profile.location}
                </p>
              )}
              {profile.availability && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-emerald-400" /> {profile.availability}
                </p>
              )}
            </div>
            <motion.div
              className="relative mt-8 h-32 overflow-hidden rounded-2xl border border-white/10"
              animate={reduceMotion ? undefined : { backgroundPosition: ['0% 0%', '100% 100%'] }}
              transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                background:
                  'radial-gradient(60% 90% at 20% 30%, hsl(var(--violet)/.35), transparent 60%), radial-gradient(50% 80% at 80% 70%, hsl(var(--cyan)/.3), transparent 60%)',
                backgroundSize: '180% 180%',
              }}
            />
          </Panel>
        </Reveal>

        <Reveal mode="right" delay={0.1}>
          {isOwner ? (
            <Panel className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="font-display text-lg font-semibold">This is your contact section</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Visitors will see a form here that delivers straight to your inbox. Test it from another account, or
                check <Link to="/messages" className="text-primary underline-offset-4 hover:underline">your messages</Link>.
              </p>
            </Panel>
          ) : sent ? (
            <Panel className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10"
              >
                <Check className="h-6 w-6 text-emerald-300" />
              </motion.span>
              <p className="font-display text-xl font-semibold">Message delivered</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Thanks for reaching out — expect a reply at {form.email}.
              </p>
            </Panel>
          ) : (
            <form onSubmit={submit} className="panel space-y-4 p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Your name"
                  className={fieldClasses()}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                <input
                  required
                  type="email"
                  placeholder="you@company.dev"
                  className={fieldClasses()}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <input
                required
                placeholder="Subject"
                className={fieldClasses()}
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              />
              <textarea
                required
                rows={5}
                minLength={10}
                placeholder="Tell them about the project, role or idea…"
                className={fieldClasses('h-auto py-3')}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
              />
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={(form as any).honeypot ?? ''}
                onChange={(event) => setForm({ ...form, honeypot: event.target.value } as any)}
                className="pointer-events-none absolute h-0 w-0 opacity-0"
                aria-hidden
              />
              <GlowButton type="submit" disabled={sending} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send message
              </GlowButton>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
}

function CustomSection({ section }: { section: any }) {
  const body = section.content?.body || section.content?.text || '';
  const items: any[] = Array.isArray(section.content?.items) ? section.content.items : [];
  return (
    <div>
      <SectionHeading eyebrow="More" title={section.title || 'Highlights'} />
      {section.subtitle && <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{section.subtitle}</p>}
      {body && <div className="prose-cinematic mt-8 whitespace-pre-wrap">{body}</div>}
      {items.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <Panel key={index} className="p-5">
              <p className="font-display text-base font-semibold">{item.title}</p>
              {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
              {item.year && <p className="mono mt-3 text-[10px] text-primary">{item.year}</p>}
            </Panel>
          ))}
        </div>
      )}
      {!body && items.length === 0 && (
        <EmptyState className="mt-10" icon={Sparkles} title="Nothing here yet" />
      )}
    </div>
  );
}
