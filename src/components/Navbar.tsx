import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User, LogOut, Search, Users, Settings, Sparkles, Mail, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsername } from '@/hooks/useUsername';
import CommandSearch from './experience/CommandSearch';

const links = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/projects' },
  { name: 'Skills', href: '/skills' },
  { name: 'Experience', href: '/experience' },
  { name: 'Writing', href: '/blog' },
  { name: 'Discover', href: '/discover' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { username } = useUsername();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
  const avatarUrl = (profile?.avatar_url as string) || (user?.user_metadata?.avatar_url as string) || '';

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`mx-auto flex items-center justify-between gap-4 transition-all duration-500 ease-cinematic ${
            scrolled
              ? 'mt-2 w-[min(1180px,calc(100%-1.5rem))] rounded-2xl border border-white/10 bg-[hsl(240_28%_5%/.78)] px-4 py-2.5 shadow-[0_20px_60px_-40px_rgba(0,0,0,.95)] backdrop-blur-xl'
              : 'w-[min(1320px,calc(100%-2rem))] border border-transparent px-4 py-4'
          }`}
        >
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--violet))] via-[hsl(var(--cyan))] to-[hsl(var(--amber))] text-[hsl(240_30%_4%)] shadow-glow">
              <span className="font-display text-base font-extrabold">P</span>
              <span className="absolute inset-0 translate-y-full bg-white/25 transition-transform duration-500 ease-cinematic group-hover:translate-y-0" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-semibold tracking-tight">Portify</span>
              <span className="mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {user && username ? `@${username}` : 'developer portfolios'}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  isActive(item.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.07]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="mono hidden text-[10px] md:block">⌘K</span>
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative rounded-full ring-1 ring-white/15 transition-transform duration-300 hover:scale-[1.06]">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} alt={username ?? 'Profile'} />
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--violet))] to-[hsl(var(--cyan))] text-sm font-semibold text-[hsl(240_30%_4%)]">
                        {(username || user.email || 'P').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[hsl(240_30%_4%)] bg-emerald-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl border-white/10 bg-[hsl(240_28%_6%)] p-1.5">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{profile?.full_name || username || 'Your studio'}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/sections">
                      <Sparkles className="mr-2 h-4 w-4" /> Portfolio studio
                    </Link>
                  </DropdownMenuItem>
                  {username && (
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to={`/${username}`}>
                        <Search className="mr-2 h-4 w-4" /> View live portfolio
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/messages">
                      <Mail className="mr-2 h-4 w-4" /> Inbox
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/theme">
                      <Palette className="mr-2 h-4 w-4" /> Theme studio
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl">
                    <Link to="/discover">
                      <Users className="mr-2 h-4 w-4" /> Discover people
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/admin">
                        <Settings className="mr-2 h-4 w-4" /> Admin dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl text-rose-300 focus:text-rose-200">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="hidden rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="sheen relative overflow-hidden rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] px-4 py-2 text-[13px] font-semibold text-[hsl(240_30%_4%)] shadow-glow transition-transform duration-300 hover:scale-[1.03]"
                >
                  Start free
                </Link>
              </div>
            )}

            <button
              onClick={() => setOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-foreground lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-[hsl(240_30%_3%/.96)] px-7 pt-20 backdrop-blur-xl lg:hidden"
          >
            <nav className="flex flex-col gap-1">
              {links.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={item.href}
                    className="block py-3 font-display text-3xl font-semibold tracking-tight text-foreground/90 transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-10 flex flex-col gap-3">
              <button
                onClick={() => {
                  setOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-3 text-sm text-muted-foreground"
              >
                <Search className="h-4 w-4" /> Search Portify
              </button>
              {!user && (
                <Link
                  to="/auth?mode=register"
                  className="rounded-full bg-gradient-to-r from-[hsl(var(--violet))] to-[hsl(var(--cyan))] py-3 text-center text-sm font-semibold text-[hsl(240_30%_4%)]"
                >
                  Create your portfolio
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
