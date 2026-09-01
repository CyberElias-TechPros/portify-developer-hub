import { Link } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserBlogPosts } from "@/hooks/useUserContent";

export default function BlogPosts({ userId }: { userId: string }) {
  const { blogPosts, loading, error } = useUserBlogPosts(userId);
  if (loading) {
    return <section id="articles" className="w-full bg-muted/30 px-6 py-16 md:px-12 lg:px-24"><div className="mx-auto max-w-7xl text-center"><h2 className="text-3xl font-bold md:text-4xl">Articles</h2><p className="mt-4 text-muted-foreground">Loading articles…</p></div></section>;
  }
  if (error) {
    return <section id="articles" className="w-full bg-muted/30 px-6 py-16 md:px-12 lg:px-24"><div className="mx-auto max-w-7xl text-center"><h2 className="text-3xl font-bold md:text-4xl">Articles</h2><p className="mt-4 text-muted-foreground">Articles are temporarily unavailable.</p></div></section>;
  }
  if (!blogPosts.length) return null;
  return <section id="articles" className="w-full bg-muted/30 px-6 py-16 md:px-12 lg:px-24"><div className="mx-auto max-w-7xl"><div className="mb-10 text-center"><h2 className="text-3xl font-bold md:text-4xl">Articles</h2><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Ideas, lessons, and notes from this portfolio owner.</p></div><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{blogPosts.slice(0, 6).map((post) => <Card key={post.id} className="flex h-full flex-col"><CardHeader><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{new Date(post.publishDate).toLocaleDateString()}</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{post.readingTime || 1} min read</span>{post.category && <Badge variant="secondary">{post.category}</Badge>}</div><CardTitle className="mt-3 text-xl"><Link to={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link></CardTitle></CardHeader><CardContent className="flex flex-1 flex-col"><p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{post.excerpt}</p><Link to={`/blog/${post.slug}`} className="mt-auto pt-5 text-sm font-medium text-primary hover:underline">Read article</Link></CardContent></Card>)}</div>{blogPosts.length > 6 && <div className="mt-8 text-center"><Link to="/blog" className="font-medium text-primary hover:underline">View all articles</Link></div>}</div></section>;
}
