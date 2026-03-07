import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Menu,
  XIcon,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Gift,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Breadcrumb } from "@/components/breadcrumb";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Equipment", href: "/equipment" },
    { label: "Try Free", href: "/pricing" },
    { label: "High-Risk", href: "/high-risk" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <header>
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link
            href="/"
            className="font-bold text-xl tracking-tight flex items-center gap-2.5"
            data-testid="link-logo"
          >
            <span className="text-foreground font-extrabold text-xl tracking-tight"><span className="text-primary italic">λ</span>echSavvy</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 text-sm transition-colors rounded-md hover:text-foreground ${
                  location === l.href ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
                data-testid={`link-nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/connect" data-testid="link-nav-connect">
                Connect
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/statement-review" data-testid="link-nav-statement-analysis">
                AI Statement Analysis
                <ArrowRight className="w-3 h-3" />
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <XIcon /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-4 pb-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block px-3 py-2.5 text-sm ${
                location === l.href ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
              onClick={() => setMobileOpen(false)}
              data-testid={`link-mobile-${l.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/connect" data-testid="link-mobile-connect" onClick={() => setMobileOpen(false)}>
                Connect With Us
              </Link>
            </Button>
            <Button size="sm" asChild className="w-full">
              <Link href="/statement-review" data-testid="link-mobile-statement-analysis" onClick={() => setMobileOpen(false)}>
                AI Statement Analysis
              </Link>
            </Button>
            <a
              href="tel:+18087675460"
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4 text-primary" />
              (808) 767-5460
            </a>
          </div>
        </div>
      )}
    </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative py-8 sm:py-14 overflow-hidden" data-testid="section-footer" aria-label="Site footer">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/footer-bg.mp4"
      />
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-sm mb-3">
              Hawai'i's trusted payment processing company. Our gift to local businesses: zero fees, free equipment, no contracts, and local support.
            </p>
            <div className="space-y-2.5 text-sm text-white/60">
              <a href="tel:+18087675460" className="flex items-center gap-2 transition-colors hover:text-white">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>(808) 767-5460</span>
              </a>
              <a href="mailto:contact@techsavvyhawaii.com" className="flex items-center gap-2 transition-colors hover:text-white">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>contact@techsavvyhawaii.com</span>
              </a>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Mon–Fri, 8:00 AM – 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>1917 S King St, Honolulu, HI 96826</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Services</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link href="/pricing" className="transition-colors hover:text-white" data-testid="link-footer-pricing">
                  Payment Processing
                </Link>
              </li>
              <li>
                <Link href="/equipment" className="transition-colors hover:text-white" data-testid="link-footer-equipment">
                  Free Equipment
                </Link>
              </li>
              <li>
                <Link href="/high-risk" className="transition-colors hover:text-white" data-testid="link-footer-high-risk">
                  High-Risk Merchants
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-white" data-testid="link-footer-features">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/refer" className="transition-colors hover:text-primary text-primary/80 font-medium" data-testid="link-footer-refer-biz">
                  Earn Residual Income →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-white" data-testid="link-footer-how">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-white" data-testid="link-footer-faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white" data-testid="link-footer-contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/connect" className="transition-colors hover:text-white" data-testid="link-footer-connect">
                  Connect With Us
                </Link>
              </li>
              <li>
                <Link href="/refer" className="transition-colors hover:text-primary text-primary/80 font-medium" data-testid="link-footer-refer">
                  Refer a Business & Earn
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-white" data-testid="link-footer-top">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white">Serving Hawai'i</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><a href="/locations/oahu" className="transition-colors hover:text-white">Honolulu & O'ahu</a></li>
              <li><a href="/locations/maui" className="transition-colors hover:text-white">Maui</a></li>
              <li><a href="/locations/big-island" className="transition-colors hover:text-white">Big Island (Kona & Hilo)</a></li>
              <li><a href="/locations/kauai" className="transition-colors hover:text-white">Kaua'i & Neighbor Islands</a></li>
            </ul>
          </div>
        </div>

        {/* Google Map */}
        <div className="mt-10 rounded-xl overflow-hidden border border-white/10">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3717.2!2d-157.8275!3d21.2942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7c006dfa9353113f%3A0x0!2s1917+S+King+St%2C+Honolulu%2C+HI+96826!5e0!3m2!1sen!2sus!4v1"
            width="100%"
            height="200"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="TechSavvy Hawaii Location"
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>

        <div className="border-t border-white/10 mt-10 pt-8 text-center text-xs text-white/50">
          <p className="mb-2 text-white/70 text-sm">Mahalo for visiting TechSavvy Hawaii 🤙</p>
          &copy; {new Date().getFullYear()} TechSavvy Hawaii. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showExit, setShowExit] = useState(false);
  const exitShown = useRef(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShown.current) {
        exitShown.current = true;
        setShowExit(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Breadcrumb />
      <main id="main-content" role="main">{children}</main>
      <Footer />

      {/* Exit-intent popup */}
      {showExit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowExit(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowExit(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="text-4xl mb-3">🤙</div>
            <h3 className="text-2xl font-extrabold mb-2 font-heading">Wait — before you go!</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Find out exactly how much you're losing to processing fees. Our AI analyzes your statement in under 60 seconds.
            </p>
            <a
              href="/statement-review"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm hover:bg-primary/90 transition-colors w-full"
            >
              Get My Free AI Analysis
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-muted-foreground mt-3">Free. No commitment. Takes 60 seconds.</p>
          </div>
        </div>
      )}
    </div>
  );
}
