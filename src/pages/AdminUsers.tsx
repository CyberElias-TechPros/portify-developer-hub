import AdminLayout from "@/components/admin/Layout";
import RoleManagement from "@/components/admin/RoleManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsers() {
  return <AdminLayout><div className="space-y-6"><div><h1 className="text-3xl font-bold">User management</h1><p className="text-muted-foreground">Review accounts and change roles. Role changes are authorized by the Worker.</p></div><Card><CardHeader><CardTitle>Roles and permissions</CardTitle><CardDescription>Assign only the access each account needs. The last administrator cannot be removed.</CardDescription></CardHeader><CardContent><RoleManagement /></CardContent></Card></div></AdminLayout>;
}
