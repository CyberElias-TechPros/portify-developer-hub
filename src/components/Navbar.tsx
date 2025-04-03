
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="w-full py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b">
      <Link to="/" className="text-xl md:text-2xl font-bold text-primary">
        Portify
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-8">
        <div className="space-x-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/projects" className="hover:text-primary transition-colors">
            Projects
          </Link>
          <Link to="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <Link to="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
          <Link to="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Button size="sm">
            <Link to="/contact">Contact Me</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Toggle */}
      <div className="md:hidden flex items-center">
        <ThemeToggle />
        <button
          onClick={toggleMenu}
          className="ml-4 p-2 rounded-md focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 p-5 bg-background border-b shadow-md animate-fade-in z-40">
          <div className="flex flex-col space-y-4">
            <Link
              to="/"
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/projects"
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            <Link
              to="/blog"
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              to="/admin"
              className="p-2 hover:bg-secondary rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Admin
            </Link>
            <Button className="w-full mt-2">
              <Link to="/contact" onClick={() => setIsOpen(false)}>
                Contact Me
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
