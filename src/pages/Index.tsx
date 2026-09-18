import Layout from '@/components/Layout';
import Hero from '@/components/home/Hero';
import Marquee from '@/components/home/Marquee';
import Features from '@/components/home/Features';
import Workflow from '@/components/home/Workflow';
import Showcase from '@/components/home/Showcase';
import StatsBand from '@/components/home/StatsBand';
import Testimonials from '@/components/home/Testimonials';
import CtaFinale from '@/components/home/CtaFinale';
import usePageMeta from '@/hooks/usePageMeta';

export default function Index() {
  usePageMeta({ title: 'Portify — build a portfolio that moves people', description: 'A cinematic portfolio platform for developers: projects, writing, skills and analytics, all on Cloudflare.', path: '/' });

  return (
    <Layout>
      <Hero />
      <Marquee />
      <Features />
      <Workflow />
      <StatsBand />
      <Showcase />
      <Testimonials />
      <CtaFinale />
    </Layout>
  );
}
