import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block px-3 py-2 rounded-md text-sm font-medium transition-smooth",
    isActive
      ? "bg-secondary text-secondary-foreground"
      : "hover:bg-accent hover:text-accent-foreground"
  );

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-semibold text-lg tracking-tight">
          Swarnkar Sangha 
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/Gallery" className={navLinkClass}>
            Gallery
          </NavLink>
          <NavLink to="/donate" className={navLinkClass}>
            Donation
          </NavLink>
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        </nav>

        {/* Right Side Button (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="default" asChild>
            <a href="#gallery">Explore</a>
          </Button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="flex flex-col p-3 gap-1">
            <NavLink
              to="/"
              className={navLinkClass}
              end
              onClick={() => setMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/Gallery"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Gallery
            </NavLink>
            <NavLink
              to="/donate"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Donation
            </NavLink>
            <NavLink
              to="/admin"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </NavLink>
            <Button variant="default" asChild className="mt-2">
              <a href="#gallery" onClick={() => setMenuOpen(false)}>
                Explore
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
