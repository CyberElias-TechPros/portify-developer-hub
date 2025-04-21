
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface MapProps {
  address?: string;
  height?: string;
  className?: string;
}

export default function Map({ address = "San Francisco, CA", height = "400px", className = "" }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mapAddress, setMapAddress] = useState(address);

  useEffect(() => {
    // Fetch contact info for the address
    const fetchContactInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'contact_info')
          .single();
          
        if (!error && data && data.value) {
          const contactInfo = typeof data.value === 'string' ? 
            JSON.parse(data.value) : data.value;
            
          if (contactInfo.address) {
            setMapAddress(contactInfo.address);
          }
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    };
    
    fetchContactInfo();
  }, []);

  useEffect(() => {
    const loadMap = async () => {
      try {
        setLoading(true);
        
        if (!mapRef.current) return;
        
        // Create a simple embeddable map using Open Street Map
        const encodedAddress = encodeURIComponent(mapAddress);
        const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-90%2C180%2C90&layer=mapnik&marker=true&query=${encodedAddress}`;
        
        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.marginHeight = 0;
        iframe.marginWidth = 0;
        iframe.src = embedUrl;
        iframe.style.borderRadius = '0.5rem';
        
        // Clear previous content and append iframe
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
          mapRef.current.appendChild(iframe);
        }
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (mapAddress) {
      loadMap();
    }
  }, [mapAddress]);

  return (
    <Card className={`overflow-hidden ${className}`}>
      {loading ? (
        <Skeleton className={`w-full h-[${height}]`} />
      ) : (
        <div 
          ref={mapRef} 
          className="w-full" 
          style={{ height }}
          aria-label={`Map showing location: ${mapAddress}`} 
        />
      )}
    </Card>
  );
}
