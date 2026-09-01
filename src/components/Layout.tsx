
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AnimatedWrapper from "./AnimatedWrapper";

interface LayoutProps {
  children: ReactNode;
  hideAnimation?: boolean;
}

export default function Layout({ children, hideAnimation = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg">Skip to content</a>
      <Navbar />
      <main id="main-content" className="flex-grow">
        {hideAnimation ? (
          children
        ) : (
          <AnimatedWrapper>{children}</AnimatedWrapper>
        )}
      </main>
      <Footer />
    </div>
  );
}
