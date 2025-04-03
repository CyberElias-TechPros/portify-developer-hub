
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/home/Hero";
import ProjectsShowcase from "@/components/home/ProjectsShowcase";
import Skills from "@/components/home/Skills";
import Experience from "@/components/home/Experience";
import ContactSection from "@/components/home/ContactSection";

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
    <Layout>
      <div className="bg-background">
        <Hero />
        <ProjectsShowcase />
        <Skills />
        <Experience />
        <ContactSection />
      </div>
    </Layout>
  );
};

export default Index;
