import { Link } from "react-router-dom";

export default function Footer() {
  return <footer className="mt-auto w-full border-t bg-secondary/30 px-6 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Link to="/" className="text-xl font-bold text-primary">Portify</Link><p className="mt-1 text-sm text-muted-foreground">A focused workspace for publishing developer portfolios.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><Link className="hover:text-foreground" to="/projects">Projects</Link><Link className="hover:text-foreground" to="/blog">Articles</Link><Link className="hover:text-foreground" to="/discover">Discover</Link><Link className="hover:text-foreground" to="/help">Help</Link><Link className="hover:text-foreground" to="/contact">Contact</Link></nav></div></footer>;
}
