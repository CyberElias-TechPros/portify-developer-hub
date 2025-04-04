
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/Layout";
import RoleManagement from "@/components/admin/RoleManagement";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState("roles");
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    allowRegistration: false,
    requireEmailVerification: true,
    defaultRole: false,
    allowGitHubAuth: true,
    allowGoogleAuth: true,
    allowLinkedInAuth: false
  });

  // Handle settings change
  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    toast({
      title: "Setting updated",
      description: `${setting} has been ${value ? 'enabled' : 'disabled'}.`
    });
  };

  // Save invitation template
  const handleSaveTemplate = () => {
    toast({
      title: "Template saved",
      description: "Invitation email template has been updated."
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and access controls</p>
        </div>

        <Tabs defaultValue="roles" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="roles">
              <Card>
                <CardContent className="p-6">
                  <RoleManagement />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invitations">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
                  <p className="text-muted-foreground mb-6">
                    Track and manage pending user invitations
                  </p>
                  
                  <div className="space-y-6">
                    {/* Invitation template editor */}
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">Invitation Email Template</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="subject">Subject Line</Label>
                          <Input 
                            id="subject" 
                            defaultValue="Join our team at Ellis Graham's Portfolio"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template">Email Body</Label>
                          <div className="mt-1 border rounded-md">
                            <textarea 
                              id="template" 
                              className="w-full h-32 p-2 rounded-md border-0 focus:ring-0"
                              defaultValue="Hello,\n\nYou've been invited to join Ellis Graham's portfolio platform. Click the link below to set up your account:\n\n{invitation_link}\n\nThis invitation will expire in 7 days.\n\nBest regards,\nEllis Graham"
                            />
                          </div>
                        </div>
                        <Button onClick={handleSaveTemplate}>Save Template</Button>
                      </div>
                    </div>
                    
                    {/* Active invitations */}
                    <div className="text-center py-12 border rounded-md">
                      <p className="text-muted-foreground">No pending invitations</p>
                      <Button className="mt-4" variant="outline" size="sm">
                        View Invitation History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Registration Settings</h2>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allowRegistration">Allow public registration</Label>
                          <p className="text-sm text-muted-foreground">Let visitors create accounts without invitations</p>
                        </div>
                        <Switch 
                          id="allowRegistration" 
                          checked={settings.allowRegistration}
                          onCheckedChange={(checked) => handleSettingChange('allowRegistration', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="requireEmailVerification">Require email verification</Label>
                          <p className="text-sm text-muted-foreground">Users must verify email before accessing the platform</p>
                        </div>
                        <Switch 
                          id="requireEmailVerification" 
                          checked={settings.requireEmailVerification}
                          onCheckedChange={(checked) => handleSettingChange('requireEmailVerification', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="defaultRole">Set default role to Viewer</Label>
                          <p className="text-sm text-muted-foreground">New registrations will be assigned Viewer permissions</p>
                        </div>
                        <Switch 
                          id="defaultRole" 
                          checked={settings.defaultRole}
                          onCheckedChange={(checked) => handleSettingChange('defaultRole', checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Authentication Providers</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowGitHubAuth">GitHub Authentication</Label>
                            <p className="text-sm text-muted-foreground">Allow users to sign in with GitHub</p>
                          </div>
                          <Switch 
                            id="allowGitHubAuth" 
                            checked={settings.allowGitHubAuth}
                            onCheckedChange={(checked) => handleSettingChange('allowGitHubAuth', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowGoogleAuth">Google Authentication</Label>
                            <p className="text-sm text-muted-foreground">Allow users to sign in with Google</p>
                          </div>
                          <Switch 
                            id="allowGoogleAuth" 
                            checked={settings.allowGoogleAuth}
                            onCheckedChange={(checked) => handleSettingChange('allowGoogleAuth', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="allowLinkedInAuth">LinkedIn Authentication</Label>
                            <p className="text-sm text-muted-foreground">Allow users to sign in with LinkedIn</p>
                          </div>
                          <Switch 
                            id="allowLinkedInAuth" 
                            checked={settings.allowLinkedInAuth}
                            onCheckedChange={(checked) => handleSettingChange('allowLinkedInAuth', checked)}
                          />
                        </div>
                        
                        <Button className="mt-2" variant="outline" size="sm">
                          Configure OAuth Settings
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Security Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Two-Factor Authentication</Label>
                            <p className="text-sm text-muted-foreground">Allow users to enable 2FA for their accounts</p>
                          </div>
                          <Button variant="outline" size="sm">Configure 2FA</Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Password Policies</Label>
                            <p className="text-sm text-muted-foreground">Set minimum requirements for passwords</p>
                          </div>
                          <Button variant="outline" size="sm">Edit Policies</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
