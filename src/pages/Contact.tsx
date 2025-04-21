import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ContactConfirmationDialog from "@/components/ContactConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import AnimatedWrapper from "@/components/AnimatedWrapper";
import { Mail, Phone, MapPin } from "lucide-react";
import Map from "@/components/Map";
import { ContactInfo } from "@/types/portfolio";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: "contact@example.com",
    phone: "+1 (555) 123-4567",
    address: "San Francisco, CA",
    github: "",
    twitter: "",
    linkedin: ""
  });

  useEffect(() => {
    async function fetchContactInfo() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'contact_info')
          .single();
        
        if (error) {
          if (error.code !== 'PGRST116') {
            console.error("Error fetching contact info:", error);
          }
        } else if (data && data.value) {
          const contactData = typeof data.value === 'string' ? 
            JSON.parse(data.value) : data.value;
            
          setContactInfo(contactData);
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    }

    fetchContactInfo();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.functions.invoke('contact-submit', {
        body: formData
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setShowConfirmation(true);
      
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeConfirmationDialog = () => {
    setShowConfirmation(false);
  };

  return (
    <Layout>
      <AnimatedWrapper>
        <div className="container mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Get in Touch</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Have a question, proposal, or just want to say hello? Fill out the form below and I'll get back to you as soon as possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and I'll respond as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can I help you?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Your message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Feel free to reach out using any of these channels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 mt-1 text-primary" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <a href={`mailto:${contactInfo.email}`} className="text-muted-foreground hover:text-primary">
                          {contactInfo.email}
                        </a>
                      </div>
                    </div>
                    {contactInfo.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 mt-1 text-primary" />
                        <div>
                          <h3 className="font-medium">Phone</h3>
                          <a href={`tel:${contactInfo.phone}`} className="text-muted-foreground hover:text-primary">
                            {contactInfo.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {contactInfo.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-1 text-primary" />
                        <div>
                          <h3 className="font-medium">Location</h3>
                          <p className="text-muted-foreground">{contactInfo.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Map height="250px" className="shadow-lg" />
            </div>
          </div>
        </div>
        
        <ContactConfirmationDialog
          open={showConfirmation}
          onClose={closeConfirmationDialog}
        />
      </AnimatedWrapper>
    </Layout>
  );
}
