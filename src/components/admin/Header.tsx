import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function AdminHeader() {
  const { user } = useAuth();
  const name = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user?.email || "Administrator";
  const avatar = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  return <header className="w-full h-16 border-b px-4 sm:px-6 flex items-center justify-between bg-background"><div><p className="font-semibold">Admin workspace</p><p className="text-xs text-muted-foreground hidden sm:block">Manage your Portify instance</p></div><div className="flex items-center gap-4"><ThemeToggle /><div className="flex items-center gap-3"><div className="text-right hidden sm:block"><p className="text-sm font-medium">{name}</p><p className="text-xs text-muted-foreground">{user?.role || "user"}</p></div><Avatar className="h-8 w-8"><AvatarImage src={avatar} alt="" /><AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback></Avatar></div></div></header>;
}
