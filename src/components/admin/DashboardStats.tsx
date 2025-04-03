
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, File, MessageSquare, Star } from "lucide-react";

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">15,842</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-500">+12%</span> from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">24</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-green-500">+3</span> new this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">48</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-amber-500">8</span> unread messages
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Star Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">4.8</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on <span className="font-medium">126</span> reviews
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
