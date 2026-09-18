import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { api } from '@/lib/api/client';
import { Reveal } from '@/components/experience/Reveal';

interface Testimonial {
  id: string;
  text?: string | null;
  content?: string | null;
  author_name?: string | null;
  author_title?: string | null;
  company?: string | null;
  rating?: number | null;
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<Testimonial[]>('/api/db/testimonials?f.approved=eq.1&limit=9&order=created_at.desc')
      .then(({ data }) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <Reveal mode="blur" className="mb-14 max-w-2xl">
        <p className="eyebrow mb-4">Kind words</p>
        <h2 className="display-lg">
          Trusted by people who <span className="text-gradient-warm">ship.</span>
        </h2>
      </Reveal>

      <div className="grid gap-5 md:grid-cols-3">
        {(loading ? Array.from({ length: 3 }) : items.slice(0, 6)).map((item: any, index) =>
          loading ? (
            <div key={index} className="panel h-52 animate-pulse" />
          ) : (
            <Reveal
              key={item.id}
              mode="rise"
              delay={index * 0.06}
              className={index % 3 === 1 ? 'md:mt-8' : ''}
            >
              <figure className="panel relative h-full p-7">
                <Quote className="h-5 w-5 text-primary/70" />
                <blockquote className="mt-5 text-sm leading-relaxed text-foreground/85">
                  “{item.text || item.content || 'A portfolio that finally feels like the work behind it.'}”
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-display text-sm font-semibold">{item.author_name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[item.author_title, item.company].filter(Boolean).join(' · ') || 'Portify member'}
                  </p>
                </figcaption>
                {typeof item.rating === 'number' && item.rating > 0 && (
                  <div className="absolute right-6 top-6 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <span
                        key={starIndex}
                        className={`h-1.5 w-1.5 rounded-full ${
                          starIndex < item.rating ? 'bg-amber-300' : 'bg-white/15'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </figure>
            </Reveal>
          )
        )}
      </div>
    </section>
  );
}
