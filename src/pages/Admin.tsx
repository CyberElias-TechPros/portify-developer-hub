
import AdminLayout from "@/components/admin/Layout";
import DashboardStats from "@/components/admin/DashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { experiences, projects, profile } from "@/data/mock-data";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Admin = () => {
  // Get recent projects
  const recentProjects = [...projects]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex space-x-2">
            <Button>Add New Project</Button>
          </div>
        </div>

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Recently added or updated projects</CardDescription>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/admin/projects" className="inline-flex items-center">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                      {project.imageUrl ? (
                        <img 
                          src={project.imageUrl} 
                          alt={project.title} 
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <span className="text-xs font-bold">{project.title.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/admin/projects/${project.id}`}>Edit</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
              <CardDescription>Your current profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl font-bold">{profile.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{profile.location}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="text-sm font-medium">{profile.website}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GitHub</p>
                  <p className="text-sm font-medium">{profile.github}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Twitter</p>
                  <p className="text-sm font-medium">{profile.twitter}</p>
                </div>
              </div>
              
              <Button size="sm" className="w-full mt-2" asChild>
                <Link to="/admin/profile">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Experience */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>Your current work experience</CardDescription>
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/admin/experience" className="inline-flex items-center">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="flex space-x-4">
                  <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center">
                    {exp.logoUrl ? (
                      <img 
                        src={exp.logoUrl} 
                        alt={exp.company} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <span className="text-sm font-bold">{exp.company.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{exp.position}</h3>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(exp.startDate)} — {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                    <p className="text-sm mt-2 line-clamp-2">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Admin;
