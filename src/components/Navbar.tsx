
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  id: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: any;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Check active route
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    // Get current auth state
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
      
      if (data?.user) {
        try {
          // Get profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          setProfileData(profile);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };
    
    getUser();
    
    // Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            setProfileData(data);
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        } else {
          setProfileData(null);
        }
      }
    );
    
    // Cleanup
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="w-full py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b">
      <Link to="/" className="text-xl md:text-2xl font-bold text-primary">
        Portify
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        <div className="space-x-6">
          <Link 
            to="/" 
            className={`hover:text-primary transition-colors ${isActive('/') ? 'text-primary font-medium' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/projects" 
            className={`hover:text-primary transition-colors ${isActive('/projects') ? 'text-primary font-medium' : ''}`}
          >
            Projects
          </Link>
          <Link 
            to="/skills" 
            className={`hover:text-primary transition-colors ${isActive('/skills') ? 'text-primary font-medium' : ''}`}
          >
            Skills
          </Link>
          <Link 
            to="/experience" 
            className={`hover:text-primary transition-colors ${isActive('/experience') ? 'text-primary font-medium' : ''}`}
          >
            Experience
          </Link>
          <Link 
            to="/blog" 
            className={`hover:text-primary transition-colors ${isActive('/blog') ? 'text-primary font-medium' : ''}`}
          >
            Blog
          </Link>
          <Link 
            to="/contact" 
            className={`hover:text-primary transition-colors ${isActive('/contact') ? 'text-primary font-medium' : ''}`}
          >
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileData?.avatar_url} />
                    <AvatarFallback>
                      {profileData?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5 leading-none">
                    {profileData?.full_name && (
                      <p className="font-medium text-sm">{profileData.full_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Toggle */}
      <div className="md:hidden flex items-center">
        <ThemeToggle />
        <button
          onClick={toggleMenu}
          className="ml-4 p-2 rounded-md focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-5 bg-background border-b shadow-md animate-fade-in z-40">
          <div className="flex flex-col space-y-4">
            <Link
              to="/"
              className={`p-2 rounded-md transition-colors ${isActive('/') ? 'bg-secondary font-medium' : 'hover:bg-secondary'}`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/projects"
              className={`p-2 rounded-md transition-colors ${isActive('/projects') ? 'bg-secondary font-medium' : 'hover:bg-secondary'}`}
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            <Link
              to="/skills"
              className={`p-2 rounded-md transition-colors ${isActive('/skills') ? 'bg-secondary font-medium' : 'hover:bg-secondary'}`}
              onClick={() => setIsOpen(false)}
            >
              Skills
            </Link>
            <Link
              to="/experience"
              className={`p-2 rounded-md transition-colors ${isActive('/experience') ? 'bg-secondary font-medium' : 'hover:bg-secondary'}`}
              onClick={() => setIsOpen(false)}
            >
              Experience
            </Link>
            <Link
              to="/blog"
              className={`p-2 rounded-md transition-colors ${isActive('/blog') ? 'bg-secondary font-medium' : 'hover:bg-secondary'}`}
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className={`p-2 rounded-md transition-colors ${isActive('/contact') ? 'bg-secondary font-medium' : 'hover:bg-secondary'}`}
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            
            {user ? (
              <>
                <div className="pt-2 border-t flex items-center">
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarImage src={profileData?.avatar_url} />
                    <AvatarFallback>
                      {profileData?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profileData?.full_name || user?.email}</span>
                    <span className="text-xs text-muted-foreground">Logged in</span>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Profile Settings
                </Link>
                <Link
                  to="/admin"
                  className="p-2 hover:bg-secondary rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Button 
                  variant="ghost" 
                  className="justify-start pl-2 font-normal"
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Button className="w-full mt-2" asChild>
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
