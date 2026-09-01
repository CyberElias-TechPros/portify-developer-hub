import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ContactInfo = { email: string; phone: string; address: string; github: string; twitter: string; linkedin: string };
type SocialLinks = { github: string; twitter: string; linkedin: string; instagram: string; youtube: string; facebook: string };
type SiteInfo = { title: string; description: string; keywords: string; author: string; logoUrl: string; faviconUrl: string };
const contactDefault: ContactInfo = { email: "", phone: "", address: "", github: "", twitter: "", linkedin: "" };
const socialDefault: SocialLinks = { github: "", twitter: "", linkedin: "", instagram: "", youtube: "", facebook: "" };
const siteDefault: SiteInfo = { title: "", description: "", keywords: "", author: "", logoUrl: "", faviconUrl: "" };
const optionalHttpUrl = z.string().trim().max(500).refine((value) => !value || /^https?:\/\//i.test(value), "Use an http(s) URL");
const optionalAssetUrl = z.string().trim().max(500).refine((value) => !value || /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//")), "Use an http(s) URL or a site-relative path");
const settingsSchema = z.object({ email: z.string().trim().refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email"), phone: z.string().trim().max(40), address: z.string().trim().max(160), github: optionalHttpUrl, twitter: optionalHttpUrl, linkedin: optionalHttpUrl, instagram: optionalHttpUrl, youtube: optionalHttpUrl, facebook: optionalHttpUrl, title: z.string().trim().max(160), description: z.string().trim().max(320), keywords: z.string().trim().max(320), author: z.string().trim().max(120), logoUrl: optionalAssetUrl, faviconUrl: optionalAssetUrl });
function record(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function merge<T extends object>(defaults: T, value: unknown): T { return { ...defaults, ...record(value) }; }

export default function SiteSettings() {
  const { toast } = useToast();
  const [contact, setContact] = useState<ContactInfo>(contactDefault);
  const [social, setSocial] = useState<SocialLinks>(socialDefault);
  const [site, setSite] = useState<SiteInfo>(siteDefault);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all(["contact_info", "social_links", "site_info"].map((key) => supabase.from("site_settings").select("value").eq("key", key).single())).then(([contactResult, socialResult, siteResult]) => {
      if (!mounted) return;
      if (contactResult.data) setContact(merge(contactDefault, contactResult.data.value));
      if (socialResult.data) setSocial(merge(socialDefault, socialResult.data.value));
      if (siteResult.data) setSite(merge(siteDefault, siteResult.data.value));
      const failed = [contactResult, socialResult, siteResult].find((result) => result.error && result.error.code !== "PGRST116");
      if (failed?.error) toast({ title: "Could not load site settings", description: failed.error.message, variant: "destructive" });
      setLoading(false);
    }).catch((error: unknown) => { if (mounted) { setLoading(false); toast({ title: "Could not load site settings", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); } });
    return () => { mounted = false; };
  }, [toast]);
  const update = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, field: keyof T, value: string) => setter((current) => ({ ...current, [field]: value }));
  const save = async (key: "contact_info" | "social_links" | "site_info", value: ContactInfo | SocialLinks | SiteInfo) => {
    const input = { ...contact, ...social, ...site };
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) { toast({ title: "Check the settings", description: parsed.error.issues[0]?.message, variant: "destructive" }); return; }
    setSaving(true);
    const result = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    if (result.error) toast({ title: "Settings not saved", description: result.error.message, variant: "destructive" }); else toast({ title: "Settings saved" });
    setSaving(false);
  };
  if (loading) return <div className="flex h-64 items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading settings</span></div>;
  return <Card><CardHeader><CardTitle>Site settings</CardTitle><CardDescription>Manage the contact details and metadata shown on public portfolio pages.</CardDescription></CardHeader><CardContent><Tabs defaultValue="contact"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="contact">Contact</TabsTrigger><TabsTrigger value="social">Social</TabsTrigger><TabsTrigger value="site">Site information</TabsTrigger></TabsList><TabsContent value="contact" className="space-y-4 pt-5"><div className="grid gap-4 md:grid-cols-2">{([ ["email", "Email", "email"], ["phone", "Phone", "text"], ["address", "Address", "text"], ["github", "GitHub URL", "url"], ["twitter", "Social URL", "url"], ["linkedin", "LinkedIn URL", "url"] ] as [keyof ContactInfo, string, string][]).map(([field, label, type]) => <div key={field} className="space-y-2"><Label htmlFor={`contact-${field}`}>{label}</Label><Input id={`contact-${field}`} type={type} value={contact[field]} onChange={(event) => update(setContact, field, event.target.value)} /></div>)}</div><Button onClick={() => void save("contact_info", contact)} disabled={saving}>{saving ? "Saving…" : "Save contact"}</Button></TabsContent><TabsContent value="social" className="space-y-4 pt-5"><div className="grid gap-4 md:grid-cols-2">{([ ["github", "GitHub"], ["twitter", "Twitter / X"], ["linkedin", "LinkedIn"], ["instagram", "Instagram"], ["youtube", "YouTube"], ["facebook", "Facebook"] ] as [keyof SocialLinks, string][]).map(([field, label]) => <div key={field} className="space-y-2"><Label htmlFor={`social-${field}`}>{label}</Label><Input id={`social-${field}`} type="url" value={social[field]} onChange={(event) => update(setSocial, field, event.target.value)} /></div>)}</div><Button onClick={() => void save("social_links", social)} disabled={saving}>{saving ? "Saving…" : "Save social links"}</Button></TabsContent><TabsContent value="site" className="space-y-4 pt-5"><div className="space-y-2"><Label htmlFor="site-title">Site title</Label><Input id="site-title" value={site.title} onChange={(event) => update(setSite, "title", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="site-description">Meta description</Label><Input id="site-description" value={site.description} onChange={(event) => update(setSite, "description", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="site-keywords">Keywords</Label><Input id="site-keywords" value={site.keywords} onChange={(event) => update(setSite, "keywords", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="site-author">Author</Label><Input id="site-author" value={site.author} onChange={(event) => update(setSite, "author", event.target.value)} /></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="site-logo">Logo URL</Label><Input id="site-logo" value={site.logoUrl} onChange={(event) => update(setSite, "logoUrl", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="site-favicon">Favicon URL</Label><Input id="site-favicon" value={site.faviconUrl} onChange={(event) => update(setSite, "faviconUrl", event.target.value)} /></div></div><Button onClick={() => void save("site_info", site)} disabled={saving}>{saving ? "Saving…" : "Save site information"}</Button></TabsContent></Tabs></CardContent></Card>;
}
