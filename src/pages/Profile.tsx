
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  MapPin, 
  Mail, 
  User, 
  FileText, 
  Upload, 
  Key, 
  Smartphone,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileFormData {
  full_name: string;
  title: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  avatar_url: string;
}

export default function Profile() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    title: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    avatar_url: "",
  });
  
  // Get current auth state and profile data
  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/auth");
          return;
        }
        
        setUser(user);
        
        // Get profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        
        if (profile) {
          setFormData({
            full_name: profile.full_name || "",
            title: profile.title || "",
            bio: profile.bio || "",
            location: profile.location || "",
            website: profile.website || "",
            github: profile.github || "",
            linkedin: profile.linkedin || "",
            twitter: profile.twitter || "",
            avatar_url: profile.avatar_url || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Upload avatar if changed
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}.${fileExt}`;
        
        // Create a storage bucket for avatars if it doesn't exist yet
        const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
          public: true,
        });
        
        if (createBucketError && createBucketError.message !== "Bucket already exists") {
          throw createBucketError;
        }
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true,
          });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = publicUrl.publicUrl;
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name,
          title: formData.title,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          github: formData.github,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container py-12">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Public Profile</CardTitle>
                    <CardDescription>
                      This information will be displayed on your portfolio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar */}
                        <div className="flex flex-col items-center">
                          <Avatar className="h-32 w-32">
                            <AvatarImage 
                              src={avatarPreview || formData.avatar_url || "/placeholder.svg"} 
                              alt={formData.full_name} 
                            />
                            <AvatarFallback className="text-4xl">
                              {formData.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="mt-4">
                            <Label htmlFor="avatar" className="sr-only">Avatar</Label>
                            <div className="flex items-center justify-center">
                              <label htmlFor="avatar" className="cursor-pointer">
                                <div className="flex items-center gap-2 text-sm px-4 py-2 border rounded-md hover:bg-secondary transition-colors">
                                  <Upload size={16} />
                                  Change Photo
                                </div>
                                <Input 
                                  id="avatar" 
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleAvatarChange}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {/* Basic Info */}
                        <div className="flex-1 space-y-4">
                          <div className="grid gap-4">
                            <div>
                              <Label htmlFor="full_name">Full Name</Label>
                              <div className="relative mt-1">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="full_name"
                                  name="full_name"
                                  placeholder="Your full name"
                                  value={formData.full_name}
                                  onChange={handleChange}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="title">Professional Title</Label>
                              <div className="relative mt-1">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="title"
                                  name="title"
                                  placeholder="e.g., Full Stack Developer"
                                  value={formData.title}
                                  onChange={handleChange}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              name="bio"
                              placeholder="Write a short bio about yourself"
                              value={formData.bio}
                              onChange={handleChange}
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Location and Contact */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Location & Contact</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <div className="relative mt-1">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="location"
                                name="location"
                                placeholder="e.g., San Francisco, CA"
                                value={formData.location}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="website">Personal Website</Label>
                            <div className="relative mt-1">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="website"
                                name="website"
                                placeholder="e.g., https://yourname.com"
                                value={formData.website}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Social Links */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Social Links</h3>
                        <div className="grid sm:grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="github">GitHub Profile</Label>
                            <div className="relative mt-1">
                              <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="github"
                                name="github"
                                placeholder="e.g., https://github.com/username"
                                value={formData.github}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="linkedin">LinkedIn Profile</Label>
                            <div className="relative mt-1">
                              <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="linkedin"
                                name="linkedin"
                                placeholder="e.g., https://linkedin.com/in/username"
                                value={formData.linkedin}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="twitter">Twitter Profile</Label>
                            <div className="relative mt-1">
                              <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="twitter"
                                name="twitter"
                                placeholder="e.g., https://twitter.com/username"
                                value={formData.twitter}
                                onChange={handleChange}
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Account Tab */}
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Email Address</h3>
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="email">Primary Email</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={user?.email || ""}
                              disabled
                              className="pl-10"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            This is the email address associated with your account
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="outline" disabled>
                            Change Email
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Account */}
                    <div className="pt-6 border-t space-y-4">
                      <h3 className="text-lg font-medium">Danger Zone</h3>
                      <div className="grid gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="destructive">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your password and authentication settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Password */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Password</h3>
                      <div className="grid gap-4">
                        <div>
                          <Button variant="outline" className="flex items-center gap-2">
                            <Key size={16} />
                            Change Password
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Two-factor Authentication */}
                    <div className="pt-6 border-t space-y-4">
                      <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                      <div className="grid gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account by enabling two-factor authentication
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="flex items-center gap-2">
                            <Smartphone size={16} />
                            Setup 2FA
                          </Button>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <ShieldCheck size={16} />
                            Not enabled
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sessions */}
                    <div className="pt-6 border-t space-y-4">
                      <h3 className="text-lg font-medium">Active Sessions</h3>
                      <div className="grid gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            You're currently logged in on this device
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="outline">
                            Logout from all devices
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
