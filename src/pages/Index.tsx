import Layout from '@/components/Layout';
import Hero from '@/components/home/Hero';
import Marquee from '@/components/home/Marquee';
import Features from '@/components/home/Features';
import Workflow from '@/components/home/Workflow';
import Showcase from '@/components/home/Showcase';
import StatsBand from '@/components/home/StatsBand';
import Testimonials from '@/components/home/Testimonials';
import CtaFinale from '@/components/home/CtaFinale';

export default function Index() {
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
