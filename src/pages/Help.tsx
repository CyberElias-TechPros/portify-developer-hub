
import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import HelpTooltip from "@/components/HelpTooltip";
import AnimatedWrapper from "@/components/AnimatedWrapper";

export default function Help() {
  const [activeTab, setActiveTab] = useState("getting-started");

  return (
    <Layout>
      <div className="container py-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-bold mb-4">Help & Support</h1>
          <p className="text-muted-foreground">
            Learn how to use the platform and get the most out of your portfolio
          </p>
        </div>

        <Tabs defaultValue="getting-started" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-4 max-w-2xl">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="getting-started">
            <AnimatedWrapper>
              <div className="max-w-3xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Creating Your Portfolio</CardTitle>
                    <CardDescription>Follow these simple steps to set up your professional portfolio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-4 list-decimal list-inside">
                      <li className="pl-2">
                        <span className="font-medium">Create an account</span>
                        <p className="text-muted-foreground mt-1 pl-5">
                          Start by signing up for an account with your email or using one of our supported login providers.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-medium">Complete your profile</span>
                        <p className="text-muted-foreground mt-1 pl-5">
                          Add your personal details, professional title, bio, and contact information.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-medium">Add your projects</span>
                        <p className="text-muted-foreground mt-1 pl-5">
                          Showcase your work by adding projects with descriptions, images, and links.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-medium">List your skills</span>
                        <p className="text-muted-foreground mt-1 pl-5">
                          Add your technical and professional skills with proficiency levels.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-medium">Add work experience</span>
                        <p className="text-muted-foreground mt-1 pl-5">
                          Detail your work history, responsibilities, and achievements.
                        </p>
                      </li>
                      <li className="pl-2">
                        <span className="font-medium">Share your portfolio</span>
                        <p className="text-muted-foreground mt-1 pl-5">
                          Get your personalized URL and share it with potential employers or clients.
                        </p>
                      </li>
                    </ol>

                    <div className="mt-6 flex justify-center">
                      <Button asChild>
                        <a href="/auth">Create Your Portfolio</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Video Walkthrough</CardTitle>
                    <CardDescription>Watch our tutorial to get started quickly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                      <p className="text-muted-foreground">Tutorial video coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>

          <TabsContent value="customization">
            <AnimatedWrapper>
              <div className="max-w-3xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Customizing Your Portfolio</CardTitle>
                    <CardDescription>Make your portfolio unique and showcase your personal brand</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Choosing a Theme</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            You can choose from several pre-designed themes or create your own custom theme by adjusting colors, fonts, and layouts in the Theme Customizer.
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <a href="/theme-customizer">Open Theme Customizer</a>
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Arranging Portfolio Sections</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            Customize the order and visibility of your portfolio sections based on what you want to highlight. You can drag and drop sections to rearrange them.
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <a href="/sections">Manage Sections</a>
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Custom Domain</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            Premium users can connect a custom domain to their portfolio for a more professional presence.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="item-4">
                        <AccordionTrigger>Analytics & Tracking</AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">
                            Monitor visitor activity, page views, and interaction metrics to understand how people engage with your portfolio.
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <a href="/admin/analytics">View Analytics</a>
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>

          <TabsContent value="community">
            <AnimatedWrapper>
              <div className="max-w-3xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Community Features
                      <HelpTooltip content="Connect with others to grow your network and showcase your work" />
                    </CardTitle>
                    <CardDescription>Interact with other professionals on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Discover</h3>
                        <p className="text-muted-foreground">
                          Browse portfolios of other professionals in your field for inspiration and networking opportunities.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a href="/discover">Explore Portfolios</a>
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Connect</h3>
                        <p className="text-muted-foreground">
                          Follow other users, send connection requests, and build your professional network.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Share & Discuss</h3>
                        <p className="text-muted-foreground">
                          Share your projects, blog posts, and experiences with the community. Comment on and discuss other users' content.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a href="/community">Visit Community</a>
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Skill Endorsements</h3>
                        <p className="text-muted-foreground">
                          Receive endorsements for your skills from colleagues and connections to boost your credibility.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>

          <TabsContent value="faq">
            <AnimatedWrapper>
              <div className="max-w-3xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>Find answers to common questions about the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="faq-1">
                        <AccordionTrigger>Is this platform free to use?</AccordionTrigger>
                        <AccordionContent>
                          Yes, the basic features of the platform are free to use. We also offer premium plans with additional features like custom domains, advanced analytics, and more storage space.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="faq-2">
                        <AccordionTrigger>Can I export my portfolio to PDF?</AccordionTrigger>
                        <AccordionContent>
                          Yes, you can export your portfolio as a PDF resume or CV. This feature is available in the Resume section of your profile.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="faq-3">
                        <AccordionTrigger>How do I change my username or URL?</AccordionTrigger>
                        <AccordionContent>
                          You can change your username in your profile settings. Your portfolio URL will update automatically to reflect your new username.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="faq-4">
                        <AccordionTrigger>How can I contact support?</AccordionTrigger>
                        <AccordionContent>
                          You can contact support by sending an email to support@portfolioplatform.com or by using the contact form on the platform.
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="faq-5">
                        <AccordionTrigger>Can I integrate my GitHub projects?</AccordionTrigger>
                        <AccordionContent>
                          Yes, you can connect your GitHub account to automatically import your repositories as projects. This feature is available in the Projects section of your profile.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </AnimatedWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
