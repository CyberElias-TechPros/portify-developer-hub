import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

interface MapProps { address?: string; height?: string; className?: string; }
type Geocode = { latitude: number; longitude: number; label: string };

export default function Map({ address = "", height = "400px", className = "" }: MapProps) {
  const [location, setLocation] = useState<Geocode | null>(null);
  const [loading, setLoading] = useState(Boolean(address));
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (!address.trim()) { setLoading(false); setLocation(null); return; }
    setLoading(true); setError(false);
    api.request<Geocode>(`/geocode?address=${encodeURIComponent(address.trim())}`).then((result) => {
      if (!mounted) return;
      if (result.error || !result.data || !Number.isFinite(result.data.latitude) || !Number.isFinite(result.data.longitude)) { setError(true); setLocation(null); } else setLocation(result.data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [address]);
  const fallbackUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
  if (!address.trim()) return null;
  if (loading) return <Card className={`overflow-hidden ${className}`}><Skeleton className="w-full" style={{ height }} /></Card>;
  if (error || !location) return <Card className={`flex items-center justify-center p-6 ${className}`} style={{ minHeight: height }}><div className="text-center"><MapPin className="mx-auto h-8 w-8 text-primary" aria-hidden="true" /><p className="mt-2 text-sm text-muted-foreground">Location preview is unavailable.</p><Button className="mt-4" variant="outline" asChild><a href={fallbackUrl} target="_blank" rel="noopener noreferrer">Open in OpenStreetMap<ExternalLink className="ml-2 h-4 w-4" /></a></Button></div></Card>;
  const delta = 0.01;
  const bbox = [location.longitude - delta, location.latitude - delta, location.longitude + delta, location.latitude + delta].map((value) => value.toFixed(6)).join(",");
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude.toFixed(6)}%2C${location.longitude.toFixed(6)}`;
  return <Card className={`overflow-hidden ${className}`}><iframe title={`Map showing ${location.label}`} src={embedUrl} style={{ height }} className="w-full border-0" loading="lazy" referrerPolicy="no-referrer" /><div className="flex items-center justify-between gap-3 border-t px-4 py-2 text-sm"><span className="truncate text-muted-foreground">{location.label}</span><a className="shrink-0 text-primary hover:underline" href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=14/${location.latitude}/${location.longitude}`} target="_blank" rel="noopener noreferrer">Open map</a></div></Card>;
}
