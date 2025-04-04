
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/admin/Layout";
import DashboardStats from "@/components/admin/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { projects, experiences, profile } from "@/data/mock-data";
import RoleManagement from "@/components/admin/RoleManagement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>("dashboard");
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [formProfile, setFormProfile] = useState({
    name: profile.name,
    title: profile.title,
    bio: profile.bio,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl,
    website: profile.website || "",
    github: profile.github || "",
    twitter: profile.twitter || "",
  });
  
  const [siteSettings, setSiteSettings] = useState({
    siteName: "My Portfolio",
    siteDescription: "My professional portfolio website",
    siteLanguage: "en",
    allowComments: true,
    enableBlog: true,
    showProjectStats: true,
    showSocialLinks: true,
    enableDarkMode: true,
    customDomain: "myportfolio.com",
    useSinglePage: false,
  });
  
  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error("Error checking auth status:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, [navigate]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSiteSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  
  const handleSettingsToggle = (name: string, checked: boolean) => {
    setSiteSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSaveProfile = () => {
    setSaveLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaveLoading(false);
      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully.",
      });
    }, 1000);
  };
  
  const handleSaveSettings = () => {
    setSaveLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaveLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your website settings have been updated successfully.",
      });
    }, 1000);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-8">
        <Tabs defaultValue="dashboard" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 w-full mb-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="site">Site Settings</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="custom-code">Custom Code</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Content */}
          <TabsContent value="dashboard">
            <DashboardStats />
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-8">
              {/* Recent Blog Posts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Blog Posts</CardTitle>
                  <CardDescription>
                    Your latest published articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="w-16 h-16 rounded overflow-hidden">
                          <img 
                            src="/placeholder.svg" 
                            alt="Blog post" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{`Blog Post ${i}`}</h4>
                          <p className="text-sm text-muted-foreground">Published on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Badge variant="outline">{`${120 + i * 45} views`}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">View All Posts</Button>
                </CardContent>
              </Card>
              
              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    Your latest showcased projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div className="w-16 h-16 rounded overflow-hidden">
                          <img 
                            src={project.imageUrl} 
                            alt={project.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{project.title}</h4>
                          <div className="flex gap-2 mt-1">
                            {project.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {project.featured && (
                          <Badge variant="default">Featured</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">View All Projects</Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and changes to your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {[
                    { action: "Updated profile information", time: "2 hours ago" },
                    { action: "Published new blog post", time: "Yesterday" },
                    { action: "Added new project", time: "3 days ago" },
                    { action: "Updated site settings", time: "1 week ago" },
                    { action: "Changed theme colors", time: "2 weeks ago" },
                  ].map((activity, i) => (
                    <div key={i} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/30 bg-primary/10">
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </div>
                        {i < 4 && <div className="w-px h-full bg-border" />}
                      </div>
                      <div className="pb-8">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Profile Content */}
          <TabsContent value="profile">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your personal information and social links
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="flex flex-col items-center">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={formProfile.avatarUrl || "/placeholder.svg"} alt={formProfile.name} />
                          <AvatarFallback>{formProfile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm" className="mt-4">
                          Change Avatar
                        </Button>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={formProfile.name}
                              onChange={handleProfileChange}
                            />
                          </div>
                          <div>
                            <Label htmlFor="title">Professional Title</Label>
                            <Input
                              id="title"
                              name="title"
                              value={formProfile.title}
                              onChange={handleProfileChange}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            value={formProfile.bio}
                            onChange={handleProfileChange}
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formProfile.location}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formProfile.email}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formProfile.phone}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          value={formProfile.website}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          name="github"
                          value={formProfile.github}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          name="twitter"
                          value={formProfile.twitter}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          name="linkedin"
                          value={formProfile.linkedin}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={saveLoading}
                      >
                        {saveLoading ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Users Content */}
          <TabsContent value="users">
            <RoleManagement />
          </TabsContent>
          
          {/* Site Settings Content */}
          <TabsContent value="site">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your website's general settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="siteName">Site Name</Label>
                        <Input
                          id="siteName"
                          name="siteName"
                          value={siteSettings.siteName}
                          onChange={handleSettingsChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="siteLanguage">Site Language</Label>
                        <select 
                          id="siteLanguage"
                          name="siteLanguage"
                          value={siteSettings.siteLanguage}
                          onChange={handleSettingsChange}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="siteDescription">Site Description</Label>
                      <Textarea
                        id="siteDescription"
                        name="siteDescription"
                        value={siteSettings.siteDescription}
                        onChange={handleSettingsChange}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customDomain">Custom Domain</Label>
                      <Input
                        id="customDomain"
                        name="customDomain"
                        value={siteSettings.customDomain}
                        onChange={handleSettingsChange}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your custom domain without http:// or https://
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Features & Display</CardTitle>
                  <CardDescription>
                    Control what features are enabled on your site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Enable Blog</h4>
                        <p className="text-sm text-muted-foreground">
                          Show blog posts section on your portfolio
                        </p>
                      </div>
                      <Switch
                        checked={siteSettings.enableBlog}
                        onCheckedChange={(checked) => handleSettingsToggle("enableBlog", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Allow Comments</h4>
                        <p className="text-sm text-muted-foreground">
                          Enable comments on blog posts
                        </p>
                      </div>
                      <Switch
                        checked={siteSettings.allowComments}
                        onCheckedChange={(checked) => handleSettingsToggle("allowComments", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Show Project Stats</h4>
                        <p className="text-sm text-muted-foreground">
                          Display stars, forks, and other project metrics
                        </p>
                      </div>
                      <Switch
                        checked={siteSettings.showProjectStats}
                        onCheckedChange={(checked) => handleSettingsToggle("showProjectStats", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Show Social Links</h4>
                        <p className="text-sm text-muted-foreground">
                          Display social media links in header and footer
                        </p>
                      </div>
                      <Switch
                        checked={siteSettings.showSocialLinks}
                        onCheckedChange={(checked) => handleSettingsToggle("showSocialLinks", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Enable Dark Mode Toggle</h4>
                        <p className="text-sm text-muted-foreground">
                          Allow visitors to switch between light and dark modes
                        </p>
                      </div>
                      <Switch
                        checked={siteSettings.enableDarkMode}
                        onCheckedChange={(checked) => handleSettingsToggle("enableDarkMode", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Use Single Page Layout</h4>
                        <p className="text-sm text-muted-foreground">
                          Show all content on a single scrollable page
                        </p>
                      </div>
                      <Switch
                        checked={siteSettings.useSinglePage}
                        onCheckedChange={(checked) => handleSettingsToggle("useSinglePage", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* SEO Content */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize your site for search engines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      placeholder="Enter meta title"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended length: 50-60 characters
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      placeholder="Enter meta description"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended length: 140-160 characters
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="ogImage">Open Graph Image</Label>
                    <div className="mt-1 flex items-center">
                      <div className="w-32 h-32 rounded border flex items-center justify-center overflow-hidden">
                        <img 
                          src="/placeholder.svg" 
                          alt="OG Image" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        Upload Image
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended size: 1200 x 630 pixels
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="keywords">Meta Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="e.g., developer, portfolio, web development"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Separate keywords with commas
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Generate Sitemap</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically create a sitemap for search engines
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Structured Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Include structured data for rich search results
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save SEO Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Custom Code Content */}
          <TabsContent value="custom-code">
            <Card>
              <CardHeader>
                <CardTitle>Custom Code</CardTitle>
                <CardDescription>
                  Add custom HTML, CSS, or JavaScript to your site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <Textarea
                      id="customCss"
                      placeholder="Enter your custom CSS here"
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="headerScripts">Header Scripts</Label>
                    <Textarea
                      id="headerScripts"
                      placeholder="Enter scripts to be included in the <head> section"
                      className="font-mono text-sm"
                      rows={6}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      These scripts will be added to the &lt;head&gt; section of your site
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="footerScripts">Footer Scripts</Label>
                    <Textarea
                      id="footerScripts"
                      placeholder="Enter scripts to be included at the end of the <body> section"
                      className="font-mono text-sm"
                      rows={6}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      These scripts will be added right before the closing &lt;/body&gt; tag
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Custom Code</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
