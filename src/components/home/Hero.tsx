
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { profile } from "@/data/mock-data";
import { Profile } from "@/types/portfolio";
import FollowButton from "@/components/community/FollowButton";

interface HeroProps {
  userProfile?: Profile;
}

export default function Hero({ userProfile = { ...profile, id: 'mock-user-id' } }: HeroProps) {
  return (
    <section className="w-full py-16 md:py-24 px-6 md:px-12 lg:px-24 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            Hi, I'm{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              {userProfile.name || userProfile.full_name}
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-medium text-muted-foreground">
            {userProfile.title}
          </h2>
          <p className="text-lg max-w-md text-muted-foreground">
            {userProfile.bio}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" asChild>
              <Link to="/projects" className="group">
                View Projects
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contact Me</Link>
            </Button>
          </div>
          {userProfile.id && (
            <div className="pt-4">
              <FollowButton targetUserId={userProfile.id} showCount />
            </div>
          )}
        </div>
        <div className="relative rounded-2xl overflow-hidden h-64 md:h-96 bg-secondary shadow-xl flex items-center justify-center animate-scale-in">
          {(userProfile.avatarUrl || userProfile.avatar_url) ? (
            <img
              src={userProfile.avatarUrl || userProfile.avatar_url}
              alt={userProfile.name || userProfile.full_name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="hero-gradient w-full h-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {(userProfile.name || userProfile.full_name || "?").charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
