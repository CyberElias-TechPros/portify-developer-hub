
import { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import HelpTooltip from "@/components/HelpTooltip";

const Index = () => {
  // Add scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      elements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, []);

  return (
    <Layout hideAnimation={true}>
      <div className="bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <div className="container relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-on-scroll opacity-0 transition-all duration-700 delay-100" style={{ transform: 'translateY(20px)' }}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Create your professional <span className="text-primary">portfolio</span> in minutes
                </h1>
                <p className="mt-6 text-xl text-muted-foreground">
                  Showcase your skills and projects to the world with a beautiful, customizable portfolio website
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <Link to="/auth">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/discover">Explore Portfolios</Link>
                  </Button>
                </div>
              </div>

              <div className="animate-on-scroll opacity-0 transition-all duration-700 delay-300" style={{ transform: 'translateY(20px)' }}>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-lg blur opacity-25"></div>
                  <div className="relative bg-background border border-primary/20 rounded-lg overflow-hidden shadow-xl">
                    <div className="h-10 bg-muted flex items-center px-4">
                      <div className="flex space-x-2">
                        <div className="rounded-full w-3 h-3 bg-red-500"></div>
                        <div className="rounded-full w-3 h-3 bg-yellow-500"></div>
                        <div className="rounded-full w-3 h-3 bg-green-500"></div>
                      </div>
                      <div className="ml-4 text-sm text-muted-foreground">portfolio.techpros.com.ng/johndoe</div>
                      <div className="ml-auto">
                        <ThemeToggleButton className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                        Portfolio Preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">Why Choose Our Platform?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to create a professional online presence and showcase your work
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Easy to Use",
                  description: "No coding required. Our intuitive interface makes it easy to create a stunning portfolio.",
                  icon: "✨",
                },
                {
                  title: "Customizable",
                  description: "Choose from multiple themes and layouts or create your own custom design.",
                  icon: "🎨",
                },
                {
                  title: "Professional",
                  description: "Make a great impression with a sleek, professional portfolio that showcases your best work.",
                  icon: "💼",
                },
                {
                  title: "SEO Optimized",
                  description: "Get discovered online with SEO-friendly portfolios that rank well in search engines.",
                  icon: "🔍",
                },
                {
                  title: "Community",
                  description: "Connect with other professionals, share ideas, and get inspired by their work.",
                  icon: "👥",
                },
                {
                  title: "Analytics",
                  description: "Track visitor engagement and learn how people interact with your portfolio.",
                  icon: "📊",
                },
              ].map((feature, index) => (
                <Card key={index} className="animate-on-scroll opacity-0 transition-all duration-500" style={{ transform: 'translateY(20px)', transitionDelay: `${index * 100}ms` }}>
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Get your professional portfolio up and running in just a few simple steps
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-12">
                {[
                  {
                    step: 1,
                    title: "Create an account",
                    description: "Sign up and create your personalized profile with your bio and contact information.",
                  },
                  {
                    step: 2,
                    title: "Add your work",
                    description: "Upload your projects, skills, experience, and blog posts to showcase your expertise.",
                  },
                  {
                    step: 3,
                    title: "Customize your portfolio",
                    description: "Choose a theme, arrange sections, and make it your own with customization options.",
                  },
                  {
                    step: 4,
                    title: "Share with the world",
                    description: "Get a unique URL to share your portfolio with employers, clients, and your network.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex animate-on-scroll opacity-0 transition-all duration-500" style={{ transform: 'translateY(20px)', transitionDelay: `${index * 150}ms` }}>
                    <div className="flex-shrink-0 mr-6">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold">
                        {item.step}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center animate-on-scroll opacity-0 transition-all duration-500" style={{ transform: 'translateY(20px)', transitionDelay: '600ms' }}>
                <Button size="lg" asChild>
                  <Link to="/auth">Create Your Portfolio</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">What Our Users Say</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Thousands of professionals use our platform to showcase their work
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  quote: "This platform helped me land my dream job. The clean design and easy customization options made my portfolio stand out.",
                  name: "Sarah Johnson",
                  title: "UI/UX Designer",
                  avatar: "/placeholder.svg",
                },
                {
                  quote: "As a freelancer, having a professional portfolio is crucial. This platform made it incredibly easy to showcase my projects.",
                  name: "Michael Chen",
                  title: "Web Developer",
                  avatar: "/placeholder.svg",
                },
                {
                  quote: "I love the community aspect! I've connected with other professionals and even found collaboration opportunities.",
                  name: "Emily Rodriguez",
                  title: "Graphic Designer",
                  avatar: "/placeholder.svg",
                },
              ].map((testimonial, index) => (
                <Card key={index} className="animate-on-scroll opacity-0 transition-all duration-500" style={{ transform: 'translateY(20px)', transitionDelay: `${index * 100}ms` }}>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <p className="italic">"{testimonial.quote}"</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                      <div>
                        <h4 className="font-medium">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center animate-on-scroll opacity-0 transition-all duration-500" style={{ transform: 'translateY(20px)' }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to showcase your work?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of professionals who use our platform to create stunning portfolios.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/auth">Get Started For Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/help">Learn More</Link>
                </Button>
              </div>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground flex justify-center items-center gap-1">
                  Need help?
                  <HelpTooltip content={
                    <div>
                      <p>Visit our help page or contact support at:</p>
                      <p className="font-medium">support@portfolioplatform.com</p>
                    </div>
                  } />
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
