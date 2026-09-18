import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Quote, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GhostButton, GlowButton, fieldClasses } from '@/components/ui-kit';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Lets a signed-in visitor write a testimonial for another developer. It lands
 * unapproved so the owner can moderate before it appears publicly.
 */
export default function TestimonialForm({
  targetUserId,
  targetName,
  trigger,
}: {
  targetUserId: string;
  targetName?: string;
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ text: '', company: '', rating: 5 });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.text.trim().length < 20) {
      toast.error('A testimonial needs at least 20 characters to be useful');
      return;
    }
    setSaving(true);
    const { error } = await api.post('/api/db/testimonials', {
      rows: {
        user_id: targetUserId,
        author_id: user!.id,
        author_name: profile?.full_name || profile?.username || user!.email,
        author_title: profile?.title ?? null,
        company: form.company.trim() || null,
        text: form.text.trim(),
        rating: form.rating,
        approved: 0,
      },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Thank you — it goes live once they approve it');
    setForm({ text: '', company: '', rating: 5 });
    setOpen(false);
  };

  const openDialog = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      {trigger ? (
        trigger(openDialog)
      ) : (
        <GhostButton onClick={openDialog}>
          <Quote className="h-4 w-4" /> Leave a testimonial
        </GhostButton>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[hsl(240_28%_6%)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Recommend {targetName || 'this developer'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Specific beats flattering. Name what they delivered and the impact it had.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs text-muted-foreground">Your testimonial</span>
              <textarea
                rows={5}
                className={fieldClasses('h-auto py-3')}
                placeholder="They rebuilt our design system in six weeks and cut UI bugs by half…"
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs text-muted-foreground">Company / context (optional)</span>
                <input
                  className={fieldClasses()}
                  placeholder="Northwind Labs"
                  value={form.company}
                  onChange={(event) => setForm({ ...form, company: event.target.value })}
                />
              </label>
              <div>
                <span className="mb-2 block text-xs text-muted-foreground">Rating</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, rating: value })}
                      className={`h-9 w-9 rounded-xl border text-xs transition-colors ${
                        form.rating >= value
                          ? 'border-amber-300/40 bg-amber-300/10 text-amber-200'
                          : 'border-white/10 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <GhostButton type="button" onClick={() => setOpen(false)}>
                Cancel
              </GhostButton>
              <GlowButton type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit testimonial
              </GlowButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
