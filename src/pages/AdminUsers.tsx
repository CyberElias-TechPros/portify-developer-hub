
import { useState } from "react";
import AdminLayout from "@/components/admin/Layout";
import RoleManagement from "@/components/admin/RoleManagement";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState("roles");

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
                  <p className="text-muted-foreground">
                    Track and manage pending user invitations
                  </p>
                  {/* Invitations table would go here */}
                  <div className="text-center py-12 border rounded-md mt-6">
                    <p className="text-muted-foreground">No pending invitations</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Registration Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="allowRegistration" />
                      <label htmlFor="allowRegistration">Allow public registration</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="requireEmailVerification" defaultChecked />
                      <label htmlFor="requireEmailVerification">Require email verification</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="defaultRole" />
                      <label htmlFor="defaultRole">Set default role for new registrations to Viewer</label>
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
