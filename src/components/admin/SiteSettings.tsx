
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  github: string;
  twitter: string;
  linkedin: string;
}

interface SocialLinks {
  github: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  facebook: string;
}

interface SiteInfo {
  title: string;
  description: string;
  keywords: string;
  author: string;
  logoUrl: string;
  faviconUrl: string;
}

export default function SiteSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("contact");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "",
    phone: "",
    address: "",
    github: "",
    twitter: "",
    linkedin: ""
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    github: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
    facebook: ""
  });
  
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    title: "",
    description: "",
    keywords: "",
    author: "",
    logoUrl: "",
    faviconUrl: ""
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        
        // Fetch contact info
        const { data: contactData, error: contactError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'contact_info')
          .single();
        
        if (contactError && contactError.code !== 'PGRST116') { // PGRST116 means no rows returned
          console.error("Error fetching contact info:", contactError);
        } else if (contactData) {
          const parsedData = typeof contactData.value === 'string' ? 
            JSON.parse(contactData.value) : contactData.value;
          setContactInfo(parsedData);
        }
        
        // Fetch social links
        const { data: socialData, error: socialError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'social_links')
          .single();
        
        if (socialError && socialError.code !== 'PGRST116') {
          console.error("Error fetching social links:", socialError);
        } else if (socialData) {
          const parsedData = typeof socialData.value === 'string' ? 
            JSON.parse(socialData.value) : socialData.value;
          setSocialLinks(parsedData);
        }
        
        // Fetch site info
        const { data: siteData, error: siteError } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'site_info')
          .single();
        
        if (siteError && siteError.code !== 'PGRST116') {
          console.error("Error fetching site info:", siteError);
        } else if (siteData) {
          const parsedData = typeof siteData.value === 'string' ? 
            JSON.parse(siteData.value) : siteData.value;
          setSiteInfo(parsedData);
        }
        
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load site settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, [toast]);
  
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialLinks(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSiteInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSiteInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const saveContactInfo = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'contact_info',
          value: contactInfo
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
      
      toast({
        title: "Contact Info Saved",
        description: "Your contact information has been updated successfully."
      });
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast({
        title: "Error",
        description: "Failed to save contact information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveSocialLinks = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'social_links',
          value: socialLinks
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
      
      toast({
        title: "Social Links Saved",
        description: "Your social media links have been updated successfully."
      });
    } catch (error) {
      console.error("Error saving social links:", error);
      toast({
        title: "Error",
        description: "Failed to save social media links",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const saveSiteInfo = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'site_info',
          value: siteInfo
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
      
      toast({
        title: "Site Info Saved",
        description: "Your site information has been updated successfully."
      });
    } catch (error) {
      console.error("Error saving site info:", error);
      toast({
        title: "Error",
        description: "Failed to save site information",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
        <CardDescription>Manage global settings for your portfolio site</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact">Contact Info</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="site">Site Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  value={contactInfo.email || ''} 
                  onChange={handleContactChange}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={contactInfo.phone || ''} 
                  onChange={handleContactChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={contactInfo.address || ''} 
                onChange={handleContactChange}
                placeholder="San Francisco, CA"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Profile</Label>
              <Input 
                id="github" 
                name="github" 
                value={contactInfo.github || ''} 
                onChange={handleContactChange}
                placeholder="https://github.com/username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter Profile</Label>
              <Input 
                id="twitter" 
                name="twitter" 
                value={contactInfo.twitter || ''} 
                onChange={handleContactChange}
                placeholder="https://twitter.com/username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input 
                id="linkedin" 
                name="linkedin" 
                value={contactInfo.linkedin || ''} 
                onChange={handleContactChange}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={saveContactInfo} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Contact Info
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input 
                  id="socialGithub" 
                  name="github" 
                  value={socialLinks.github || ''} 
                  onChange={handleSocialChange}
                  placeholder="https://github.com/username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input 
                  id="socialTwitter" 
                  name="twitter" 
                  value={socialLinks.twitter || ''} 
                  onChange={handleSocialChange}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input 
                  id="socialLinkedin" 
                  name="linkedin" 
                  value={socialLinks.linkedin || ''} 
                  onChange={handleSocialChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input 
                  id="instagram" 
                  name="instagram" 
                  value={socialLinks.instagram || ''} 
                  onChange={handleSocialChange}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input 
                  id="youtube" 
                  name="youtube" 
                  value={socialLinks.youtube || ''} 
                  onChange={handleSocialChange}
                  placeholder="https://youtube.com/@username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input 
                  id="facebook" 
                  name="facebook" 
                  value={socialLinks.facebook || ''} 
                  onChange={handleSocialChange}
                  placeholder="https://facebook.com/username"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={saveSocialLinks} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Social Links
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="site" className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Site Title</Label>
              <Input 
                id="title" 
                name="title" 
                value={siteInfo.title || ''} 
                onChange={handleSiteInfoChange}
                placeholder="My Portfolio"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Meta Description</Label>
              <Input 
                id="description" 
                name="description" 
                value={siteInfo.description || ''} 
                onChange={handleSiteInfoChange}
                placeholder="A showcase of my work and skills as a developer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="keywords">Meta Keywords</Label>
              <Input 
                id="keywords" 
                name="keywords" 
                value={siteInfo.keywords || ''} 
                onChange={handleSiteInfoChange}
                placeholder="portfolio, developer, web development, react"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input 
                id="author" 
                name="author" 
                value={siteInfo.author || ''} 
                onChange={handleSiteInfoChange}
                placeholder="Your Name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input 
                  id="logoUrl" 
                  name="logoUrl" 
                  value={siteInfo.logoUrl || ''} 
                  onChange={handleSiteInfoChange}
                  placeholder="/logo.svg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input 
                  id="faviconUrl" 
                  name="faviconUrl" 
                  value={siteInfo.faviconUrl || ''} 
                  onChange={handleSiteInfoChange}
                  placeholder="/favicon.ico"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={saveSiteInfo} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Site Info
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
