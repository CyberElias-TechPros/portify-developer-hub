import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Loader2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/api";
import type { BlogPost as BlogPostType, Profile } from "@/types/portfolio";
import Comments from "@/components/community/Comments";
import Reactions from "@/components/community/Reactions";

type DatabasePost = {
  id: string; user_id: string | null; title: string; content: string; excerpt: string | null; slug: string;
  publish_date: string | null; tags: string[] | null; cover_image_url: string | null; category: string | null;
  series: string | null; reading_time: number | null; published: boolean | null; is_public: boolean | null;
  created_at: string | null; updated_at: string | null;
};

function mapPost(post: DatabasePost): BlogPostType {
  return { id: post.id, user_id: post.user_id, title: post.title, content: post.content, excerpt: post.excerpt || post.title, slug: post.slug, publishDate: post.publish_date || post.created_at || new Date().toISOString(), tags: post.tags || [], coverImageUrl: post.cover_image_url || "/placeholder.svg", category: post.category || undefined, series: post.series || undefined, readingTime: post.reading_time || 1, published: post.published ?? false, is_public: post.is_public ?? true, created_at: post.created_at || undefined, updated_at: post.updated_at || undefined };
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: JSX.Element[] = [];
  let code: string[] = [];
  let codeLanguage = "";
  let inCode = false;
  const flushCode = () => {
    if (!inCode) return;
    blocks.push(<pre key={`code-${blocks.length}`} className="my-5 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100"><code>{code.join("\n")}</code></pre>);
    code = [];
    codeLanguage = "";
    inCode = false;
  };
  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCode) flushCode();
      else { inCode = true; codeLanguage = line.slice(3).trim(); }
      return;
    }
    if (inCode) { code.push(line); return; }
    if (line.startsWith("### ")) blocks.push(<h3 key={index} className="text-xl font-bold mt-7 mb-3">{line.slice(4)}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h2 key={index} className="text-2xl font-bold mt-8 mb-3">{line.slice(3)}</h2>);
    else if (line.startsWith("# ")) blocks.push(<h1 key={index} className="text-3xl font-bold mt-2 mb-5">{line.slice(2)}</h1>);
    else if (/^[-*] /.test(line)) blocks.push(<li key={index} className="ml-5 list-disc">{line.slice(2)}</li>);
    else if (/^\d+\. /.test(line)) blocks.push(<li key={index} className="ml-5 list-decimal">{line.replace(/^\d+\. /, "")}</li>);
    else if (line.trim()) blocks.push(<p key={index} className="my-4 leading-7">{line}</p>);
  });
  flushCode();
  return <>{blocks}</>;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [related, setRelated] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    const result = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("published", true).single();
    if (result.error || !result.data) {
      setError(result.error?.message || "Post not found");
      setLoading(false);
      return;
    }
    const nextPost = mapPost(result.data as DatabasePost);
    setPost(nextPost);
    const [authorResult, relatedResult] = await Promise.all([
      nextPost.user_id ? supabase.from("profiles").select("*").eq("id", nextPost.user_id).single() : Promise.resolve({ data: null, error: null }),
      nextPost.category ? supabase.from("blog_posts").select("*").eq("published", true).eq("category", nextPost.category).limit(4) : Promise.resolve({ data: [], error: null }),
    ]);
    if (authorResult.data) {
      const profileData = authorResult.data as { id: string; full_name: string | null; title: string | null; bio: string | null; location: string | null; email?: string | null; github?: string | null; linkedin?: string | null; twitter?: string | null; website?: string | null; avatar_url: string | null };
      setAuthor({ id: profileData.id, name: profileData.full_name || "Portfolio author", full_name: profileData.full_name || undefined, title: profileData.title || undefined, bio: profileData.bio || undefined, location: profileData.location || undefined, email: profileData.email || undefined, github: profileData.github || undefined, linkedin: profileData.linkedin || undefined, twitter: profileData.twitter || undefined, website: profileData.website || undefined, avatarUrl: profileData.avatar_url || undefined, avatar_url: profileData.avatar_url || undefined });
    }
    if (Array.isArray(relatedResult.data)) setRelated((relatedResult.data as DatabasePost[]).filter((item) => item.id !== nextPost.id).slice(0, 2).map(mapPost));
    setLoading(false);
  }, [slug]);

  useEffect(() => { void loadPost(); }, [loadPost]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: post?.title, text: post?.excerpt, url });
      else { await navigator.clipboard.writeText(url); toast({ title: "Link copied", description: "The article link is ready to share." }); }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      toast({ title: "Could not share", description: "Copy the URL from your browser to share this article.", variant: "destructive" });
    }
  };

  const authorInitial = useMemo(() => (author?.name || "P").charAt(0).toUpperCase(), [author]);
  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center" role="status"><Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading article</span></div></Layout>;
  if (error || !post) return <Layout><div className="container py-20 text-center"><h1 className="text-2xl font-bold">Post not found</h1><p className="mt-3 text-muted-foreground">This article may have been unpublished or removed.</p><Button className="mt-6" asChild><Link to="/blog">Back to blog</Link></Button></div></Layout>;

  return (
    <Layout>
      <article className="container max-w-4xl py-12">
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">{post.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{post.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Calendar className="h-4 w-4" aria-hidden="true" />{new Date(post.publishDate).toLocaleDateString()}</span><span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{post.readingTime} min read</span>{post.category && <Badge variant="outline">{post.category}</Badge>}{post.series && <span>Series: {post.series}</span>}</div>
          <div className="mt-6 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Avatar className="h-10 w-10"><AvatarImage src={author?.avatarUrl} alt="" /><AvatarFallback>{authorInitial}</AvatarFallback></Avatar><div><p className="font-medium">{author?.name || "Portify"}</p><p className="text-xs text-muted-foreground">{author?.title || "Portfolio author"}</p></div></div><Button variant="outline" size="sm" onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" />Share</Button></div>
        </div>
        {post.coverImageUrl && <div className="mb-8 overflow-hidden rounded-xl bg-muted"><img src={post.coverImageUrl} alt="" className="w-full max-h-[420px] object-cover" /></div>}
        <Card><CardContent className="pt-6"><div className="prose prose-slate dark:prose-invert max-w-none"><MarkdownContent content={post.content} /></div></CardContent></Card>
        <div className="mt-6"><Reactions contentType="blog_post" contentId={post.id} /></div>
        <div className="mt-10"><Comments contentType="blog_post" contentId={post.id} /></div>
        {related.length > 0 && <section className="mt-12"><h2 className="text-2xl font-bold mb-5">Related posts</h2><div className="grid gap-4 md:grid-cols-2">{related.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="text-xs text-muted-foreground mb-2">{new Date(item.publishDate).toLocaleDateString()}</div><h3 className="font-semibold text-lg"><Link className="hover:text-primary" to={`/blog/${item.slug}`}>{item.title}</Link></h3><p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p></CardContent></Card>)}</div></section>}
      </article>
    </Layout>
  );
}
