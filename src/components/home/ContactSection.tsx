import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Github, Twitter, Linkedin, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { ContactInfo } from "@/types/portfolio";
import Map from "@/components/Map";
import { api } from "@/lib/api";

type SocialLinks = { github: string; twitter: string; linkedin: string; instagram: string; youtube: string; facebook: string };
interface ContactSectionProps { userProfile?: { name?: string; email?: string; phone?: string; location?: string; github?: string; linkedin?: string; twitter?: string }; }
const contactSchema = z.object({ name: z.string().trim().min(2, "Name must be at least 2 characters").max(120), email: z.string().trim().email("Enter a valid email address"), subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(180), message: z.string().trim().min(10, "Message must be at least 10 characters").max(5_000) });
type ContactForm = z.infer<typeof contactSchema>;
const defaultSocial: SocialLinks = { github: "", twitter: "", linkedin: "", instagram: "", youtube: "", facebook: "" };
function record(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function cleanText(value: unknown, max = 500) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function cleanEmail(value: unknown) { const email = cleanText(value, 320); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ""; }
function cleanUrl(value: unknown) { const url = cleanText(value); try { const parsed = new URL(url); return (parsed.protocol === "https:" || parsed.protocol === "http:") && !parsed.username && !parsed.password ? url : ""; } catch { return ""; } }

export default function ContactSection({ userProfile }: ContactSectionProps) {
  const { toast } = useToast();
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ email: userProfile?.email || "", phone: userProfile?.phone || "", address: userProfile?.location || "", github: userProfile?.github || "", twitter: userProfile?.twitter || "", linkedin: userProfile?.linkedin || "" });
  const [social, setSocial] = useState<SocialLinks>({ ...defaultSocial, github: userProfile?.github || "", twitter: userProfile?.twitter || "", linkedin: userProfile?.linkedin || "" });
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ContactForm>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", subject: "", message: "" } });

  useEffect(() => {
    if (userProfile) {
      setContactInfo({ email: cleanEmail(userProfile.email), phone: cleanText(userProfile.phone, 40), address: cleanText(userProfile.location, 160), github: cleanUrl(userProfile.github), twitter: cleanUrl(userProfile.twitter), linkedin: cleanUrl(userProfile.linkedin) });
      setSocial({ ...defaultSocial, github: cleanUrl(userProfile.github), twitter: cleanUrl(userProfile.twitter), linkedin: cleanUrl(userProfile.linkedin) });
      return;
    }
    let mounted = true;
    Promise.all([api.request<{ value: unknown }[]>("/data/site_settings?eq_key=contact_info&limit=1"), api.request<{ value: unknown }[]>("/data/site_settings?eq_key=social_links&limit=1")]).then(([contactResult, socialResult]) => {
      if (!mounted) return;
      const contact = contactResult.data?.[0] ? record(contactResult.data[0].value) : {};
      const links = socialResult.data?.[0] ? record(socialResult.data[0].value) : {};
      setContactInfo((current) => ({ ...current, email: cleanEmail(contact.email), phone: cleanText(contact.phone, 40), address: cleanText(contact.address, 160), github: cleanUrl(contact.github), twitter: cleanUrl(contact.twitter), linkedin: cleanUrl(contact.linkedin) }));
      setSocial((current) => ({ ...current, github: cleanUrl(links.github), twitter: cleanUrl(links.twitter), linkedin: cleanUrl(links.linkedin), instagram: cleanUrl(links.instagram), youtube: cleanUrl(links.youtube), facebook: cleanUrl(links.facebook) }));
      const failed = [contactResult, socialResult].find((result) => result.error && result.error.code !== "PGRST116");
      if (failed?.error) toast({ title: "Contact details unavailable", description: failed.error.message, variant: "destructive" });
    }).catch((error: unknown) => { if (mounted) toast({ title: "Contact details unavailable", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); });
    return () => { mounted = false; };
  }, [toast, userProfile]);

  const submit = async () => {
    const values = form.getValues();
    setSubmitting(true);
    const result = await api.request<null>("/contact", { method: "POST", body: JSON.stringify(values) });
    if (result.error) toast({ title: "Message not sent", description: result.error.message, variant: "destructive" });
    else { form.reset({ name: userProfile?.name || "", email: "", subject: "", message: "" }); toast({ title: "Message sent", description: "Thanks for reaching out. Your message has been delivered." }); }
    setSubmitting(false); setConfirming(false);
  };

  return <section id="contact" className="w-full py-16 px-6 md:px-12 lg:px-24"><div className="max-w-7xl mx-auto"><div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold mb-4">Get in touch</h2><p className="text-lg text-muted-foreground max-w-2xl mx-auto">Have a question, proposal, or just want to say hello? Send a message and I’ll get back to you.</p></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-12"><Card className="bg-secondary shadow-none"><CardContent className="p-8"><h3 className="text-2xl font-semibold mb-6">Contact information</h3><div className="space-y-4">{contactInfo.email && <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Mail className="h-4 w-4" aria-hidden="true" />{contactInfo.email}</a>}{contactInfo.phone && <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" aria-hidden="true" />{contactInfo.phone}</a>}{contactInfo.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{contactInfo.address}</div>}</div><h3 className="text-2xl font-semibold mt-8 mb-4">Social links</h3><div className="flex gap-2">{social.github && <Button variant="ghost" size="icon" asChild><a href={social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github className="h-5 w-5" /></a></Button>}{social.twitter && <Button variant="ghost" size="icon" asChild><a href={social.twitter} target="_blank" rel="noopener noreferrer" aria-label="Social profile"><Twitter className="h-5 w-5" /></a></Button>}{social.linkedin && <Button variant="ghost" size="icon" asChild><a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a></Button>}</div></CardContent></Card><Card><CardContent className="p-6"><form onSubmit={form.handleSubmit(() => setConfirming(true))} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="contact-name">Name</Label><Input id="contact-name" {...form.register("name")} />{form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}</div><div className="space-y-2"><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" {...form.register("email")} />{form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}</div></div><div className="space-y-2"><Label htmlFor="contact-subject">Subject</Label><Input id="contact-subject" {...form.register("subject")} />{form.formState.errors.subject && <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>}</div><div className="space-y-2"><Label htmlFor="contact-message">Message</Label><Textarea id="contact-message" rows={6} maxLength={5000} {...form.register("message")} />{form.formState.errors.message && <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>}</div><Button type="submit" disabled={submitting}>Send message</Button></form></CardContent></Card></div>{contactInfo.address && <div className="mt-12"><h3 className="text-2xl font-bold mb-6 text-center">Location</h3><Map address={contactInfo.address} height="400px" /></div>}</div><Dialog open={confirming} onOpenChange={(open) => { if (!submitting) setConfirming(open); }}><DialogContent className="w-[calc(100%-2rem)] max-w-md"><DialogHeader><DialogTitle>Send this message?</DialogTitle><DialogDescription>Please confirm that you want to send your message.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>Cancel</Button><Button type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Sending…</> : "Confirm"}</Button></DialogFooter></DialogContent></Dialog></section>;
}
