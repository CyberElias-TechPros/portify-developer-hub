import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Reorder, motion } from 'framer-motion';
import {
  BookOpen,
  Briefcase,
  Eye,
  EyeOff,
  GripVertical,
  GraduationCap,
  HelpCircle,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { GhostButton, GlowButton, PageHeader, Panel, Tag, fieldClasses } from '@/components/ui-kit';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { api, db } from '@/lib/api/client';

interface SectionRow {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  content: any;
  visible: boolean | number;
  position_order: number;
}

const TYPE_META: Record<string, { icon: any; label: string; hint: string }> = {
  about: { icon: User, label: 'About', hint: 'Your narrative, pulled from the long bio unless overridden.' },
  projects: { icon: Layers, label: 'Projects', hint: 'Everything you have published, featured first.' },
  skills: { icon: Wrench, label: 'Skills', hint: 'Animated proficiency meters with endorsements.' },
  experience: { icon: Briefcase, label: 'Experience', hint: 'Your roles, newest first.' },
  education: { icon: GraduationCap, label: 'Education', hint: 'Degrees, bootcamps, certifications.' },
  blog: { icon: BookOpen, label: 'Writing', hint: 'Published articles with reading times.' },
  contact: { icon: Mail, label: 'Contact', hint: 'The form that delivers to your inbox.' },
  custom: { icon: Sparkles, label: 'Custom', hint: 'Anything else — awards, talks, side quests.' },
};

const AVAILABLE_TYPES = ['custom', 'about', 'projects', 'skills', 'experience', 'education', 'blog', 'contact'];

export default function PortfolioSections() {
  const { user, profile } = useAuth();
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ type: 'custom', title: '', subtitle: '', body: '' });

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get<SectionRow[]>(
      `/api/db/portfolio_sections?f.user_id=eq.${user.id}&order=position_order.asc&limit=50`
    );
    setSections(
      (Array.isArray(data) ? data : []).map((row) => ({
        ...row,
        visible: Boolean(row.visible),
        content: typeof row.content === 'string' ? safeParse(row.content) : row.content ?? {},
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistOrder = async (next: SectionRow[]) => {
    setSavingOrder(true);
    await Promise.all(
      next.map((section, index) =>
        section.position_order === index
          ? Promise.resolve()
          : db.from('portfolio_sections').update({ position_order: index }).eq('id', section.id)
      )
    );
    setSavingOrder(false);
  };

  const handleReorder = (next: SectionRow[]) => {
    setSections(next);
    void persistOrder(next);
  };

  const toggleVisible = async (section: SectionRow) => {
    const next = !section.visible;
    setSections((current) => current.map((item) => (item.id === section.id ? { ...item, visible: next } : item)));
    const { error } = await db
      .from('portfolio_sections')
      .update({ visible: next ? 1 : 0 })
      .eq('id', section.id);
    if (error) {
      toast.error(error.message);
      setSections((current) => current.map((item) => (item.id === section.id ? { ...item, visible: !next } : item)));
      return;
    }
    toast.success(next ? 'Section shown on your portfolio' : 'Section hidden');
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Give the section a title');
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      type: form.type,
      content: JSON.stringify({
        ...(editing?.content ?? {}),
        ...(form.body ? { body: form.body } : {}),
      }),
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await db.from('portfolio_sections').update(payload).eq('id', editing.id)
      : await db.from('portfolio_sections').insert({
          ...payload,
          user_id: user!.id,
          visible: 1,
          position_order: sections.length,
        });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Section updated' : 'Section added');
    setEditing(null);
    setCreating(false);
    void load();
  };

  const remove = async (section: SectionRow) => {
    const { error } = await db.from('portfolio_sections').delete().eq('id', section.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSections((current) => current.filter((item) => item.id !== section.id));
    toast.success('Section removed');
  };

  const addType = async (type: string) => {
    const meta = TYPE_META[type] ?? TYPE_META.custom;
    const { error } = await db.from('portfolio_sections').insert({
      user_id: user!.id,
      type,
      title: meta.label,
      visible: 1,
      position_order: sections.length,
      content: '{}',
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${meta.label} section added`);
    void load();
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-24">
          <PageHeader
            eyebrow="Portfolio studio"
            title="Sign in to compose your portfolio"
            description="Order, rename and switch sections on or off — the public page updates instantly."
            actions={
              <Link to="/auth">
                <GlowButton>Sign in</GlowButton>
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const usedTypes = new Set(sections.map((section) => section.type));

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <PageHeader
          eyebrow="Portfolio studio"
          title={
            <>
              Compose the <span className="text-gradient">narrative.</span>
            </>
          }
          description="Drag to reorder, rename anything, and switch sections off when they do not earn their place."
          actions={
            <>
              {profile?.username && (
                <Link to={`/${profile.username}`} target="_blank">
                  <GhostButton>Preview live</GhostButton>
                </Link>
              )}
              <GlowButton
                onClick={() => {
                  setEditing(null);
                  setForm({ type: 'custom', title: '', subtitle: '', body: '' });
                  setCreating(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add section
              </GlowButton>
            </>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.02]" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <Panel className="p-10 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-4 font-display text-xl font-semibold">Your portfolio has no structure yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Add the sections you want visitors to walk through, then drag them into the order that tells your story.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {AVAILABLE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => void addType(type)}
                  className="rounded-full border border-white/12 px-4 py-2 text-xs capitalize transition-colors hover:border-primary/50"
                >
                  + {TYPE_META[type]?.label ?? type}
                </button>
              ))}
            </div>
          </Panel>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{sections.filter((section) => section.visible).length} visible · {sections.length} total</span>
              <span className="flex items-center gap-2">
                {savingOrder && <Loader2 className="h-3 w-3 animate-spin" />}
                {savingOrder ? 'Saving order…' : 'Order saved'}
              </span>
            </div>

            <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-3">
              {sections.map((section) => {
                const meta = TYPE_META[section.type] ?? TYPE_META.custom;
                const Icon = meta.icon;
                return (
                  <Reorder.Item
                    key={section.id}
                    value={section}
                    whileDrag={{ scale: 1.02, boxShadow: '0 30px 80px -40px hsl(var(--violet) / 0.9)' }}
                    className={`group panel relative flex items-center gap-4 p-5 ${
                      section.visible ? '' : 'opacity-55'
                    }`}
                  >
                    <span className="cursor-grab text-muted-foreground transition-colors active:cursor-grabbing hover:text-foreground">
                      <GripVertical className="h-5 w-5" />
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base font-semibold">{section.title}</p>
                        <Tag>{meta.label}</Tag>
                        {!section.visible && <Tag tone="warm">hidden</Tag>}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {section.subtitle || meta.hint}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void toggleVisible(section)}
                        title={section.visible ? 'Hide section' : 'Show section'}
                        className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(section);
                          setForm({
                            type: section.type,
                            title: section.title,
                            subtitle: section.subtitle ?? '',
                            body: section.content?.body ?? section.content?.text ?? '',
                          });
                          setCreating(true);
                        }}
                        className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {section.type === 'custom' && (
                        <button
                          onClick={() => void remove(section)}
                          className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            <div className="mt-10">
              <p className="eyebrow mb-4">Add a section</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TYPES.filter((type) => !usedTypes.has(type) || type === 'custom').map((type) => (
                  <button
                    key={type}
                    onClick={() => void addType(type)}
                    className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs capitalize transition-colors hover:border-primary/50"
                  >
                    <Plus className="h-3 w-3" />
                    {TYPE_META[type]?.label ?? type}
                  </button>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 grid gap-4 sm:grid-cols-3"
            >
              {[
                { icon: MessageSquare, title: 'Order matters', body: 'Lead with the section that makes the strongest first impression.' },
                { icon: HelpCircle, title: 'Cut ruthlessly', body: 'Hide anything that does not earn its place — whitespace is credibility.' },
                { icon: Sparkles, title: 'Custom sections', body: 'Awards, talks, community work — custom sections accept free text and item lists.' },
              ].map((tip) => (
                <Panel key={tip.title} className="p-5">
                  <tip.icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 text-sm font-medium">{tip.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
                </Panel>
              ))}
            </motion.div>
          </>
        )}
      </div>

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="border-white/10 bg-[hsl(240_28%_6%)]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? `Edit ${editing.title}` : 'Add a section'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Custom copy overrides the defaults for this section only.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveEdit} className="mt-4 space-y-4">
            {!editing && (
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Section type</span>
                <select
                  className={fieldClasses()}
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                  {AVAILABLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_META[type]?.label ?? type}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Title</span>
              <input
                className={fieldClasses()}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Awards & certifications"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Subtitle (optional)</span>
              <input
                className={fieldClasses()}
                value={form.subtitle}
                onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">
                Custom copy (optional — shown in place of the default)
              </span>
              <textarea
                rows={4}
                className={fieldClasses('h-auto py-3')}
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
              />
            </label>
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <GhostButton type="button" onClick={() => setCreating(false)}>
                Cancel
              </GhostButton>
              <GlowButton type="submit">{editing ? 'Save section' : 'Add section'}</GlowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
