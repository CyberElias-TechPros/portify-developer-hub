
import { useState } from "react";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/api";
import { Calendar } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and hyphens").optional(),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().max(500, "Keep tags under 500 characters"),
  series: z.string().max(120).optional(),
  coverImageUrl: z.string().url("Use a valid image URL").or(z.literal("")),
  published: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BlogCreate() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      slug: "",
      category: "",
      tags: "",
      series: "",
      coverImageUrl: "",
      published: false,
    },
  });

  const handleSubmit = async (data: FormValues) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Sign in before creating a post.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
      const slug = (data.slug || data.title.toLowerCase().replace(/[^a-z0-9\s-]/gi, "").replace(/\s+/g, "-")).replace(/^-|-$/g, "");
      const words = data.content.trim().split(/\s+/).filter(Boolean).length;
      const { error } = await supabase.from("blog_posts").insert({
        user_id: user.id,
        title: data.title.trim(),
        excerpt: data.excerpt.trim(),
        content: data.content.trim(),
        slug,
        category: data.category,
        tags: tagsArray,
        series: data.series || null,
        cover_image_url: data.coverImageUrl || null,
        reading_time: Math.max(1, Math.ceil(words / 200)),
        published: Boolean(data.published),
        is_public: true,
      });
      if (error) throw error;
      toast({ title: data.published ? "Post published" : "Draft saved", description: data.published ? "Your article is now visible on your portfolio." : "Your draft is safely stored." });
      navigate("/blog");
    } catch (error) {
      toast({ title: "Could not save post", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlugFromTitle = () => {
    const title = form.getValues("title");
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      form.setValue("slug", slug);
    }
  };

  return (
    <Layout>
      <div className="container py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Blog Post</h1>
          <p className="text-muted-foreground">Write and publish a new article on your portfolio.</p>
        </div>

        <div className="flex space-x-4 mb-6">
          <Button
            variant={previewMode ? "outline" : "default"}
            onClick={() => setPreviewMode(false)}
          >
            Edit
          </Button>
          <Button
            variant={previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(true)}
          >
            Preview
          </Button>
        </div>

        {previewMode ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="prose dark:prose-invert max-w-none">
                <h1>{form.getValues("title") || "Untitled Post"}</h1>
                <p className="text-muted-foreground italic">
                  {form.getValues("excerpt") || "No excerpt provided"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                  {form.getValues("category") && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                      {form.getValues("category")}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-wrap">
                  {form.getValues("content") || "No content provided"}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content</CardTitle>
                      <CardDescription>
                        Write the content of your blog post
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter the title of your blog post"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-generate slug on title change
                                  if (!form.getValues("slug")) {
                                    generateSlugFromTitle();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Excerpt</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter a brief summary of your post"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Write your blog post content here..."
                                rows={15}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Publishing</CardTitle>
                      <CardDescription>
                        Configure publishing settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Publish immediately
                            </FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between space-x-2 pt-4">
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={() => form.setValue("published", false)}
                        >
                          Save as Draft
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          onClick={() => form.setValue("published", true)}
                        >
                          Publish
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Metadata</CardTitle>
                      <CardDescription>
                        Configure post metadata
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input
                                  placeholder="post-url-slug"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={generateSlugFromTitle}
                              >
                                Generate
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Programming">Programming</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Career">Career</SelectItem>
                                <SelectItem value="Tutorial">Tutorial</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="javascript, react, tutorial (comma separated)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="series"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Series (Optional)</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Add to a series (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="React Basics">React Basics</SelectItem>
                                <SelectItem value="Advanced TypeScript">Advanced TypeScript</SelectItem>
                                <SelectItem value="Portfolio Tips">Portfolio Tips</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coverImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover image URL (optional)</FormLabel>
                            <FormControl><Input type="url" placeholder="https://…" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </Layout>
  );
}
