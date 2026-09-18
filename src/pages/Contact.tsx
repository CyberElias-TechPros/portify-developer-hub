import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Check,
  Clock,
  Github,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Twitter,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { GlowButton, PageHeader, Panel, SectionLabel, fieldClasses } from '@/components/ui-kit';
import { Reveal } from '@/components/experience/Reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { api } from '@/lib/api/client';

interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  hours?: string;
  calendly?: string;
}

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
}

const FAQS = [
  {
    question: 'How quickly will I hear back?',
    answer:
      'Messages land in the inbox the moment they are sent. Most replies go out within one working day — if it is urgent, mention a deadline in the subject.',
  },
  {
    question: 'Do you take on freelance or contract work?',
    answer:
      'Availability is listed on the portfolio itself. If the badge says available, send the scope, timeline and rough budget and you will get a straight answer.',
  },
  {
    question: 'Can I hire through Portify instead of emailing?',
    answer:
      'Yes — every portfolio has its own contact form. Messages are stored against your account so nothing gets lost in a personal inbox.',
  },
  {
    question: 'Is my message private?',
    answer:
      'Contact messages are visible only to the recipient and platform administrators. They are never posted publicly and you can ask for deletion at any time.',
  },
];

export default function Contact() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    budget: '',
    subject: '',
    message: '',
    honeypot: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void api.get<{ value: ContactInfo }>('/api/site/settings/contact_info').then(({ data }) => setContactInfo(data?.value ?? null));
    void api.get<{ value: SocialLinks }>('/api/site/settings/social_links').then(({ data }) => setSocialLinks(data?.value ?? null));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.honeypot) return; // silent spam trap
    if (form.message.trim().length < 10) {
      toast.error('Tell us a little more — at least 10 characters');
      return;
    }
    setSending(true);
    const { error } = await api.post('/api/contact', {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim() || undefined,
      budget: form.budget.trim() || undefined,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('Message sent');
  };

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Contact"
          title={
            <>
              Let&rsquo;s make something <span className="text-gradient">worth showing.</span>
            </>
          }
          description="Collaborations, contract work, speaking, or just a good technical conversation — the inbox is open."
        />

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <Reveal mode="left">
            {sent ? (
              <Panel className="flex h-full flex-col items-center justify-center gap-5 p-16 text-center">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10"
                >
                  <Check className="h-7 w-7 text-emerald-300" />
                </motion.span>
                <h2 className="font-display text-2xl font-semibold">Message received</h2>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  Thanks {form.name.split(' ')[0]} — your message is in the inbox. Expect a reply at{' '}
                  <span className="text-foreground">{form.email}</span> soon.
                </p>
                <button
                  onClick={() => {
                    setSent(false);
                    setForm({ name: '', email: '', company: '', budget: '', subject: '', message: '', honeypot: '' });
                  }}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Send another message
                </button>
              </Panel>
            ) : (
              <form onSubmit={submit} className="panel space-y-5 p-8">
                <SectionLabel>Send a message</SectionLabel>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs text-muted-foreground">Your name</span>
                    <input
                      required
                      minLength={2}
                      className={fieldClasses()}
                      placeholder="Ada Lovelace"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs text-muted-foreground">Email</span>
                    <input
                      required
                      type="email"
                      className={fieldClasses()}
                      placeholder="ada@company.dev"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> Company (optional)
                    </span>
                    <input
                      className={fieldClasses()}
                      value={form.company}
                      onChange={(event) => setForm({ ...form, company: event.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs text-muted-foreground">Budget range (optional)</span>
                    <select
                      className={fieldClasses()}
                      value={form.budget}
                      onChange={(event) => setForm({ ...form, budget: event.target.value })}
                    >
                      <option value="">Prefer not to say</option>
                      <option>Under $5k</option>
                      <option>$5k – $15k</option>
                      <option>$15k – $50k</option>
                      <option>$50k+</option>
                      <option>Full-time role</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Subject</span>
                  <input
                    required
                    minLength={3}
                    className={fieldClasses()}
                    placeholder="Contract role: design system lead"
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs text-muted-foreground">Message</span>
                  <textarea
                    required
                    rows={7}
                    minLength={10}
                    className={fieldClasses('h-auto py-3')}
                    placeholder="What are you building, when do you need it, and what does success look like?"
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                  />
                </label>

                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute h-0 w-0 opacity-0"
                  value={form.honeypot}
                  onChange={(event) => setForm({ ...form, honeypot: event.target.value })}
                />

                <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Typical reply: within one working day
                  </p>
                  <GlowButton type="submit" disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send message
                  </GlowButton>
                </div>
              </form>
            )}
          </Reveal>

          <div className="space-y-6">
            <Reveal mode="right">
              <Panel className="p-7">
                <SectionLabel>Direct lines</SectionLabel>
                <ul className="space-y-4 text-sm">
                  {contactInfo?.email && (
                    <li>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                          <Mail className="h-4 w-4" />
                        </span>
                        {contactInfo.email}
                      </a>
                    </li>
                  )}
                  {contactInfo?.phone && (
                    <li>
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                          <Phone className="h-4 w-4" />
                        </span>
                        {contactInfo.phone}
                      </a>
                    </li>
                  )}
                  {contactInfo?.address && (
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                        <MapPin className="h-4 w-4" />
                      </span>
                      {contactInfo.address}
                    </li>
                  )}
                  {contactInfo?.hours && (
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                        <Clock className="h-4 w-4" />
                      </span>
                      {contactInfo.hours}
                    </li>
                  )}
                </ul>

                <div className="mt-7 flex items-center gap-2">
                  {[
                    { icon: Github, href: socialLinks?.github, label: 'GitHub' },
                    { icon: Linkedin, href: socialLinks?.linkedin, label: 'LinkedIn' },
                    { icon: Twitter, href: socialLinks?.twitter, label: 'Twitter' },
                    { icon: Globe, href: socialLinks?.website, label: 'Website' },
                  ]
                    .filter((item) => item.href)
                    .map(({ icon: Icon, href, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={label}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                </div>
              </Panel>
            </Reveal>

            <Reveal mode="right" delay={0.1}>
              <Panel className="relative overflow-hidden p-7">
                <div className="pointer-events-none absolute inset-0 grid-overlay opacity-30" />
                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-secondary">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <p className="mt-4 font-display text-lg font-semibold">Prefer async?</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Every portfolio in the community has its own contact form and inbox. Pick the person whose work
                    matches what you need and message them directly.
                  </p>
                </div>
              </Panel>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-4">Questions</p>
            <h2 className="display-md">Before you hit send</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`} className="border-white/10">
                <AccordionTrigger className="text-left font-display text-base hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
