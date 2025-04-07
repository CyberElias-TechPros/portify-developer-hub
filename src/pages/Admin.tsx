
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from '@/components/admin/Layout';
import DashboardStats from '@/components/admin/DashboardStats';
import RoleManagement from '@/components/admin/RoleManagement';
import SiteSettings from '@/components/admin/SiteSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

type ProfileData = {
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  avatarUrl: string;
}

type ThemeSettings = {
  layout: 'single-page' | 'multi-page';
  colorScheme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontFamily: string;
  showBadge: boolean;
}

export default function Admin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData>({
    name: "Ellis Graham",
    title: "Full Stack Developer",
    bio: "Passionate about building beautiful, functional, and accessible web applications.",
    location: "San Francisco, CA",
    email: "contact@ellisgraham.dev",
    phone: "+1 (555) 123-4567",
    website: "https://ellisgraham.dev",
    github: "https://github.com/ellisgraham",
    twitter: "https://twitter.com/ellisgraham",
    linkedin: "https://linkedin.com/in/ellisgraham",
    avatarUrl: "/placeholder.svg",
  });
  
  const [theme, setTheme] = useState<ThemeSettings>({
    layout: 'single-page',
    colorScheme: 'system',
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
    showBadge: true,
  });
  
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }
        
        setUser(user);
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setProfile({
            name: profileData.full_name || profile.name,
            title: profileData.title || profile.title,
            bio: profileData.bio || profile.bio,
            location: profileData.location || profile.location,
            email: user.email || profile.email,
            phone: profile.phone,
            website: profileData.website || profile.website,
            github: profileData.github || profile.github,
            twitter: profileData.twitter || profile.twitter,
            linkedin: profileData.linkedin || profile.linkedin,
            avatarUrl: profileData.avatar_url || profile.avatarUrl,
          });
        }
        
        // Fetch theme settings
        // This would come from a separate table in a real implementation
        const { data: themeData, error: themeError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'theme')
          .single();
          
        if (themeError && themeError.code !== 'PGRST116') {
          console.error("Error fetching theme:", themeError);
        } else if (themeData && themeData.value) {
          const themeSettings = typeof themeData.value === 'string' ? 
            JSON.parse(themeData.value) : themeData.value;
          
          setTheme({
            layout: themeSettings.layout || theme.layout,
            colorScheme: themeSettings.colorScheme || theme.colorScheme,
            primaryColor: themeSettings.primaryColor || theme.primaryColor,
            fontFamily: themeSettings.fontFamily || theme.fontFamily,
            showBadge: themeSettings.showBadge !== undefined ? themeSettings.showBadge : theme.showBadge,
          });
        }
        
      } catch (error) {
        console.error("Error in auth check:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please sign in again to continue.",
        });
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, toast, profile.phone]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleThemeChange = (name: string, value: string | boolean) => {
    setTheme(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveProfile = async () => {
    try {
      setIsSaving(true);
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.name,
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          github: profile.github,
          twitter: profile.twitter,
          linkedin: profile.linkedin,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Also update the contact info in site settings
      await supabase
        .from('site_settings')
        .upsert({
          key: 'contact_info',
          value: {
            email: profile.email,
            phone: profile.phone,
            address: profile.location,
            github: profile.github,
            twitter: profile.twitter,
            linkedin: profile.linkedin,
          }
        }, {
          onConflict: 'key'
        });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const saveTheme = async () => {
    try {
      setIsSaving(true);
      
      // Update theme settings in Supabase
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'theme',
          value: theme
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
      
      toast({
        title: "Theme Updated",
        description: "Your theme settings have been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating theme:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update theme settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const changeEmail = async () => {
    try {
      setIsSaving(true);
      
      // Call Supabase auth API to update email
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) throw error;
      
      toast({
        title: "Verification Email Sent",
        description: "Please check your new email address to confirm the change.",
      });
      
      setNewEmail('');
    } catch (error: any) {
      console.error("Error changing email:", error);
      toast({
        variant: "destructive",
        title: "Email Change Failed",
        description: error.message || "Failed to change email address.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const changePassword = async () => {
    try {
      setIsSaving(true);
      
      if (newPassword !== confirmNewPassword) {
        throw new Error("New passwords do not match.");
      }
      
      // Call Supabase auth API to update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        variant: "destructive",
        title: "Password Change Failed",
        description: error.message || "Failed to change password.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="siteSettings">Site Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <DashboardStats />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <RoleManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                      <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                  </div>
                  
                  <div className="flex-1 grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={profile.name}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="title">Professional Title</Label>
                        <Input 
                          id="title" 
                          name="title" 
                          value={profile.title}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        name="bio" 
                        value={profile.bio}
                        onChange={handleProfileChange}
                        rows={3} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          name="location" 
                          value={profile.location}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          value={profile.phone}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      name="website" 
                      value={profile.website}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      value={profile.email}
                      onChange={handleProfileChange}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      To change your email, go to Security tab
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Social Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input 
                        id="github" 
                        name="github" 
                        value={profile.github}
                        onChange={handleProfileChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input 
                        id="twitter" 
                        name="twitter" 
                        value={profile.twitter}
                        onChange={handleProfileChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input 
                        id="linkedin" 
                        name="linkedin" 
                        value={profile.linkedin}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Theme</CardTitle>
              <CardDescription>Customize the look and feel of your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="layout">Layout</Label>
                    <Select 
                      value={theme.layout} 
                      onValueChange={(value: 'single-page' | 'multi-page') => handleThemeChange('layout', value)}
                    >
                      <SelectTrigger id="layout">
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-page">Single Page</SelectItem>
                        <SelectItem value="multi-page">Multi Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="colorScheme">Color Scheme</Label>
                    <Select 
                      value={theme.colorScheme} 
                      onValueChange={(value: 'light' | 'dark' | 'system') => handleThemeChange('colorScheme', value)}
                    >
                      <SelectTrigger id="colorScheme">
                        <SelectValue placeholder="Select color scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        id="primaryColor" 
                        name="primaryColor" 
                        type="color" 
                        value={theme.primaryColor}
                        onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                        className="w-12 h-9 p-1"
                      />
                      <Input 
                        type="text" 
                        value={theme.primaryColor}
                        onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select 
                      value={theme.fontFamily} 
                      onValueChange={(value) => handleThemeChange('fontFamily', value)}
                    >
                      <SelectTrigger id="fontFamily">
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showBadge"
                    checked={theme.showBadge}
                    onChange={(e) => handleThemeChange('showBadge', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="showBadge">Show "Made with Lovable" badge</Label>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveTheme} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Theme"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="siteSettings" className="space-y-4">
          <SiteSettings />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>Update your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">Current Email</Label>
                  <Input id="currentEmail" value={profile.email} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New Email</Label>
                  <Input 
                    id="newEmail" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={changeEmail} disabled={isSaving || !newEmail}>
                    {isSaving ? "Saving..." : "Change Email"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={changePassword} 
                    disabled={isSaving || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                  >
                    {isSaving ? "Saving..." : "Change Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">2FA Status</h4>
                    <p className="text-sm text-muted-foreground">Not enabled</p>
                  </div>
                  <Button variant="outline">Setup 2FA</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Current Session</h4>
                    <p className="text-sm text-muted-foreground">Last active just now</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign Out</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
