import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUsername } from "@/hooks/useUsername";
import { supabase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Profile as ProfileType, adaptDbProfileToProfile } from "@/types/portfolio";
import UsernameSetup from "@/components/auth/UsernameSetup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as LinkIcon, User, Settings, Loader2 } from "lucide-react";

function value(value: unknown) { return typeof value === "string" ? value : ""; }
export default function Profile() {
  const { user, signOut, updateUser } = useAuth();
  const { username } = useUsername();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountEmail, setAccountEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const result = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (result.data) setProfile(adaptDbProfileToProfile(result.data));
    else if (result.error?.code === "PGRST116") {
      const metadata = user.user_metadata || {};
      const created = await supabase.from("profiles").insert({ id: user.id, full_name: value(metadata.full_name), avatar_url: value(metadata.avatar_url) }).select().single();
      if (created.error || !created.data) toast({ title: "Could not create profile", description: created.error?.message || "Please try again.", variant: "destructive" }); else setProfile(adaptDbProfileToProfile(created.data));
    } else if (result.error) toast({ title: "Could not load profile", description: result.error.message, variant: "destructive" });
    setLoading(false);
  }, [toast, user]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setAccountEmail(user?.email || ""); }, [user?.email]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const updates = { full_name: String(form.get("full_name") || "").trim(), title: String(form.get("title") || "").trim(), bio: String(form.get("bio") || "").trim(), location: String(form.get("location") || "").trim(), phone: String(form.get("phone") || "").trim(), website: String(form.get("website") || "").trim(), github: String(form.get("github") || "").trim(), linkedin: String(form.get("linkedin") || "").trim(), twitter: String(form.get("twitter") || "").trim(), avatar_url: String(form.get("avatar_url") || "").trim() };
    setSaving(true);
    const result = await supabase.from("profiles").update(updates).eq("id", user.id).select().single();
    if (result.error || !result.data) toast({ title: "Profile not saved", description: result.error?.message || "Please try again.", variant: "destructive" }); else { setProfile(adaptDbProfileToProfile(result.data)); toast({ title: "Profile saved", description: "Your public profile has been updated." }); }
    setSaving(false);
  };
  const updateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    const email = accountEmail.trim();
    const emailChanged = email.toLowerCase() !== (user.email || "").toLowerCase();
    if (!emailChanged && !newPassword) {
      toast({ title: "No account changes", description: "Enter a new email or password before saving.", variant: "destructive" });
      return;
    }
    if (newPassword && (!/^.{8,}$/.test(newPassword) || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword))) {
      toast({ title: "Choose a stronger password", description: "Use at least eight characters, including a letter and a number.", variant: "destructive" });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Enter the same new password in both fields.", variant: "destructive" });
      return;
    }
    setAccountSaving(true);
    const result = await updateUser({ ...(emailChanged ? { email } : {}), ...(newPassword ? { password: newPassword } : {}), current_password: currentPassword });
    setAccountSaving(false);
    const error = result as { error?: { message?: string } };
    if (error.error) {
      toast({ title: "Account not updated", description: error.error.message || "Please check your current password and try again.", variant: "destructive" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Account updated", description: "Your sign-in details have been updated." });
  };
  const signOutAndReturn = async () => {
    const result = await signOut();
    if (result.error) {
      toast({ title: "Could not sign out", description: result.error.message, variant: "destructive" });
      return;
    }
    window.location.assign("/");
  };
  if (loading) return <Layout><div className="min-h-[55vh] flex items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading profile</span></div></Layout>;
  if (!user || !profile) return <Layout><div className="container py-20 text-center"><h1 className="text-2xl font-bold">Profile unavailable</h1><p className="mt-3 text-muted-foreground">We could not load your profile. Please try again.</p><Button className="mt-5" onClick={() => void load()}>Try again</Button></div></Layout>;
  const initial = (profile.name || user.email || "U").charAt(0).toUpperCase();
  return <Layout><div className="container py-8"><div className="mx-auto max-w-4xl"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold">Profile settings</h1><p className="text-muted-foreground">Control the information visitors see on your portfolio.</p></div><Button onClick={() => void signOutAndReturn()} variant="outline">Sign out</Button></div><Tabs defaultValue="profile" className="space-y-6"><TabsList><TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger><TabsTrigger value="username"><LinkIcon className="mr-2 h-4 w-4" />Username</TabsTrigger><TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Account</TabsTrigger></TabsList><TabsContent value="profile"><Card><CardHeader><CardTitle>Profile information</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex items-center gap-4"><Avatar className="h-20 w-20"><AvatarImage src={profile.avatarUrl} alt="" /><AvatarFallback className="text-lg">{initial}</AvatarFallback></Avatar><p className="text-sm text-muted-foreground">Add a public image URL below, or leave it blank to use your initials.</p></div><form onSubmit={save} className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-full-name">Full name</Label><Input id="profile-full-name" name="full_name" defaultValue={profile.name || ""} maxLength={120} /></div><div className="space-y-2"><Label htmlFor="profile-title">Professional title</Label><Input id="profile-title" name="title" defaultValue={profile.title || ""} maxLength={160} /></div><div className="space-y-2"><Label htmlFor="profile-location">Location</Label><Input id="profile-location" name="location" defaultValue={profile.location || ""} maxLength={120} /></div><div className="space-y-2"><Label htmlFor="profile-phone">Phone (private)</Label><Input id="profile-phone" name="phone" defaultValue={profile.phone || ""} maxLength={40} /></div></div><div className="space-y-2"><Label htmlFor="profile-bio">Bio</Label><Textarea id="profile-bio" name="bio" defaultValue={profile.bio || ""} maxLength={1000} rows={5} /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-website">Website</Label><Input id="profile-website" name="website" type="url" defaultValue={profile.website || ""} /></div><div className="space-y-2"><Label htmlFor="profile-avatar">Avatar URL</Label><Input id="profile-avatar" name="avatar_url" type="url" defaultValue={profile.avatarUrl || ""} /></div><div className="space-y-2"><Label htmlFor="profile-github">GitHub</Label><Input id="profile-github" name="github" type="url" defaultValue={profile.github || ""} /></div><div className="space-y-2"><Label htmlFor="profile-linkedin">LinkedIn</Label><Input id="profile-linkedin" name="linkedin" type="url" defaultValue={profile.linkedin || ""} /></div><div className="space-y-2"><Label htmlFor="profile-twitter">Social profile</Label><Input id="profile-twitter" name="twitter" type="url" defaultValue={profile.twitter || ""} /></div></div><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></form></CardContent></Card></TabsContent><TabsContent value="username"><Card><CardHeader><CardTitle>Username</CardTitle></CardHeader><CardContent>{username && <div className="mb-5 rounded-lg bg-muted p-4"><p className="text-sm text-muted-foreground">Your public portfolio URL</p><p className="mt-1 break-all font-mono text-sm">{window.location.origin}/{username}</p></div>}<UsernameSetup /></CardContent></Card></TabsContent><TabsContent value="settings"><Card><CardHeader><CardTitle>Account security</CardTitle><p className="text-sm text-muted-foreground">Verify your current password before changing your sign-in details.</p></CardHeader><CardContent><form onSubmit={updateAccount} className="space-y-5"><div className="space-y-2"><Label htmlFor="account-email">Sign-in email</Label><Input id="account-email" type="email" autoComplete="email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Leave blank to keep it" /></div><div className="space-y-2"><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat the new password" /></div></div><p className="text-xs text-muted-foreground">Passwords must be at least eight characters and include a letter and a number.</p><Button type="submit" disabled={accountSaving}>{accountSaving ? "Updating…" : "Update account"}</Button></form><div className="mt-8 border-t pt-5"><Button variant="destructive" onClick={() => void signOutAndReturn()}>Sign out</Button></div></CardContent></Card></TabsContent></Tabs></div></div></Layout>;
}
