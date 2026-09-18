import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Compass,
  FileText,
  Github,
  HelpCircle,
  LifeBuoy,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { GlowButton, PageHeader, Panel, SectionLabel, Tag } from '@/components/ui-kit';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Reveal, RevealGroup, RevealItem } from '@/components/experience/Reveal';
import usePageMeta from '@/hooks/usePageMeta';

const GUIDES = [
  {
    icon: Rocket,
    title: 'Publish your first portfolio',
    body: 'Claim a handle, add two projects, switch on the sections you want, then share the link.',
    to: '/sections',
    cta: 'Open the studio',
  },
  {
    icon: Github,
    title: 'Import from GitHub',
    body: 'Pull repositories in as projects with stars, forks, languages and topics already filled in.',
    to: '/projects',
    cta: 'Import projects',
  },
  {
    icon: Palette,
    title: 'Tune the theme',
    body: 'Shift accent colours, radius and motion intensity — everything responds in real time.',
    to: '/theme',
    cta: 'Open theme studio',
  },
  {
    icon: FileText,
    title: 'Generate your résumé',
    body: 'Your résumé is built from the same records as your portfolio. Export data or print to PDF.',
    to: '/resume',
    cta: 'Build résumé',
  },
  {
    icon: Users,
    title: 'Grow in the community',
    body: 'Follow developers, react to their work, leave comments and endorse skills you have seen delivered.',
    to: '/community',
    cta: 'Visit community',
  },
  {
    icon: ShieldCheck,
    title: 'Account & privacy',
    body: 'Control visibility, export everything you have created, or delete your account permanently.',
    to: '/profile',
    cta: 'Account settings',
  },
];

const FAQS = [
  {
    q: 'How do handles work?',
    a: 'Your handle is unique across Portify and forms your public URL — portify.dev/your-handle. You can change it any time from your profile; old links stop resolving, so share the new one.',
  },
  {
    q: 'Can I keep my portfolio private?',
    a: 'Yes. Profiles default to public, but a single toggle in your profile makes the whole portfolio visible only to you and administrators. Individual projects and articles can also be kept private.',
  },
  {
    q: 'Where is my data stored?',
    a: 'Everything lives in a Cloudflare D1 database behind a Workers API. Uploads go to R2 with an inline fallback for small files. You can export a full JSON copy from your profile at any time.',
  },
  {
    q: 'Why do some images fail to upload?',
    a: 'Uploads are limited to 6 MB and to PNG, JPEG, WebP, GIF, AVIF, SVG or PDF. Large files need the media bucket configured; smaller files are stored inline automatically.',
  },
  {
    q: 'How do endorsements work?',
    a: 'Anyone signed in can endorse a skill on your profile once. The count on your skill meters is a signal of external validation, not self-reported proficiency.',
  },
  {
    q: 'Something is broken — how do I report it?',
    a: 'Use the contact form with as much detail as you can: what you expected, what happened, and any error text. Messages land in an admin inbox immediately.',
  },
];

export default function Help() {
  usePageMeta({ title: 'Help centre · Portify', description: 'Short guides for every core flow, plus the questions that come up most often.', path: '/help' });

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 pb-24">
        <PageHeader
          eyebrow="Help centre"
          title={
            <>
              Everything you need to <span className="text-gradient">go live.</span>
            </>
          }
          description="Short guides for every core flow, plus answers to the questions that come up most often."
          actions={
            <Link to="/contact">
              <GlowButton>
                <LifeBuoy className="h-4 w-4" /> Contact support
              </GlowButton>
            </Link>
          }
        />

        <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {GUIDES.map((guide) => (
            <RevealItem key={guide.title}>
              <Panel interactive className="group flex h-full flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                  <guide.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{guide.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{guide.body}</p>
                <Link
                  to={guide.to}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  {guide.cta}
                  <motion.span
                    aria-hidden
                    className="inline-block"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    →
                  </motion.span>
                </Link>
              </Panel>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-20 grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow mb-4">FAQ</p>
            <h2 className="display-md">Asked often</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Still stuck? The contact form reaches a real inbox — include your handle so the reply arrives faster.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Tag>edge API</Tag>
              <Tag tone="primary">d1</Tag>
              <Tag tone="secondary">r2 media</Tag>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} className="border-white/10">
                <AccordionTrigger className="text-left font-display text-base hover:text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <section className="mt-20 grid gap-5 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Status', body: 'Health checks cover the database, media bucket and asset pipeline.' , hint: '/api/health'},
            { icon: BookOpen, title: 'API surface', body: 'Every screen is powered by documented REST endpoints under /api.', hint: 'REST + JSON' },
            { icon: Compass, title: 'Community', body: 'Guidelines live in the community feed — be specific and kind.', hint: '/community' },
          ].map((card, index) => (
            <Reveal key={card.title} mode="rise" delay={index * 0.07}>
              <Panel className="h-full p-6">
                <SectionLabel className="mb-3">{card.hint}</SectionLabel>
                <card.icon className="h-4 w-4 text-primary" />
                <p className="mt-3 font-display text-base font-semibold">{card.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.body}</p>
              </Panel>
            </Reveal>
          ))}
        </section>
      </div>
    </Layout>
  );
}
