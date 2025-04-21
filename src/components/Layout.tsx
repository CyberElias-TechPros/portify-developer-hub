
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
      <Navbar />
      <main className="flex-grow">
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
