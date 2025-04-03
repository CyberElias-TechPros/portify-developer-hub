
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AnimatedWrapper from "./AnimatedWrapper";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <AnimatedWrapper>{children}</AnimatedWrapper>
      </main>
      <Footer />
    </div>
  );
}
