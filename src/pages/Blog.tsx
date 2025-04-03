
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Sample blog posts
const samplePosts = [
  {
    id: 1,
    title: "Getting Started with React and TypeScript",
    excerpt: "Learn how to set up a new React project with TypeScript for type-safe development.",
    date: "2023-04-10",
    tags: ["React", "TypeScript", "Frontend"],
    readTime: 5,
    imageUrl: "/placeholder.svg",
  },
  {
    id: 2,
    title: "Building Responsive Layouts with Tailwind CSS",
    excerpt: "Explore the power of utility-first CSS with Tailwind for creating responsive designs.",
    date: "2023-03-25",
    tags: ["CSS", "Tailwind", "Responsive Design"],
    readTime: 7,
    imageUrl: "/placeholder.svg",
  },
  {
    id: 3,
    title: "State Management in Modern React Applications",
    excerpt: "Compare different state management approaches from Context API to Redux and Zustand.",
    date: "2023-02-17",
    tags: ["React", "State Management", "Redux"],
    readTime: 10,
    imageUrl: "/placeholder.svg",
  },
  {
    id: 4,
    title: "Optimizing API Calls with React Query",
    excerpt: "Learn how to implement efficient data fetching with React Query for better UX.",
    date: "2023-01-29",
    tags: ["React", "API", "Performance"],
    readTime: 8,
    imageUrl: "/placeholder.svg",
  },
];

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get unique tags from all posts
  const allTags = Array.from(
    new Set(samplePosts.flatMap((post) => post.tags))
  );

  // Filter posts based on search term and selected tag
  const filteredPosts = samplePosts.filter((post) => {
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
                      src={post.imageUrl}
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
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3.5 w-3.5" />
                      <span>{post.readTime} min read</span>
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
