
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Search, Tag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/types/portfolio";
import { useToast } from "@/hooks/use-toast";

const Blog = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true);
        
        // Get the blog posts from Supabase
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('publish_date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Convert the database format to our app's BlogPost format
          const formattedPosts: BlogPost[] = data.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || post.title,
            slug: post.slug,
            publishDate: post.publish_date,
            tags: Array.isArray(post.tags) ? post.tags : [],
            coverImageUrl: post.cover_image_url || '/placeholder.svg',
            category: post.category,
            series: post.series,
            readingTime: post.reading_time || 5,
            published: post.published,
          }));
          
          setBlogPosts(formattedPosts);
        } else {
          // Fallback to sample posts if no data from Supabase
          const samplePosts = [
            {
              id: "1",
              title: "Getting Started with React and TypeScript",
              excerpt: "Learn how to set up a new React project with TypeScript for type-safe development.",
              publishDate: "2023-04-10",
              tags: ["React", "TypeScript", "Frontend"],
              readingTime: 5,
              coverImageUrl: "/placeholder.svg",
              slug: "getting-started-react-typescript",
              content: "",
              published: true
            },
            {
              id: "2",
              title: "Building Responsive Layouts with Tailwind CSS",
              excerpt: "Explore the power of utility-first CSS with Tailwind for creating responsive designs.",
              publishDate: "2023-03-25",
              tags: ["CSS", "Tailwind", "Responsive Design"],
              readingTime: 7,
              coverImageUrl: "/placeholder.svg",
              slug: "responsive-layouts-tailwind",
              content: "",
              published: true
            },
            {
              id: "3",
              title: "State Management in Modern React Applications",
              excerpt: "Compare different state management approaches from Context API to Redux and Zustand.",
              publishDate: "2023-02-17",
              tags: ["React", "State Management", "Redux"],
              readingTime: 10,
              coverImageUrl: "/placeholder.svg",
              slug: "state-management-react",
              content: "",
              published: true
            },
            {
              id: "4",
              title: "Optimizing API Calls with React Query",
              excerpt: "Learn how to implement efficient data fetching with React Query for better UX.",
              publishDate: "2023-01-29",
              tags: ["React", "API", "Performance"],
              readingTime: 8,
              coverImageUrl: "/placeholder.svg",
              slug: "optimizing-api-calls-react-query",
              content: "",
              published: true
            },
          ];
          
          setBlogPosts(samplePosts);
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        toast({
          title: "Error",
          description: "Failed to load blog posts",
          variant: "destructive"
        });
        
        // Fallback to sample posts if database fetch fails
        const samplePosts = [
          {
            id: "1",
            title: "Getting Started with React and TypeScript",
            excerpt: "Learn how to set up a new React project with TypeScript for type-safe development.",
            publishDate: "2023-04-10",
            tags: ["React", "TypeScript", "Frontend"],
            readingTime: 5,
            coverImageUrl: "/placeholder.svg",
            slug: "getting-started-react-typescript",
            content: "",
            published: true
          },
          {
            id: "2",
            title: "Building Responsive Layouts with Tailwind CSS",
            excerpt: "Explore the power of utility-first CSS with Tailwind for creating responsive designs.",
            publishDate: "2023-03-25",
            tags: ["CSS", "Tailwind", "Responsive Design"],
            readingTime: 7,
            coverImageUrl: "/placeholder.svg",
            slug: "responsive-layouts-tailwind",
            content: "",
            published: true
          },
          {
            id: "3",
            title: "State Management in Modern React Applications",
            excerpt: "Compare different state management approaches from Context API to Redux and Zustand.",
            publishDate: "2023-02-17",
            tags: ["React", "State Management", "Redux"],
            readingTime: 10,
            coverImageUrl: "/placeholder.svg",
            slug: "state-management-react",
            content: "",
            published: true
          },
          {
            id: "4",
            title: "Optimizing API Calls with React Query",
            excerpt: "Learn how to implement efficient data fetching with React Query for better UX.",
            publishDate: "2023-01-29",
            tags: ["React", "API", "Performance"],
            readingTime: 8,
            coverImageUrl: "/placeholder.svg",
            slug: "optimizing-api-calls-react-query",
            content: "",
            published: true
          },
        ];
        
        setBlogPosts(samplePosts);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBlogPosts();
  }, [toast]);

  // Get unique tags from all posts
  const allTags = Array.from(
    new Set(blogPosts.flatMap((post) => post.tags))
  );

  // Filter posts based on search term and selected tag
  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) || 
      post.excerpt
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
        
    const matchesTag = selectedTag
      ? post.tags.includes(selectedTag)
      : true;
      
    return matchesSearch && matchesTag;
  });

  if (loading) {
    return (
      <Layout>
        <div className="w-full py-16 px-6 md:px-12 lg:px-24 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading blog posts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground max-w-2xl mb-8">
            Thoughts, tutorials, and insights on web development and technology.
          </p>

          {/* Search and Filter */}
          <div className="mb-12 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-auto max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* Blog Posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Card key={post.id} className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t pt-4 flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarDays className="mr-1 h-3.5 w-3.5" />
                      <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      <span>{post.readingTime} min read</span>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <h3 className="text-xl font-medium mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
