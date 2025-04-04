
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Calendar, 
  Clock,
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  ThumbsUp,
  Star,
  PartyPopper,
  Lightbulb,
  Laugh
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { profile } from "@/data/mock-data";
import type { BlogPost, Comment } from "@/types/portfolio";

export default function BlogPost() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Mock fetch blog post data
  useEffect(() => {
    // This would be replaced with an actual API call
    setTimeout(() => {
      setPost({
        id: "1",
        title: "Building a Modern Portfolio with React and TypeScript",
        content: `
# Building a Modern Portfolio with React and TypeScript

In today's competitive tech landscape, having a standout portfolio is essential. This blog post explores how to build a modern, responsive portfolio website using React and TypeScript.

## Why React and TypeScript?

React's component-based architecture makes it perfect for building modular, reusable UI elements. TypeScript adds static typing, improving code quality and developer experience.

## Key Features to Include

### 1. Responsive Design

Your portfolio should look great on all devices. Use CSS Grid, Flexbox, and media queries to create a responsive layout.

\`\`\`css
@media (max-width: 768px) {
  .portfolio-grid {
    grid-template-columns: 1fr;
  }
}
\`\`\`

### 2. Project Showcase

Highlight your best work with detailed project cards. Include:

- Project title and description
- Technologies used
- Links to live demo and source code
- Screenshots or GIFs

### 3. Skills Section

Visualize your skills using progress bars, charts, or tags to make them easily scannable.

### 4. Dark Mode

Implement a theme toggle for visitors who prefer dark mode:

\`\`\`typescript
function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  return (
    <button onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}
\`\`\`

## Performance Optimization

Don't forget to optimize your portfolio for performance:

1. Lazy load images and components
2. Minimize bundle size
3. Use code splitting
4. Optimize assets

## Deployment Options

Once your portfolio is ready, consider these deployment options:

- Vercel or Netlify for simple, free hosting
- GitHub Pages if your project is on GitHub
- AWS or DigitalOcean for more control

## Conclusion

A well-designed portfolio showcases not just your projects, but also your attention to detail and technical abilities. By using React and TypeScript, you create a maintainable codebase that can evolve as you grow as a developer.
        `,
        excerpt: "Learn how to build a modern portfolio website using React, TypeScript and best practices for showcasing your work.",
        slug: "building-modern-portfolio-react-typescript",
        publishDate: "2023-10-15",
        tags: ["React", "TypeScript", "Portfolio", "Web Development"],
        coverImageUrl: "/placeholder.svg",
        category: "Web Development",
        series: "Modern Web Development",
        readingTime: 8,
        published: true,
        comments: [],
        reactions: []
      });
      setLoading(false);
      
      // Mock comments
      setComments([
        {
          id: "1",
          userId: "user1",
          userName: "Sarah Johnson",
          userAvatar: "/placeholder.svg",
          content: "Great article! I've been looking for a guide like this.",
          createdAt: "2023-10-16T14:32:00Z"
        },
        {
          id: "2",
          userId: "user2",
          userName: "Michael Chen",
          userAvatar: "/placeholder.svg",
          content: "Thanks for sharing these insights. The dark mode implementation is particularly helpful.",
          createdAt: "2023-10-16T16:45:00Z"
        },
        {
          id: "3",
          userId: "user3",
          userName: "Jessica Williams",
          userAvatar: "/placeholder.svg",
          content: "I implemented your suggestions and my portfolio looks much better now. One question though - do you have any recommendations for animation libraries that work well with React?",
          createdAt: "2023-10-17T09:12:00Z"
        }
      ]);
    }, 500);
  }, [slug]);
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: "current-user",
      userName: profile.name,
      userAvatar: profile.avatarUrl,
      content: newComment,
      createdAt: new Date().toISOString()
    };
    
    setComments([...comments, comment]);
    setNewComment("");
    
    toast({
      title: "Comment Added",
      description: "Your comment has been posted successfully.",
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!post) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img 
              src={post.coverImageUrl} 
              alt={post.title}
              className="w-full h-[300px] object-cover"
            />
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 mb-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{new Date(post.publishDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{post.readingTime} min read</span>
            </div>
            {post.category && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {post.category}
              </Badge>
            )}
            {post.series && (
              <span className="text-sm">Series: {post.series}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatarUrl} alt={profile.name} />
              <AvatarFallback>{profile.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{profile.name}</div>
              <div className="text-xs text-muted-foreground">{profile.title}</div>
            </div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map(tag => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Content */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {post.content.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold mt-6 mb-4">{paragraph.substring(2)}</h1>;
                } else if (paragraph.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{paragraph.substring(3)}</h2>;
                } else if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-bold mt-5 mb-2">{paragraph.substring(4)}</h3>;
                } else if (paragraph.startsWith('```') && paragraph.endsWith('```')) {
                  const code = paragraph.substring(paragraph.indexOf('\n') + 1, paragraph.lastIndexOf('\n'));
                  const language = paragraph.substring(3, paragraph.indexOf('\n'));
                  return (
                    <div key={index} className="bg-muted p-4 rounded-md my-4 overflow-x-auto font-mono text-sm">
                      <div className="text-xs text-muted-foreground mb-2">{language}</div>
                      <pre>{code}</pre>
                    </div>
                  );
                } else if (paragraph.trim() === '') {
                  return <div key={index} className="my-4"></div>;
                } else {
                  return <p key={index} className="my-4">{paragraph}</p>;
                }
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Reactions */}
        <Card className="mb-8">
          <CardContent className="flex justify-between items-center py-4">
            <div className="flex gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>42</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Like</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <Heart className="h-4 w-4" />
                      <span>28</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Love</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <PartyPopper className="h-4 w-4" />
                      <span>15</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Celebrate</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <Lightbulb className="h-4 w-4" />
                      <span>19</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Insightful</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex gap-1">
                      <Laugh className="h-4 w-4" />
                      <span>7</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Funny</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Comments */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments.length})
          </h2>
          
          {/* Comment form */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleAddComment}>
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                    <AvatarFallback>{profile.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <textarea 
                      className="w-full p-3 rounded-md border focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={!newComment.trim()}>
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Comments list */}
          <div className="space-y-4">
            {comments.map(comment => (
              <Card key={comment.id}>
                <CardContent className="py-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                      <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{comment.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-2">
                        {comment.content}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <Button variant="ghost" size="sm">Reply</Button>
                        <Button variant="ghost" size="sm" className="flex gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>Like</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Related posts */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt="Related post" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    October {10 + i}, 2023
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    {i === 1 ? "Optimizing React Performance" : "TypeScript Best Practices"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {i === 1 
                      ? "Learn how to optimize your React applications for better performance." 
                      : "Discover TypeScript best practices for maintainable code."}
                  </p>
                  <Button variant="link" className="p-0" asChild>
                    <Link to={`/blog/related-post-${i}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
