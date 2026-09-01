import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Loader2, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/api";
import type { BlogPost } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

function mapPost(post: DatabaseBlogPost): BlogPost {
  return {
    id: post.id,
    user_id: post.user_id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || post.title,
    slug: post.slug,
    publishDate: post.publish_date || post.created_at || new Date().toISOString(),
    tags: Array.isArray(post.tags) ? post.tags : [],
    coverImageUrl: post.cover_image_url || "/placeholder.svg",
    category: post.category,
    series: post.series,
    readingTime: post.reading_time || 1,
    published: post.published,
    is_public: post.is_public,
    created_at: post.created_at,
    updated_at: post.updated_at,
  };
}

type DatabaseBlogPost = {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string;
  publish_date: string | null;
  tags: string[] | null;
  cover_image_url: string | null;
  category: string | null;
  series: string | null;
  reading_time: number | null;
  published: boolean | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

const Blog = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const fetchBlogPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: requestError } = await supabase.from("blog_posts").select("*").eq("published", true).order("publish_date", { ascending: false });
    if (requestError) {
      setError("We couldn't load the articles. Please try again.");
      toast({ title: "Unable to load blog", description: requestError.message, variant: "destructive" });
    } else {
      setBlogPosts((data ?? []).map((post) => mapPost(post as DatabaseBlogPost)));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { void fetchBlogPosts(); }, [fetchBlogPosts, retryKey]);

  const allTags = useMemo(() => Array.from(new Set(blogPosts.flatMap((post) => post.tags))).sort(), [blogPosts]);
  const filteredPosts = useMemo(() => blogPosts.filter((post) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || post.title.toLowerCase().includes(query) || post.excerpt.toLowerCase().includes(query);
    return matchesSearch && (!selectedTag || post.tags.includes(selectedTag));
  }), [blogPosts, searchTerm, selectedTag]);

  if (loading) return <Layout><div className="min-h-[50vh] flex items-center justify-center" role="status"><Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading blog posts</span></div></Layout>;

  return (
    <Layout>
      <div className="w-full py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div><h1 className="text-4xl font-bold mb-2">Blog</h1><p className="text-muted-foreground max-w-2xl">Thoughts, tutorials, and insights on web development and technology.</p></div>
            <Button asChild><Link to="/blog/create">Write an article</Link></Button>
          </div>
          {error ? (
            <Card><CardContent className="py-12 text-center"><h2 className="text-xl font-semibold">Articles are temporarily unavailable</h2><p className="text-muted-foreground mt-2 mb-5">{error}</p><Button onClick={() => setRetryKey((key) => key + 1)}>Try again</Button></CardContent></Card>
          ) : (
            <>
              <div className="mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search posts" placeholder="Search posts…" className="pl-10" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
                <div className="flex flex-wrap gap-2"><Button variant={selectedTag === null ? "default" : "outline"} size="sm" onClick={() => setSelectedTag(null)}>All</Button>{allTags.map((tag) => <Button key={tag} variant={selectedTag === tag ? "default" : "outline"} size="sm" onClick={() => setSelectedTag(tag)}>{tag}</Button>)}</div>
              </div>
              {filteredPosts.length === 0 ? <div className="py-16 text-center"><h2 className="text-xl font-semibold">No posts found</h2><p className="text-muted-foreground mt-2">Try another search or clear the active filter.</p><Button variant="link" onClick={() => { setSearchTerm(""); setSelectedTag(null); }}>Clear filters</Button></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredPosts.map((post) => <Card key={post.id} className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow"><Link to={`/blog/${post.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"><div className="aspect-video w-full overflow-hidden bg-muted"><img src={post.coverImageUrl} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" /></div></Link><CardHeader className="flex-grow"><div className="flex flex-wrap gap-2 mb-2">{post.tags.map((tag) => <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"><Tag className="mr-1 h-3 w-3" aria-hidden="true" />{tag}</span>)}</div><CardTitle className="line-clamp-2"><Link to={`/blog/${post.slug}`} className="hover:text-primary focus:outline-none focus-visible:underline">{post.title}</Link></CardTitle><CardDescription className="mt-2 line-clamp-3">{post.excerpt}</CardDescription></CardHeader><CardFooter className="border-t pt-4 flex justify-between items-center"><div className="flex items-center text-sm text-muted-foreground"><CalendarDays className="mr-1 h-3.5 w-3.5" aria-hidden="true" />{new Date(post.publishDate).toLocaleDateString()}</div><div className="flex items-center text-sm text-muted-foreground"><Clock className="mr-1 h-3.5 w-3.5" aria-hidden="true" />{post.readingTime} min read</div></CardFooter></Card>)}</div>}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
